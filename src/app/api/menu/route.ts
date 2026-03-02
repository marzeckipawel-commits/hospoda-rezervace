import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const event = await prisma.event.findFirst({
    orderBy: { date: 'asc' },
  });
  if (!event) {
    return NextResponse.json({ error: 'no_event' }, { status: 404 });
  }
  const items = await prisma.menuItem.findMany({
    where: { eventId: event.id, isAvailable: true },
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
  });
  return NextResponse.json(items);
}
