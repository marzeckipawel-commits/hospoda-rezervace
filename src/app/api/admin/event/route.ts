import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const event = await prisma.event.findFirst({
    orderBy: { date: 'asc' },
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
    maxPeopleOnPremises: event.maxPeopleOnPremises,
    avgStayMinutes: event.avgStayMinutes,
    takeawayPeopleEquivalent: event.takeawayPeopleEquivalent,
    burgerTrackingEnabled: event.burgerTrackingEnabled,
  });
}

const patchSchema = {
  name: (v: unknown) => (typeof v === 'string' ? v : undefined),
  startTimeMinutes: (v: unknown) => (typeof v === 'number' && Number.isInteger(v) ? v : undefined),
  endTimeMinutes: (v: unknown) => (typeof v === 'number' && Number.isInteger(v) ? v : undefined),
  slotMinutes: (v: unknown) => (typeof v === 'number' && Number.isInteger(v) ? v : undefined),
  maxPeopleOnPremises: (v: unknown) => (typeof v === 'number' && Number.isInteger(v) ? v : undefined),
  avgStayMinutes: (v: unknown) => (typeof v === 'number' && Number.isInteger(v) ? v : undefined),
  takeawayPeopleEquivalent: (v: unknown) => (typeof v === 'number' && Number.isInteger(v) ? v : undefined),
  burgerTrackingEnabled: (v: unknown) => (typeof v === 'boolean' ? v : undefined),
};

export async function PATCH(req: Request) {
  const event = await prisma.event.findFirst({
    orderBy: { date: 'asc' },
  });
  if (!event) {
    return NextResponse.json({ error: 'no_event' }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const [key, fn] of Object.entries(patchSchema)) {
    if (body[key] !== undefined) {
      const val = (fn as (v: unknown) => unknown)(body[key]);
      if (val !== undefined) data[key] = val;
    }
  }
  const updated = await prisma.event.update({
    where: { id: event.id },
    data,
  });
  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    date: updated.date.toISOString().slice(0, 10),
    startTimeMinutes: updated.startTimeMinutes,
    endTimeMinutes: updated.endTimeMinutes,
    slotMinutes: updated.slotMinutes,
    maxPeopleOnPremises: updated.maxPeopleOnPremises,
    avgStayMinutes: updated.avgStayMinutes,
    takeawayPeopleEquivalent: updated.takeawayPeopleEquivalent,
    burgerTrackingEnabled: updated.burgerTrackingEnabled,
  });
}
