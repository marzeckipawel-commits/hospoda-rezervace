'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Container, Card, CardHeader, CardBody, Notice } from '@/components/ui';

type ReservationType = 'DINE_IN' | 'TAKEAWAY';
type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

type AdminReservation = {
  id: string;
  status: ReservationStatus;
  type: ReservationType;
  slotStartUtc: string;
  partySize: number | null;
  firstName: string;
  lastName: string;
};

type ApiResponse = {
  event: {
    id: string;
    name: string;
    date: string;
    startTimeMinutes: number;
    endTimeMinutes: number;
    slotMinutes: number;
    maxPeopleOnPremises: number;
  };
  reservations: {
    id: string;
    status: ReservationStatus;
    type: ReservationType;
    slotStartUtc: string;
    partySize: number | null;
    firstName: string;
    lastName: string;
  }[];
};

function formatTimePrague(iso: string): string {
  return new Date(iso).toLocaleTimeString('cs-CZ', {
    timeZone: 'Europe/Prague',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getPragueOffsetHoursFromDate(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
  const noonUtc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
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

export default function AdminReservationsTimelinePage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/reservations', {
          credentials: 'include',
        });
        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error || 'Načtení rezervací selhalo');
        }
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Chyba načítání');
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const slots = useMemo(() => {
    if (!data) return [] as { utc: Date; label: string }[];
    const { date, startTimeMinutes, endTimeMinutes, slotMinutes } = data.event;
    const offsetHours = getPragueOffsetHoursFromDate(date);
    const [y, m, d] = date.split('-').map((v) => parseInt(v, 10));

    const minutesToUtc = (minutesFromMidnight: number): Date => {
      const h = Math.floor(minutesFromMidnight / 60);
      const min = minutesFromMidnight % 60;
      const utcHour = h - offsetHours;
      return new Date(Date.UTC(y, m - 1, d, utcHour, min, 0));
    };

    const result: { utc: Date; label: string }[] = [];
    let current = startTimeMinutes;
    const last = endTimeMinutes - slotMinutes;
    while (current <= last) {
      const utc = minutesToUtc(current);
      result.push({ utc, label: formatTimePrague(utc.toISOString()) });
      current += slotMinutes;
    }
    return result;
  }, [data]);

  const slotsWithData = useMemo(() => {
    if (!data) return [] as {
      utc: Date;
      label: string;
      reservations: AdminReservation[];
      totalPeople: number;
    }[];
    const activeReservations = data.reservations.filter(
      (r) => r.type === 'DINE_IN' && r.status !== 'CANCELLED'
    );
    return slots.map((slot) => {
      const reservations = activeReservations.filter((r) => {
        const t = new Date(r.slotStartUtc).getTime();
        return t === slot.utc.getTime();
      });
      const totalPeople = reservations.reduce(
        (sum, r) => sum + (r.partySize ?? 0),
        0
      );
      return {
        utc: slot.utc,
        label: slot.label,
        reservations,
        totalPeople,
      };
    });
  }, [data, slots]);

  if (loading) {
    return (
      <Container>
        <p className="py-12 text-zinc-500">Načítání…</p>
      </Container>
    );
  }

  if (error || !data) {
    return (
      <Container>
        <Notice variant="error">{error || 'Nepodařilo se načíst timeline.'}</Notice>
        <Link
          href="/admin/dashboard"
          className="mt-4 inline-block text-sm text-zinc-600 hover:text-zinc-900"
        >
          ← Zpět na dashboard
        </Link>
      </Container>
    );
  }

  const maxPeople = data.event.maxPeopleOnPremises || 1;

  return (
    <Container className="max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Timeline rezervací</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {data.event.name} · {data.event.date}
          </p>
        </div>
        <Link
          href="/admin/reservations"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          ← Tabulka rezervací
        </Link>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-zinc-900">
            Přehled po 15 min slotech
          </h2>
        </CardHeader>
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {slotsWithData.map((slot) => {
              const ratio = slot.totalPeople / maxPeople;
              const colorClass =
                ratio > 0.8
                  ? 'border-red-200 bg-red-50'
                  : ratio > 0.5
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-emerald-200 bg-emerald-50';
              return (
                <div
                  key={slot.utc.toISOString()}
                  className={`rounded-2xl border p-3 text-sm ${colorClass}`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-semibold text-zinc-900">
                      {slot.label}
                    </span>
                    <span className="text-xs text-zinc-600">
                      {slot.totalPeople} / {maxPeople} osob
                    </span>
                  </div>
                  {slot.reservations.length === 0 ? (
                    <p className="mt-1 text-xs text-zinc-500">
                      Žádné rezervace v tomto slotu.
                    </p>
                  ) : (
                    <ul className="mt-1 space-y-1 text-xs text-zinc-800">
                      {slot.reservations.map((r) => (
                        <li key={r.id}>
                          {r.firstName} {r.lastName} ({r.partySize ?? 0} osob)
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </Container>
  );
}

