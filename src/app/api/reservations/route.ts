import { z } from 'zod';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkCapacity } from '@/lib/capacity';
import { generatePublicCode, generateManageToken } from '@/lib/codes';
import {
  sendReservationConfirmation,
  sendAdminReservationNotification,
} from '@/lib/email';

const reservationItemSchema = z.object({
  menuItemId: z.string(),
  quantity: z.number().int().min(0),
});

const bodySchema = z.object({
  type: z.enum(['DINE_IN', 'TAKEAWAY']),
  slotStartUtc: z.string().datetime(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  partySize: z.number().int().min(1).optional(),
  note: z.string().optional(),
  items: z.array(reservationItemSchema).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_error', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  if (data.type === 'DINE_IN' && (data.partySize == null || data.partySize < 1)) {
    return NextResponse.json(
      { error: 'validation_error', message: 'DINE_IN vyžaduje počet osob' },
      { status: 400 }
    );
  }

  const items = (data.items ?? []).filter((i) => i.quantity > 0);
  const hasPreorder = items.length > 0;
  if (data.type === 'TAKEAWAY' && !hasPreorder) {
    return NextResponse.json(
      { error: 'validation_error', message: 'TAKEAWAY vyžaduje alespoň jednu položku předobjednávky' },
      { status: 400 }
    );
  }

  const event = await prisma.event.findFirst({ orderBy: { date: 'asc' } });
  if (!event) {
    return NextResponse.json({ error: 'no_event' }, { status: 404 });
  }

  const slotStartUtc = new Date(data.slotStartUtc);
  const slotEndUtc = new Date(
    slotStartUtc.getTime() + event.avgStayMinutes * 60 * 1000
  );

  if (data.type === 'DINE_IN') {
    const { ok } = await checkCapacity(
      event.id,
      slotStartUtc,
      data.partySize!,
      event.avgStayMinutes,
      event.maxPeopleOnPremises
    );
    if (!ok) {
      return NextResponse.json({ error: 'capacity_full' }, { status: 409 });
    }
  }

  let publicCode = generatePublicCode();
  let manageToken = generateManageToken();
  const existingCodes = await prisma.reservation.findMany({
    where: { OR: [{ publicCode }, { manageToken }] },
    select: { id: true },
  });
  while (existingCodes.length > 0) {
    publicCode = generatePublicCode();
    manageToken = generateManageToken();
    const again = await prisma.reservation.findMany({
      where: { OR: [{ publicCode }, { manageToken }] },
      select: { id: true },
    });
    if (again.length === 0) break;
  }

  const reservation = await prisma.reservation.create({
    data: {
      eventId: event.id,
      type: data.type,
      slotStartUtc,
      slotEndUtc,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: data.email,
      partySize: data.type === 'DINE_IN' ? data.partySize! : null,
      note: data.note ?? null,
      hasPreorder: hasPreorder,
      publicCode,
      manageToken,
      items: hasPreorder
        ? {
            create: items.map((i) => ({
              menuItemId: i.menuItemId,
              quantity: i.quantity,
            })),
          }
        : undefined,
    },
    include: {
      items: { include: { menuItem: true } },
    },
  });

  const totalCzk = reservation.items.reduce(
    (s, i) => s + i.quantity * i.menuItem.priceCzk,
    0
  );
  const eventDateStr = event.date.toLocaleDateString('cs-CZ', {
    timeZone: 'Europe/Prague',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
  const emailResult = await sendReservationConfirmation(reservation.email, {
    eventName: event.name,
    eventDate: eventDateStr,
    slotStartPrague: slotStartUtc,
    type: reservation.type,
    partySize: reservation.partySize,
    items: reservation.items.map((i) => ({
      name: i.menuItem.name,
      quantity: i.quantity,
      priceCzk: i.menuItem.priceCzk,
    })),
    totalCzk,
    manageToken: reservation.manageToken,
  });
  if (emailResult.error) {
    console.error(
      'Reservation created but email failed:',
      emailResult.error.message
    );
    return NextResponse.json(
      {
        id: reservation.id,
        publicCode: reservation.publicCode,
        manageToken: reservation.manageToken,
        warning: 'email_failed',
        emailError: emailResult.error.message,
      },
      { status: 201 }
    );
  }

  const adminNotifyRaw =
    process.env.ADMIN_NOTIFY_EMAILS ?? 'rezervace@hospodauvavrince.cz';
  const adminEmails = adminNotifyRaw
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  console.log('Admin notify emails:', adminEmails);

  let adminWarning: string | undefined;
  let adminEmailError: string | undefined;

  if (adminEmails.length > 0) {
    const adminResult = await sendAdminReservationNotification(
      adminEmails,
      {
        eventName: event.name,
        eventDate: eventDateStr,
        slotStartPrague: slotStartUtc,
        type: reservation.type,
        partySize: reservation.partySize,
        firstName: reservation.firstName,
        lastName: reservation.lastName,
        phone: reservation.phone,
        email: reservation.email,
        note: reservation.note,
        items: reservation.items.map((i) => ({
          name: i.menuItem.name,
          quantity: i.quantity,
          priceCzk: i.menuItem.priceCzk,
        })),
        totalCzk,
        publicCode: reservation.publicCode,
        manageToken: reservation.manageToken,
      },
      'created'
    );
    if (adminResult.error) {
      console.error(
        'Admin notification failed for created reservation:',
        adminResult.error.message
      );
      adminWarning = 'admin_email_failed';
      adminEmailError = adminResult.error.message;
    }
  }

  return NextResponse.json({
    id: reservation.id,
    publicCode: reservation.publicCode,
    manageToken: reservation.manageToken,
    ...(adminWarning && {
      warning: adminWarning,
      adminEmailError,
    }),
  });
}
