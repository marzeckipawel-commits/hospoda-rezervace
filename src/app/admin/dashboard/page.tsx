'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Container, Card, CardHeader, CardBody, Notice } from '@/components/ui';

type Metrics = {
  eventId: string;
  eventName: string;
  date: string;
  maxPeopleOnPremises: number;
  occupancyBySlot: { slotStart: string; people: number }[];
  burgerTrackingEnabled: boolean;
  burgersTotal: number;
  burgersByHour: { hour: string; count: number }[];
  burgersBySlot: { slotStart: string; burgers: number }[];
};

function formatSlotPrague(iso: string): string {
  return new Date(iso).toLocaleTimeString('cs-CZ', {
    timeZone: 'Europe/Prague',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/metrics', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setMetrics(null);
        else setMetrics(data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Container>
        <p className="py-12 text-zinc-500">Načítání…</p>
      </Container>
    );
  }

  if (!metrics) {
    return (
      <Container>
        <Notice variant="error">Žádná data.</Notice>
        <Link href="/admin" className="mt-4 inline-block text-zinc-900 underline hover:text-zinc-700">
          Zpět na přihlášení
        </Link>
      </Container>
    );
  }

  return (
    <Container className="max-w-4xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Admin dashboard</h1>
        <nav className="flex flex-wrap gap-3 text-sm font-medium text-zinc-600">
          <Link
            href="/admin/reservations"
            className="hover:text-zinc-900"
          >
            Rezervace
          </Link>
          <Link
            href="/admin/reservations/timeline"
            className="hover:text-zinc-900"
          >
            Timeline
          </Link>
          <Link
            href="/admin/settings/event"
            className="hover:text-zinc-900"
          >
            Nastavení akce
          </Link>
          <Link
            href="/admin/settings/menu"
            className="hover:text-zinc-900"
          >
            Menu
          </Link>
        </nav>
      </div>

      <p className="mb-6 text-zinc-600">
        {metrics.eventName} · {metrics.date} · max. {metrics.maxPeopleOnPremises} osob v podniku
      </p>

      {metrics.burgerTrackingEnabled && (
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-lg font-semibold text-zinc-900">Burgery celkem</h2>
          </CardHeader>
          <CardBody>
            <p className="text-3xl font-bold text-zinc-900">{metrics.burgersTotal}</p>
          </CardBody>
        </Card>
      )}

      <Card className="mb-8">
        <CardHeader>
          <h2 className="text-lg font-semibold text-zinc-900">
            Obsazenost (lidé v podniku po 15 min slotech)
          </h2>
        </CardHeader>
        <CardBody>
          <div className="max-h-80 overflow-y-auto rounded-xl border border-zinc-200">
            <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4 md:grid-cols-6">
              {metrics.occupancyBySlot.map((slot) => (
                <div
                  key={slot.slotStart}
                  className="rounded-xl border border-zinc-100 bg-zinc-50 p-2 text-center"
                >
                  <div className="text-xs text-zinc-500">
                    {formatSlotPrague(slot.slotStart)}
                  </div>
                  <div className="font-semibold text-zinc-900">{slot.people}</div>
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {metrics.burgerTrackingEnabled && metrics.burgersByHour.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-lg font-semibold text-zinc-900">Burgery po hodinách</h2>
          </CardHeader>
          <CardBody>
            <div className="max-h-60 overflow-y-auto rounded-xl border border-zinc-200 divide-y divide-zinc-100">
              {metrics.burgersByHour.map(({ hour, count }) => (
                <div
                  key={hour}
                  className="flex justify-between px-4 py-2"
                >
                  <span className="text-zinc-700">{hour}</span>
                  <span className="font-medium text-zinc-900">{count}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
        Odhlásit (zpět na přihlášení)
      </Link>
    </Container>
  );
}
