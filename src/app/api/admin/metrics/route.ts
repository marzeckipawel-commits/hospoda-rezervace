export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOccupancyForSlot } from '@/lib/capacity';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

const SLOT_MS = 15 * 60 * 1000;

function getPragueOffsetHours(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  const noonUtc = new Date(Date.UTC(y, m, d, 12, 0, 0));
  const pragueHour = parseInt(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Prague',
      hour: 'numeric',
      hour12: false,
    }).format(noonUtc),
    10
  );
  return pragueHour - 12;
}

export async function GET() {
  const event = await prisma.event.findFirst({
    orderBy: { date: 'asc' },
  });
  if (!event) {
    return NextResponse.json({ error: 'no_event' }, { status: 404 });
  }

  const startMinutes = event.startTimeMinutes;
  const endMinutes = event.endTimeMinutes;
  const slotMinutes = event.slotMinutes;

  const dateStr = event.date.toISOString().slice(0, 10);
  const [y, mo, d] = dateStr.split('-').map(Number);
  const offsetHours = getPragueOffsetHours(event.date);

  const minutesToUtc = (minutesFromMidnight: number): Date => {
    const h = Math.floor(minutesFromMidnight / 60);
    const min = minutesFromMidnight % 60;
    const utcHour = h - offsetHours;
    return new Date(Date.UTC(y, mo - 1, d, utcHour, min, 0));
  };

  const firstSlotStart = minutesToUtc(startMinutes);
  const lastSlotMinutes = endMinutes - slotMinutes;

  const occupancyBySlot: { slotStart: string; people: number }[] = [];
  let currentMinutes = startMinutes;
  while (currentMinutes <= lastSlotMinutes) {
    const currentUtc = minutesToUtc(currentMinutes);
    const people = await getOccupancyForSlot(
      event.id,
      currentUtc,
      event.avgStayMinutes
    );
    occupancyBySlot.push({
      slotStart: currentUtc.toISOString(),
      people,
    });
    currentMinutes += slotMinutes;
  }

  if (process.env.NODE_ENV !== 'production') {
    const allReservations = await prisma.reservation.findMany({
      where: { eventId: event.id },
      orderBy: { slotStartUtc: 'asc' },
      select: {
        slotStartUtc: true,
        slotEndUtc: true,
        type: true,
        status: true,
        partySize: true,
      },
    });
    const minSlot = allReservations[0]?.slotStartUtc;
    const maxSlot = allReservations[allReservations.length - 1]?.slotStartUtc;
    console.log('ADMIN METRICS EVENT CONFIG:', {
      date: event.date.toISOString(),
      startMinutes,
      endMinutes,
      slotMinutes,
      avgStayMinutes: event.avgStayMinutes,
      maxPeopleOnPremises: event.maxPeopleOnPremises,
    });
    console.log('ADMIN METRICS RESERVATIONS COUNT:', allReservations.length);
    if (minSlot && maxSlot) {
      const pragueFormatter = new Intl.DateTimeFormat('cs-CZ', {
        timeZone: 'Europe/Prague',
        hour: '2-digit',
        minute: '2-digit',
      });
      console.log('ADMIN METRICS RESERVATIONS MIN/MAX UTC:', {
        minUtc: minSlot.toISOString(),
        maxUtc: maxSlot.toISOString(),
        minPrague: pragueFormatter.format(minSlot),
        maxPrague: pragueFormatter.format(maxSlot),
      });
    }
    console.log(
      'ADMIN METRICS FIRST/LAST SLOT (UTC/Prague):',
      occupancyBySlot[0]
        ? {
            firstUtc: occupancyBySlot[0].slotStart,
            firstPrague: new Date(
              occupancyBySlot[0].slotStart
            ).toLocaleTimeString('cs-CZ', {
              timeZone: 'Europe/Prague',
              hour: '2-digit',
              minute: '2-digit',
            }),
          }
        : null,
      occupancyBySlot[occupancyBySlot.length - 1]
        ? {
            lastUtc: occupancyBySlot[occupancyBySlot.length - 1].slotStart,
            lastPrague: new Date(
              occupancyBySlot[occupancyBySlot.length - 1].slotStart
            ).toLocaleTimeString('cs-CZ', {
              timeZone: 'Europe/Prague',
              hour: '2-digit',
              minute: '2-digit',
            }),
          }
        : null
    );
    console.log('ADMIN METRICS SLOT COUNT:', occupancyBySlot.length);
  }

  let burgersTotal = 0;
  const burgersByHour: Record<string, number> = {};
  const burgersBySlot: { slotStart: string; burgers: number }[] = [];

  if (event.burgerTrackingEnabled) {
    const itemsWithBurger = await prisma.reservationItem.findMany({
      where: {
        reservation: {
          eventId: event.id,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        menuItem: { countsTowardBurger: true },
      },
      include: {
        menuItem: true,
        reservation: { select: { slotStartUtc: true } },
      },
    });

    for (const ri of itemsWithBurger) {
      const burgers = ri.quantity;
      burgersTotal += burgers;
      const hourKey = format(ri.reservation.slotStartUtc, 'yyyy-MM-dd HH:00', {
        locale: cs,
      });
      burgersByHour[hourKey] = (burgersByHour[hourKey] ?? 0) + burgers;
      burgersBySlot.push({
        slotStart: ri.reservation.slotStartUtc.toISOString(),
        burgers,
      });
    }
  }

  const burgersByHourArray = Object.entries(burgersByHour).map(
    ([hour, count]) => ({
      hour,
      count,
    })
  );

  return NextResponse.json({
    eventId: event.id,
    eventName: event.name,
    date: event.date.toISOString().slice(0, 10),
    maxPeopleOnPremises: event.maxPeopleOnPremises,
    occupancyBySlot,
    burgerTrackingEnabled: event.burgerTrackingEnabled,
    burgersTotal,
    burgersByHour: burgersByHourArray,
    burgersBySlot,
  });
}
