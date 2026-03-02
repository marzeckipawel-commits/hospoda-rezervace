import { prisma } from './prisma';

const SLOT_MS = 15 * 60 * 1000;

export async function getOccupancyForSlot(
  eventId: string,
  slotStartUtc: Date,
  _avgStayMinutes: number
): Promise<number> {
  const bucketEnd = new Date(slotStartUtc.getTime() + SLOT_MS);
  const reservations = await prisma.reservation.findMany({
    where: {
      eventId,
      type: 'DINE_IN',
      status: { in: ['PENDING', 'CONFIRMED'] },
      slotStartUtc: { lt: bucketEnd },
      slotEndUtc: { gt: slotStartUtc },
    },
    select: { partySize: true },
  });
  return reservations.reduce((sum, r) => sum + (r.partySize ?? 0), 0);
}

export async function checkCapacity(
  eventId: string,
  slotStartUtc: Date,
  partySize: number,
  avgStayMinutes: number,
  maxPeople: number,
  excludeReservationId?: string
): Promise<{ ok: boolean }> {
  const stayEnd = new Date(slotStartUtc.getTime() + avgStayMinutes * 60 * 1000);
  let currentSlot = new Date(slotStartUtc);
  const buckets: { start: Date; end: Date }[] = [];
  while (currentSlot.getTime() < stayEnd.getTime()) {
    const end = new Date(currentSlot.getTime() + SLOT_MS);
    buckets.push({ start: new Date(currentSlot), end });
    currentSlot = end;
  }

  for (const bucket of buckets) {
    const occupancy = await getOccupancyForSlot(eventId, bucket.start, avgStayMinutes);
    let add = partySize;
    if (excludeReservationId) {
      const excluding = await prisma.reservation.findFirst({
        where: {
          id: excludeReservationId,
          eventId,
          type: 'DINE_IN',
          status: { in: ['PENDING', 'CONFIRMED'] },
          slotStartUtc: { lt: new Date(bucket.start.getTime() + avgStayMinutes * 60 * 1000) },
          slotEndUtc: { gt: bucket.start },
        },
        select: { partySize: true },
      });
      if (excluding) add -= excluding.partySize ?? 0;
    }
    if (occupancy + add > maxPeople) return { ok: false };
  }
  return { ok: true };
}
