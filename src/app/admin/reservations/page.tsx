'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Container,
  Card,
  CardHeader,
  CardBody,
  Label,
  Input,
  Button,
  Notice,
  Select,
} from '@/components/ui';

type ReservationType = 'DINE_IN' | 'TAKEAWAY';
type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

type AdminReservationItem = {
  id: string;
  quantity: number;
  menuItem: {
    id: string;
    name: string;
    category: string;
    priceCzk: number;
    countsTowardBurger: boolean;
  };
};

type AdminReservation = {
  id: string;
  status: ReservationStatus;
  type: ReservationType;
  slotStartUtc: string;
  slotEndUtc: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  partySize: number | null;
  note: string | null;
  publicCode: string;
  hasPreorder: boolean;
  summary: {
    itemsCount: number;
    burgersCount: number;
    totalCzk: number;
  };
  items: AdminReservationItem[];
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
  reservations: AdminReservation[];
};

function formatTimePrague(iso: string): string {
  return new Date(iso).toLocaleTimeString('cs-CZ', {
    timeZone: 'Europe/Prague',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminReservationsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<'ALL' | ReservationType>('ALL');
  const [statusFilter, setStatusFilter] =
    useState<'ALL' | 'ACTIVE' | ReservationStatus>('ACTIVE');
  const [search, setSearch] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');

  const [selectedReservation, setSelectedReservation] =
    useState<AdminReservation | null>(null);

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

  const filteredReservations = useMemo(() => {
    if (!data) return [];
    return data.reservations.filter((r) => {
      if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
      if (statusFilter === 'ACTIVE') {
        if (r.status === 'CANCELLED') return false;
      } else if (statusFilter !== 'ALL' && r.status !== statusFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const haystack = `${r.firstName} ${r.lastName} ${r.phone} ${r.email}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (timeFrom || timeTo) {
        const d = new Date(r.slotStartUtc);
        const hhmm = d.toLocaleTimeString('cs-CZ', {
          timeZone: 'Europe/Prague',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
        const minutes = h * 60 + m;
        if (timeFrom) {
          const [fh, fm] = timeFrom.split(':').map((x) => parseInt(x, 10));
          const fromMin = fh * 60 + fm;
          if (minutes < fromMin) return false;
        }
        if (timeTo) {
          const [th, tm] = timeTo.split(':').map((x) => parseInt(x, 10));
          const toMin = th * 60 + tm;
          if (minutes > toMin) return false;
        }
      }
      return true;
    });
  }, [data, typeFilter, statusFilter, search, timeFrom, timeTo]);

  const handleExportCsv = () => {
    if (!filteredReservations.length) return;
    const header = [
      'Čas',
      'Typ',
      'Osoby',
      'Jméno',
      'Příjmení',
      'Telefon',
      'Email',
      'Poznámka',
      'Položek',
      'Burgery',
      'CelkemKc',
      'Stav',
      'Kód',
    ];
    const rows = filteredReservations.map((r) => [
      formatTimePrague(r.slotStartUtc),
      r.type,
      r.type === 'DINE_IN' ? String(r.partySize ?? 0) : '',
      r.firstName,
      r.lastName,
      r.phone,
      r.email,
      (r.note || '').replace(/\s+/g, ' '),
      String(r.summary.itemsCount),
      String(r.summary.burgersCount),
      String(r.summary.totalCzk),
      r.status,
      r.publicCode,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reservations.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

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
        <Notice variant="error">{error || 'Nepodařilo se načíst rezervace.'}</Notice>
        <Link
          href="/admin/dashboard"
          className="mt-4 inline-block text-sm text-zinc-600 hover:text-zinc-900"
        >
          ← Zpět na dashboard
        </Link>
      </Container>
    );
  }

  return (
    <Container className="max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Rezervace</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {data.event.name} · {data.event.date}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" type="button" onClick={handlePrint}>
            Tisk
          </Button>
          <Button variant="secondary" type="button" onClick={handleExportCsv}>
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Filtry
          </h2>
        </CardHeader>
        <CardBody>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <div className="w-full sm:w-40">
              <Label>Typ</Label>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="mt-1"
              >
                <option value="ALL">Vše</option>
                <option value="DINE_IN">Na místě</option>
                <option value="TAKEAWAY">S sebou</option>
              </Select>
            </div>
            <div className="w-full sm:w-40">
              <Label>Stav</Label>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="mt-1"
              >
                <option value="ACTIVE">Aktivní</option>
                <option value="ALL">Vše</option>
                <option value="PENDING">Čeká</option>
                <option value="CONFIRMED">Potvrzeno</option>
                <option value="CANCELLED">Zrušeno</option>
              </Select>
            </div>
            <div className="flex-1 min-w-[160px]">
              <Label>Hledat (jméno, telefon, e-mail)</Label>
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mt-1"
                placeholder="Např. Novák, 777..."
              />
            </div>
            <div className="w-full sm:w-32">
              <Label>Čas od</Label>
              <Input
                type="time"
                value={timeFrom}
                onChange={(e) => setTimeFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="w-full sm:w-32">
              <Label>Čas do</Label>
              <Input
                type="time"
                value={timeTo}
                onChange={(e) => setTimeTo(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <h2 className="text-lg font-semibold text-zinc-900">Přehled rezervací</h2>
        </CardHeader>
        <CardBody>
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-left text-sm text-zinc-800">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Čas</th>
                  <th className="px-3 py-2">Typ</th>
                  <th className="px-3 py-2">Osoby</th>
                  <th className="px-3 py-2">Jméno</th>
                  <th className="px-3 py-2">Telefon</th>
                  <th className="px-3 py-2">Poznámka</th>
                  <th className="px-3 py-2">Předobjednávka</th>
                  <th className="px-3 py-2">Stav</th>
                  <th className="px-3 py-2 text-right">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredReservations.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatTimePrague(r.slotStartUtc)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${{
                          DINE_IN: 'bg-emerald-50 text-emerald-700',
                          TAKEAWAY: 'bg-amber-50 text-amber-700',
                        }[r.type]}`}
                      >
                        {r.type === 'DINE_IN' ? 'Na místě' : 'S sebou'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.type === 'DINE_IN' ? r.partySize ?? 0 : ''}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.firstName} {r.lastName}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <a href={`tel:${r.phone}`} className="text-zinc-900 hover:underline">
                        {r.phone}
                      </a>
                    </td>
                    <td className="px-3 py-2 max-w-xs truncate">
                      {r.note}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-zinc-700">
                      {r.summary.itemsCount > 0 ? (
                        <span>
                          {r.summary.itemsCount} položek,{' '}
                          {r.summary.burgersCount} burgerů,{' '}
                          {r.summary.totalCzk} Kč
                        </span>
                      ) : (
                        <span>Bez předobjednávky</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 font-medium ${{
                          PENDING: 'bg-amber-50 text-amber-800',
                          CONFIRMED: 'bg-emerald-50 text-emerald-800',
                          CANCELLED: 'bg-red-50 text-red-800',
                        }[r.status]}`}
                      >
                        {r.status === 'PENDING'
                          ? 'Čeká'
                          : r.status === 'CONFIRMED'
                          ? 'Potvrzeno'
                          : 'Zrušeno'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        type="button"
                        variant="secondary"
                        className="px-3 py-1 text-xs"
                        onClick={() => setSelectedReservation(r)}
                      >
                        Detail
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredReservations.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-3 py-6 text-center text-sm text-zinc-500">
                      Žádné rezervace pro zadané filtry.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked view */}
          <div className="space-y-3 md:hidden">
            {filteredReservations.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium text-zinc-900">
                    {formatTimePrague(r.slotStartUtc)} ·{' '}
                    {r.firstName} {r.lastName}
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${{
                      DINE_IN: 'bg-emerald-50 text-emerald-700',
                      TAKEAWAY: 'bg-amber-50 text-amber-700',
                    }[r.type]}`}
                  >
                    {r.type === 'DINE_IN' ? 'Na místě' : 'S sebou'}
                  </span>
                </div>
                <div className="mt-1 text-xs text-zinc-600">
                  {r.type === 'DINE_IN' && (
                    <span className="mr-2">Osob: {r.partySize ?? 0}</span>
                  )}
                  <span>Tel.: {r.phone}</span>
                </div>
                {r.note && (
                  <div className="mt-1 text-xs text-zinc-500">Pozn.: {r.note}</div>
                )}
                <div className="mt-2 text-xs text-zinc-700">
                  {r.summary.itemsCount > 0 ? (
                    <span>
                      Předobjednávka: {r.summary.itemsCount} položek,{' '}
                      {r.summary.burgersCount} burgerů, {r.summary.totalCzk} Kč
                    </span>
                  ) : (
                    <span>Bez předobjednávky</span>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${{
                      PENDING: 'bg-amber-50 text-amber-800',
                      CONFIRMED: 'bg-emerald-50 text-emerald-800',
                      CANCELLED: 'bg-red-50 text-red-800',
                    }[r.status]}`}
                  >
                    {r.status === 'PENDING'
                      ? 'Čeká'
                      : r.status === 'CONFIRMED'
                      ? 'Potvrzeno'
                      : 'Zrušeno'}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    className="px-3 py-1 text-xs"
                    onClick={() => setSelectedReservation(r)}
                  >
                    Detail
                  </Button>
                </div>
              </div>
            ))}
            {filteredReservations.length === 0 && (
              <p className="py-6 text-center text-sm text-zinc-500">
                Žádné rezervace pro zadané filtry.
              </p>
            )}
          </div>
        </CardBody>
      </Card>

      {selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  Detail rezervace
                </h2>
                <p className="text-sm text-zinc-600">
                  {formatTimePrague(selectedReservation.slotStartUtc)} ·{' '}
                  {selectedReservation.firstName} {selectedReservation.lastName}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="px-3 py-1 text-xs"
                onClick={() => setSelectedReservation(null)}
              >
                Zavřít
              </Button>
            </div>
            <div className="space-y-2 text-sm text-zinc-700">
              <p>
                <strong>Typ:</strong>{' '}
                {selectedReservation.type === 'DINE_IN' ? 'Na místě' : 'S sebou'}
              </p>
              {selectedReservation.type === 'DINE_IN' && (
                <p>
                  <strong>Osob:</strong> {selectedReservation.partySize ?? 0}
                </p>
              )}
              <p>
                <strong>Telefon:</strong>{' '}
                <a
                  href={`tel:${selectedReservation.phone}`}
                  className="text-zinc-900 hover:underline"
                >
                  {selectedReservation.phone}
                </a>
              </p>
              <p>
                <strong>E-mail:</strong> {selectedReservation.email}
              </p>
              {selectedReservation.note && (
                <p>
                  <strong>Poznámka:</strong> {selectedReservation.note}
                </p>
              )}
              <p>
                <strong>Kód:</strong> {selectedReservation.publicCode}
              </p>
              <p>
                <strong>Předobjednávka:</strong>{' '}
                {selectedReservation.summary.itemsCount > 0 ? (
                  <span>
                    {selectedReservation.summary.itemsCount} položek,{' '}
                    {selectedReservation.summary.burgersCount} burgerů,{' '}
                    {selectedReservation.summary.totalCzk} Kč
                  </span>
                ) : (
                  <span>Bez předobjednávky</span>
                )}
              </p>
              {selectedReservation.items.length > 0 && (
                <div className="mt-2">
                  <strong>Položky:</strong>
                  <ul className="mt-1 list-disc pl-5 text-xs text-zinc-700">
                    {selectedReservation.items.map((it) => (
                      <li key={it.id}>
                        {it.menuItem.name} × {it.quantity} –{' '}
                        {it.quantity * it.menuItem.priceCzk} Kč
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}

