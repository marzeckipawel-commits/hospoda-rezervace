import { z } from 'zod';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeText } from '@/lib/text';

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().min(1).optional(),
  priceCzk: z.number().int().min(0).optional(),
  countsTowardBurger: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.menuItem.findFirst({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_error', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const raw = parsed.data;
  const data: Record<string, unknown> = { ...raw };
  if (raw.name !== undefined) data.name = sanitizeText(raw.name);
  if (raw.description !== undefined) data.description = raw.description ? sanitizeText(raw.description) : null;
  const updated = await prisma.menuItem.update({
    where: { id },
    data,
  });
  return NextResponse.json({
    id: updated.id,
    eventId: updated.eventId,
    name: updated.name,
    description: updated.description,
    category: updated.category,
    priceCzk: updated.priceCzk,
    countsTowardBurger: updated.countsTowardBurger,
    isAvailable: updated.isAvailable,
    sortOrder: updated.sortOrder,
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.menuItem.findFirst({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  await prisma.menuItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
