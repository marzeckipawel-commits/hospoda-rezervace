'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Container,
  Card,
  CardHeader,
  CardBody,
  Label,
  Input,
  Textarea,
  Select,
  Button,
  Badge,
  Notice,
  Divider,
} from '@/components/ui';
import { sanitizeText } from '@/lib/text';

type Event = {
  id: string;
  name: string;
  date: string;
  startTimeMinutes: number;
  endTimeMinutes: number;
  slotMinutes: number;
};

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  priceCzk: number;
  sortOrder: number;
};

type ReservationItem = {
  menuItemId: string;
  quantity: number;
  name: string;
  priceCzk: number;
};

type Reservation = {
  id: string;
  status: string;
  type: 'DINE_IN' | 'TAKEAWAY';
  slotStartUtc: string;
  slotEndUtc: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  partySize: number | null;
  note: string | null;
  hasPreorder: boolean;
  publicCode: string;
  event: Event;
  menuItems: MenuItem[];
  items: ReservationItem[];
};

type FormState = {
  type: 'DINE_IN' | 'TAKEAWAY';
  slotStartUtc: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  partySize: string;
  note: string;
  items: Record<string, number>;
};

function formatSlotToPrague(iso: string): string {
  return new Date(iso).toLocaleTimeString('cs-CZ', {
    timeZone: 'Europe/Prague',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SpravaRezervacePage() {
  const params = useParams();
  const token = params?.token as string;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [slotsList, setSlotsList] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/reservations/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError('Rezervace nenalezena.');
          setReservation(null);
          return;
        }
        setReservation(data);
        const itemsMap: Record<string, number> = {};
        data.menuItems?.forEach((m: MenuItem) => {
          const found = data.items?.find((i: ReservationItem) => i.menuItemId === m.id);
          itemsMap[m.id] = found ? found.quantity : 0;
        });
        setForm({
          type: data.type,
          slotStartUtc: data.slotStartUtc,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email: data.email,
          partySize: data.partySize != null ? String(data.partySize) : '1',
          note: data.note ?? '',
          items: itemsMap,
        });
        return fetch('/api/slots');
      })
      .then((r) => (r && r.ok ? r.json() : Promise.resolve([])))
      .then((slotsData: { value: string; label: string }[]) => {
        setSlotsList(Array.isArray(slotsData) ? slotsData : []);
      })
      .catch(() => setError('Chyba načtení.'))
      .finally(() => setLoading(false));
  }, [token]);

  const event = reservation?.event;
  const slots = slotsList;
  const menu = reservation?.menuItems ?? [];
  const totalCzk =
    form && menu.reduce((s, item) => s + (form.items[item.id] ?? 0) * item.priceCzk, 0);

  const canSave =
    form &&
    reservation &&
    form.slotStartUtc &&
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.phone.trim() &&
    form.email.trim() &&
    (form.type === 'TAKEAWAY' ? Object.values(form.items).some((q) => q > 0) : true) &&
    (form.type !== 'DINE_IN' || Number(form.partySize) >= 1);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave || !token) return;
    setSaveError(null);
    setSaving(true);
    const items = menu
      .filter((m) => (form!.items[m.id] ?? 0) > 0)
      .map((m) => ({ menuItemId: m.id, quantity: form!.items[m.id] ?? 0 }));
    const res = await fetch(`/api/reservations/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: form!.type,
        slotStartUtc: form!.slotStartUtc,
        firstName: form!.firstName.trim(),
        lastName: form!.lastName.trim(),
        phone: form!.phone.trim(),
        email: form!.email.trim(),
        partySize: form!.type === 'DINE_IN' ? Number(form!.partySize) : null,
        note: form!.note.trim() || null,
        items,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setSaveError(
        data.error === 'capacity_full' ? 'V tomto termínu je plná kapacita.' : 'Uložení se nepodařilo.'
      );
      return;
    }
    setReservation((r) => (r ? { ...r, slotStartUtc: form!.slotStartUtc, type: form!.type } : null));
  };

  const handleCancel = async () => {
    if (!token || !confirm('Opravdu chcete zrušit rezervaci?')) return;
    const res = await fetch(`/api/reservations/${token}`, { method: 'DELETE' });
    if (res.ok) setCancelled(true);
  };

  if (loading) {
    return (
      <Container>
        <p className="py-12 text-center text-zinc-500">Načítání…</p>
      </Container>
    );
  }

  if (error || !reservation || !form) {
    return (
      <Container>
        <Card className="max-w-xl mx-auto text-center">
          <CardBody>
            <Notice variant="error">{error ?? 'Rezervace nenalezena.'}</Notice>
            <Link href="/rezervace" className="mt-4 inline-block text-zinc-900 underline hover:text-zinc-700">
              Nová rezervace
            </Link>
          </CardBody>
        </Card>
      </Container>
    );
  }

  if (cancelled) {
    return (
      <Container>
        <Card className="max-w-xl mx-auto text-center">
          <CardBody>
            <h1 className="text-xl font-bold text-zinc-900">Rezervace zrušena</h1>
            <Link href="/rezervace" className="mt-4 inline-block text-zinc-900 underline hover:text-zinc-700">
              Vytvořit novou rezervaci
            </Link>
          </CardBody>
        </Card>
      </Container>
    );
  }

  const statusLabel = reservation.status === 'CANCELLED' ? 'Zrušeno' : 'Aktivní';
  const statusVariant = reservation.status === 'CANCELLED' ? 'danger' : 'success';

  return (
    <Container>
      <Link href="/rezervace" className="mb-6 inline-block text-sm text-zinc-600 hover:text-zinc-900">
        ← Zpět na rezervaci
      </Link>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Správa rezervace</h1>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>
          <p className="mt-2 text-zinc-600">
            Kód: <strong>{reservation.publicCode}</strong> · {reservation.event.name} ·{' '}
            {reservation.event.date} · {formatSlotToPrague(reservation.slotStartUtc)} (Praha)
          </p>
          <p className="mt-1 text-xs text-zinc-500">Časy v časové zóně Europe/Prague (Česko).</p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSave} className="space-y-8">
            <section className="space-y-4">
              <Label>Typ rezervace</Label>
              <Select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => (f ? { ...f, type: e.target.value as 'DINE_IN' | 'TAKEAWAY' } : f))
                }
                className="mt-1"
              >
                <option value="DINE_IN">Na místě</option>
                <option value="TAKEAWAY">S sebou</option>
              </Select>
            </section>
            <section className="space-y-4">
              <Label>Čas</Label>
              <Select
                value={form.slotStartUtc}
                onChange={(e) => setForm((f) => (f ? { ...f, slotStartUtc: e.target.value } : f))}
                className="mt-1"
              >
                {slots.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </section>
            {form.type === 'DINE_IN' && (
              <section>
                <Label>Počet osob *</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.partySize}
                  onChange={(e) => setForm((f) => (f ? { ...f, partySize: e.target.value } : f))}
                  className="mt-1"
                />
              </section>
            )}
            <Divider />
            <section className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Jméno *</Label>
                <Input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => (f ? { ...f, firstName: e.target.value } : f))}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label>Příjmení *</Label>
                <Input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => (f ? { ...f, lastName: e.target.value } : f))}
                  className="mt-1"
                  required
                />
              </div>
            </section>
            <div>
              <Label>Telefon *</Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => (f ? { ...f, phone: e.target.value } : f))}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label>E-mail *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => (f ? { ...f, email: e.target.value } : f))}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label>Poznámka</Label>
              <Textarea
                value={form.note}
                onChange={(e) => setForm((f) => (f ? { ...f, note: e.target.value } : f))}
                rows={2}
                className="mt-1"
              />
            </div>
            <Divider />
            <section className="space-y-4">
              <Label>
                {form.type === 'TAKEAWAY' ? 'Předobjednávka *' : 'Předobjednávka'}
              </Label>

              <div className="rounded-2xl border border-zinc-200 divide-y divide-zinc-100 bg-white">
                {menu.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 px-4 py-3 sm:px-5"
                  >
                    {/* TEXT vlevo (pod sebou) */}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-zinc-900 leading-tight">
                        {sanitizeText(item.name)}
                      </div>

                      {item.description ? (
                        <div className="mt-1 text-sm text-zinc-600 leading-snug">
                          {sanitizeText(item.description)}
                        </div>
                      ) : null}

                      <div className="mt-2 text-sm font-medium text-zinc-800">
                        {item.priceCzk} Kč
                      </div>
                    </div>

                    {/* INPUT vpravo */}
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={form.items[item.id] ?? 0}
                      onChange={(e) =>
                        setForm((f) =>
                          f
                            ? {
                                ...f,
                                items: {
                                  ...f.items,
                                  [item.id]: Math.max(0, parseInt(e.target.value, 10) || 0),
                                },
                              }
                            : f
                        )
                      }
                      className="h-11 w-20 shrink-0 rounded-xl border border-zinc-200 bg-white px-3 text-right text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                    />
                  </div>
                ))}
              </div>
            </section>
            <Notice variant="info">
              Celková cena: <strong>{totalCzk} Kč</strong>
            </Notice>
            {saveError && <Notice variant="error">{saveError}</Notice>}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="primary" disabled={!canSave || saving}>
                {saving ? 'Ukládám…' : 'Uložit změny'}
              </Button>
              <Button type="button" variant="danger" onClick={handleCancel}>
                Zrušit rezervaci
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </Container>
  );
}
