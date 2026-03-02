import { z } from 'zod';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkCapacity } from '@/lib/capacity';
import { sendReservationConfirmation } from '@/lib/email';

const reservationItemSchema = z.object({
  menuItemId: z.string(),
  quantity: z.number().int().min(0),
});

const patchBodySchema = z.object({
  type: z.enum(['DINE_IN', 'TAKEAWAY']).optional(),
  slotStartUtc: z.string().datetime().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),
  partySize: z.number().int().min(1).nullable().optional(),
  note: z.string().nullable().optional(),
  items: z.array(reservationItemSchema).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const reservation = await prisma.reservation.findFirst({
    where: { manageToken: token, status: { not: 'CANCELLED' } },
    include: {
      event: true,
      items: { include: { menuItem: true } },
    },
  });
  if (!reservation) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json({
    id: reservation.id,
    status: reservation.status,
    type: reservation.type,
    slotStartUtc: reservation.slotStartUtc.toISOString(),
    slotEndUtc: reservation.slotEndUtc.toISOString(),
    firstName: reservation.firstName,
    lastName: reservation.lastName,
    phone: reservation.phone,
    email: reservation.email,
    partySize: reservation.partySize,
    note: reservation.note,
    hasPreorder: reservation.hasPreorder,
    publicCode: reservation.publicCode,
    event: {
      id: reservation.event.id,
      name: reservation.event.name,
      date: reservation.event.date.toISOString().slice(0, 10),
      startTimeMinutes: reservation.event.startTimeMinutes,
      endTimeMinutes: reservation.event.endTimeMinutes,
      slotMinutes: reservation.event.slotMinutes,
    },
    menuItems: await prisma.menuItem.findMany({
      where: { eventId: reservation.eventId, isAvailable: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        priceCzk: true,
        countsTowardBurger: true,
        sortOrder: true,
      },
    }),
    items: reservation.items.map((i) => ({
      menuItemId: i.menuItemId,
      quantity: i.quantity,
      name: i.menuItem.name,
      priceCzk: i.menuItem.priceCzk,
    })),
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const reservation = await prisma.reservation.findFirst({
    where: { manageToken: token, status: { not: 'CANCELLED' } },
    include: { event: true, items: true },
  });
  if (!reservation) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = patchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_error', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const type = data.type ?? reservation.type;
  const slotStartUtc = data.slotStartUtc
    ? new Date(data.slotStartUtc)
    : reservation.slotStartUtc;
  const partySize =
    data.partySize !== undefined ? data.partySize : reservation.partySize;

  if (type === 'DINE_IN' && (partySize == null || partySize < 1)) {
    return NextResponse.json(
      { error: 'validation_error', message: 'DINE_IN vyžaduje počet osob' },
      { status: 400 }
    );
  }

  const items = (
    data.items ?? reservation.items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity }))
  ).filter((i: { quantity: number }) => i.quantity > 0);
  const hasPreorder = items.length > 0;
  if (type === 'TAKEAWAY' && !hasPreorder) {
    return NextResponse.json(
      { error: 'validation_error', message: 'TAKEAWAY vyžaduje alespoň jednu položku' },
      { status: 400 }
    );
  }

  const event = reservation.event;
  const slotEndUtc = new Date(
    slotStartUtc.getTime() + event.avgStayMinutes * 60 * 1000
  );

  if (type === 'DINE_IN') {
    const { ok } = await checkCapacity(
      event.id,
      slotStartUtc,
      partySize!,
      event.avgStayMinutes,
      event.maxPeopleOnPremises,
      reservation.id
    );
    if (!ok) {
      return NextResponse.json({ error: 'capacity_full' }, { status: 409 });
    }
  }

  await prisma.reservationItem.deleteMany({
    where: { reservationId: reservation.id },
  });

  const updated = await prisma.reservation.update({
    where: { id: reservation.id },
    data: {
      ...(data.type !== undefined && { type: data.type }),
      ...(data.slotStartUtc !== undefined && {
        slotStartUtc,
        slotEndUtc,
      }),
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.partySize !== undefined && { partySize: data.partySize }),
      ...(data.note !== undefined && { note: data.note }),
      hasPreorder,
      items: hasPreorder
        ? {
            create: items.map((i: { menuItemId: string; quantity: number }) => ({
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

  const totalCzk = updated.items.reduce(
    (s, i) => s + i.quantity * i.menuItem.priceCzk,
    0
  );
  const eventDateStr = event.date.toLocaleDateString('cs-CZ', { timeZone: 'Europe/Prague' });
  const emailResult = await sendReservationConfirmation(updated.email, {
    eventName: event.name,
    eventDate: eventDateStr,
    slotStartPrague: updated.slotStartUtc,
    type: updated.type,
    partySize: updated.partySize,
    items: updated.items.map((i) => ({
      name: i.menuItem.name,
      quantity: i.quantity,
      priceCzk: i.menuItem.priceCzk,
    })),
    totalCzk,
    manageToken: updated.manageToken,
  });
  if (emailResult.error) {
    console.error('Reservation updated but email failed:', emailResult.error);
    return NextResponse.json(
      {
        id: updated.id,
        publicCode: updated.publicCode,
        status: updated.status,
        warning: 'email_failed',
        emailError: emailResult.error.message,
      },
      { status: 200 }
    );
  }

  return NextResponse.json({
    id: updated.id,
    publicCode: updated.publicCode,
    status: updated.status,
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const reservation = await prisma.reservation.findFirst({
    where: { manageToken: token },
  });
  if (!reservation) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  await prisma.reservation.update({
    where: { id: reservation.id },
    data: { status: 'CANCELLED' },
  });
  return NextResponse.json({ ok: true });
}
