export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeText } from '@/lib/text';

const menuItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  priceCzk: z.number().int().min(0),
  countsTowardBurger: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET() {
  const event = await prisma.event.findFirst({
    orderBy: { date: 'asc' },
  });
  if (!event) {
    return NextResponse.json({ error: 'no_event' }, { status: 404 });
  }
  const items = await prisma.menuItem.findMany({
    where: { eventId: event.id },
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json(
    items.map((i) => ({
      id: i.id,
      eventId: i.eventId,
      name: i.name,
      description: i.description,
      category: i.category,
      priceCzk: i.priceCzk,
      countsTowardBurger: i.countsTowardBurger,
      isAvailable: i.isAvailable,
      sortOrder: i.sortOrder,
    }))
  );
}

export async function POST(req: Request) {
  const event = await prisma.event.findFirst({
    orderBy: { date: 'asc' },
  });
  if (!event) {
    return NextResponse.json({ error: 'no_event' }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = menuItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_error', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const item = await prisma.menuItem.create({
    data: {
      eventId: event.id,
      name: sanitizeText(data.name),
      description: data.description != null ? sanitizeText(data.description) : null,
      category: data.category,
      priceCzk: data.priceCzk,
      countsTowardBurger: data.countsTowardBurger ?? false,
      isAvailable: data.isAvailable ?? true,
      sortOrder: data.sortOrder ?? 0,
    },
  });
  return NextResponse.json({
    id: item.id,
    eventId: item.eventId,
    name: item.name,
    description: item.description,
    category: item.category,
    priceCzk: item.priceCzk,
    countsTowardBurger: item.countsTowardBurger,
    isAvailable: item.isAvailable,
    sortOrder: item.sortOrder,
  });
}
