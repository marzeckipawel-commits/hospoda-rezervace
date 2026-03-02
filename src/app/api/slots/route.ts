import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
  const dateStr = event.date.toISOString().slice(0, 10);
  const [y, mo, d] = dateStr.split('-').map(Number);
  const offset = getPragueOffsetHours(event.date);
  const slots: { value: string; label: string }[] = [];
  let currentMinutes = event.startTimeMinutes;
  const endMinutes = event.endTimeMinutes;
  while (currentMinutes < endMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const min = currentMinutes % 60;
    const utcHour = h - offset;
    const utcDate = new Date(Date.UTC(y, mo - 1, d, utcHour, min, 0));
    const label = utcDate.toLocaleTimeString('cs-CZ', {
      timeZone: 'Europe/Prague',
      hour: '2-digit',
      minute: '2-digit',
    });
    slots.push({ value: utcDate.toISOString(), label });
    currentMinutes += event.slotMinutes;
  }
  return NextResponse.json(slots);
}
