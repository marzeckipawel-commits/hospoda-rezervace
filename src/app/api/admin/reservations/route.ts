import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  const statusParam = url.searchParams.get('status');
  const search = url.searchParams.get('q')?.trim() || '';

  const event = await prisma.event.findFirst({
    orderBy: { date: 'asc' },
  });
  if (!event) {
    return NextResponse.json({ error: 'no_event' }, { status: 404 });
  }

  const where: any = {
    eventId: event.id,
  };

  if (type === 'DINE_IN' || type === 'TAKEAWAY') {
    where.type = type;
  }

  if (statusParam) {
    const statuses = statusParam
      .split(',')
      .map((s) => s.trim())
      .filter((s) => ['PENDING', 'CONFIRMED', 'CANCELLED'].includes(s));
    if (statuses.length > 0) {
      where.status = { in: statuses as any };
    }
  }

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const reservations = await prisma.reservation.findMany({
    where,
    orderBy: { slotStartUtc: 'asc' },
    include: {
      items: {
        include: {
          menuItem: true,
        },
      },
    },
  });

  const data = reservations.map((r) => {
    const itemsCount = r.items.filter((it) => it.quantity > 0).length;
    let burgersCount = 0;
    let totalCzk = 0;
    for (const it of r.items) {
      const price = it.menuItem?.priceCzk ?? 0;
      totalCzk += it.quantity * price;
      if (it.menuItem?.countsTowardBurger) {
        burgersCount += it.quantity;
      }
    }
    return {
      id: r.id,
      eventId: r.eventId,
      status: r.status,
      type: r.type,
      slotStartUtc: r.slotStartUtc.toISOString(),
      slotEndUtc: r.slotEndUtc.toISOString(),
      firstName: r.firstName,
      lastName: r.lastName,
      phone: r.phone,
      email: r.email,
      partySize: r.partySize,
      note: r.note,
      publicCode: r.publicCode,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      hasPreorder: r.hasPreorder,
      summary: {
        itemsCount,
        burgersCount,
        totalCzk,
      },
      items: r.items.map((it) => ({
        id: it.id,
        quantity: it.quantity,
        menuItem: {
          id: it.menuItem.id,
          name: it.menuItem.name,
          category: it.menuItem.category,
          priceCzk: it.menuItem.priceCzk,
          countsTowardBurger: it.menuItem.countsTowardBurger,
        },
      })),
    };
  });

  return NextResponse.json({
    event: {
      id: event.id,
      name: event.name,
      date: event.date.toISOString().slice(0, 10),
      startTimeMinutes: event.startTimeMinutes,
      endTimeMinutes: event.endTimeMinutes,
      slotMinutes: event.slotMinutes,
      maxPeopleOnPremises: event.maxPeopleOnPremises,
    },
    reservations: data,
  });
}

