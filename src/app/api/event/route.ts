import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const event = await prisma.event.findFirst({
    orderBy: { date: 'asc' },
    select: {
      id: true,
      name: true,
      date: true,
      startTimeMinutes: true,
      endTimeMinutes: true,
      slotMinutes: true,
    },
  });
  if (!event) {
    return NextResponse.json({ error: 'no_event' }, { status: 404 });
  }
  return NextResponse.json({
    id: event.id,
    name: event.name,
    date: event.date.toISOString().slice(0, 10),
    startTimeMinutes: event.startTimeMinutes,
    endTimeMinutes: event.endTimeMinutes,
    slotMinutes: event.slotMinutes,
  });
}
