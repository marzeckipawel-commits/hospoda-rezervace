'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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

export default function RezervacePage() {
  const [event, setEvent] = useState<Event | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [slots, setSlots] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ publicCode: string; manageToken: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<FormState>({
    type: 'DINE_IN',
    slotStartUtc: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    partySize: '1',
    note: '',
    items: {},
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/event').then((r) => r.json()),
      fetch('/api/menu').then((r) => r.json()),
      fetch('/api/slots').then((r) => r.json()),
    ]).then(([eventData, menuData, slotsData]) => {
      if (eventData.error) setEvent(null);
      else setEvent(eventData);
      if (menuData.error) setMenu([]);
      else setMenu(menuData);
      if (slotsData.error) setSlots([]);
      else {
        setSlots(slotsData);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (slots.length > 0 && !form.slotStartUtc) {
      setForm((f) => ({ ...f, slotStartUtc: slots[0].value }));
    }
  }, [slots, form.slotStartUtc]);

  const totalCzk = menu.reduce((s, item) => {
    const q = form.items[item.id] ?? 0;
    return s + q * item.priceCzk;
  }, 0);

  const canSubmit =
    event &&
    form.slotStartUtc &&
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.phone.trim() &&
    form.email.trim() &&
    (form.type === 'TAKEAWAY' ? Object.values(form.items).some((q) => q > 0) : true) &&
    (form.type !== 'DINE_IN' || Number(form.partySize) >= 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !event) return;
    setSubmitError(null);
    setSubmitting(true);
    const items =
      form.type === 'TAKEAWAY' || Object.values(form.items).some((q) => q > 0)
        ? menu
            .filter((m) => (form.items[m.id] ?? 0) > 0)
            .map((m) => ({ menuItemId: m.id, quantity: form.items[m.id] ?? 0 }))
        : [];
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: form.type,
        slotStartUtc: form.slotStartUtc,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        partySize: form.type === 'DINE_IN' ? Number(form.partySize) : undefined,
        note: form.note.trim() || undefined,
        items: items.length ? items : undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      if (data.error === 'capacity_full') {
        setSubmitError('V tomto termínu je již plná kapacita. Zvolte jiný čas.');
      } else {
        setSubmitError(data.message || 'Rezervaci se nepodařilo odeslat. Zkuste to znovu.');
      }
      return;
    }
    setSuccess({ publicCode: data.publicCode, manageToken: data.manageToken });
  };

  if (loading) {
    return (
      <div className="bg-zinc-50">
        <Container className="py-16">
          <p className="text-center text-zinc-500">Načítání…</p>
        </Container>
      </div>
    );
  }

  if (success) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const manageUrl = `${baseUrl}/rezervace/sprava/${success.manageToken}`;
    return (
      <div className="bg-zinc-50">
        <header className="bg-gradient-to-b from-zinc-900 to-zinc-800 text-white">
          <Container className="max-w-3xl py-10 sm:py-12 text-center">
            <a
              href="https://hospodauvavrince.cz"
              target="_blank"
              rel="noreferrer"
              className="inline-flex flex-col items-center justify-center gap-2 mb-6"
            >
              <img
                src="/logo.png"
                alt="Hospoda u Vavřince"
                className="mx-auto h-24 w-auto sm:h-28 md:h-32 lg:h-36 drop-shadow-md rounded-md bg-white/5 p-1"
                style={{ objectFit: 'contain' }}
              />
              <span className="text-sm font-medium uppercase tracking-wide text-amber-400">
                Rezervace online
              </span>
            </a>
            <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">
              Hospoda u Vavřince
            </h1>
            <p className="mt-2 text-sm text-zinc-200">
              18. 4. 2026 • 13:00–21:00 • Sloty po 15 min
            </p>
          </Container>
        </header>
        <Container className="max-w-3xl -mt-6 pb-12 sm:-mt-10">
          <Card className="mx-auto max-w-xl rounded-3xl border-zinc-200 bg-white/95 shadow-lg">
            <CardHeader>
              <h2 className="text-xl font-semibold text-zinc-900 sm:text-2xl">
                Rezervace odeslána
              </h2>
            </CardHeader>
            <CardBody>
              <Notice variant="success" className="mb-6">
                Váš kód rezervace: <strong>{success.publicCode}</strong>
              </Notice>
              <p className="text-zinc-600">
                Na váš e-mail jsme odeslali potvrzení. Údaje můžete kdykoli
                upravit nebo rezervaci zrušit na níže uvedeném odkaze.
              </p>
              <a
                href={manageUrl}
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
              >
                Správa rezervace
              </a>
              <p className="mt-4 break-all text-sm text-zinc-500">
                {manageUrl}
              </p>
            </CardBody>
          </Card>
        </Container>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="bg-zinc-50">
        <Container className="py-16">
          <Card className="max-w-xl mx-auto text-center rounded-3xl shadow-lg">
            <CardBody>
              <p className="text-zinc-600">
                Aktuálně není k dispozici žádná akce.
              </p>
              <Link
                href="/"
                className="mt-4 inline-block text-zinc-900 underline hover:text-zinc-700"
              >
                Zpět na úvod
              </Link>
            </CardBody>
          </Card>
        </Container>
      </div>
    );
  }

  const formattedDate = new Date(event.date).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });

  const formatMinutes = (minutes: number) => {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const openLabel = `${formatMinutes(event.startTimeMinutes)}–${formatMinutes(
    event.endTimeMinutes
  )}`;
  const slotLabel = `Sloty po ${event.slotMinutes} min`;

  return (
    <div className="bg-zinc-50">
      <header className="bg-gradient-to-b from-zinc-900 to-zinc-800 text-white">
        <Container className="max-w-3xl py-10 sm:py-12">
          <div className="flex flex-col items-center text-center">
            <a
              href="https://hospodauvavrince.cz"
              target="_blank"
              rel="noreferrer"
              className="inline-flex flex-col items-center justify-center gap-2 mb-6"
            >
              <img
                src="/logo.png"
                alt="Hospoda u Vavřince"
                className="mx-auto h-24 w-auto sm:h-28 md:h-32 lg:h-36 drop-shadow-md rounded-md bg-white/5 p-1"
                style={{ objectFit: 'contain' }}
              />
              <span className="text-xs font-medium uppercase tracking-wide text-amber-400">
                Rezervace online
              </span>
            </a>
            <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">
              Rezervace na akci
            </h1>
            <p className="mt-2 text-sm text-zinc-200">
              {formattedDate} • {openLabel} • {slotLabel}
            </p>
          </div>
        </Container>
      </header>

      <Container className="max-w-3xl -mt-6 pb-12 sm:-mt-10">
        <Card className="rounded-3xl border-zinc-200 bg-white/95 shadow-xl">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 sm:text-xl">
                  Vyberte čas a typ
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Nejprve zvolte čas, poté typ rezervace a případnou
                  předobjednávku.
                </p>
              </div>
              <div className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                🕒 {slotLabel}
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Typ & čas */}
              <section className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  1. Vyberte čas
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Čas</Label>
                    <Select
                      value={form.slotStartUtc}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, slotStartUtc: e.target.value }))
                      }
                      className="mt-1"
                      required
                    >
                      {slots.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Typ rezervace</Label>
                    <Select
                      value={form.type}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          type: e.target.value as 'DINE_IN' | 'TAKEAWAY',
                        }))
                      }
                      className="mt-1"
                    >
                      <option value="DINE_IN">Na místě</option>
                      <option value="TAKEAWAY">S sebou</option>
                    </Select>
                  </div>
                </div>
                {form.type === 'DINE_IN' && (
                  <div>
                    <Label>Počet osob *</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.partySize}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, partySize: e.target.value }))
                      }
                      className="mt-1 max-w-[120px]"
                      required
                    />
                  </div>
                )}
              </section>

              <Divider />

              {/* Předobjednávka */}
              <section className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    2. Předobjednávka
                  </h3>
                  {form.type === 'TAKEAWAY' && (
                    <Notice className="border-amber-300 bg-amber-50 text-amber-900">
                      Pro objednávku <strong>S sebou</strong> je nutná alespoň
                      jedna položka v předobjednávce.
                    </Notice>
                  )}
                </div>
                <div className="rounded-2xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
                  {menu.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-4 px-4 py-3 sm:px-5"
                    >
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

                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={form.items[item.id] ?? 0}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            items: {
                              ...f.items,
                              [item.id]:
                                Math.max(
                                  0,
                                  parseInt(e.target.value, 10) || 0
                                ),
                            },
                          }))
                        }
                        className="h-10 w-16 shrink-0 rounded-xl border border-zinc-200 bg-white px-2 text-right text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                      />
                    </div>
                  ))}
                </div>
                {menu.length === 0 && (
                  <p className="text-sm text-zinc-500">
                    Žádné položky menu nejsou k dispozici.
                  </p>
                )}
              </section>

              <Divider />

              {/* Kontakt */}
              <section className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  3. Kontaktní údaje
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Jméno *</Label>
                    <Input
                      type="text"
                      value={form.firstName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, firstName: e.target.value }))
                      }
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label>Příjmení *</Label>
                    <Input
                      type="text"
                      value={form.lastName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, lastName: e.target.value }))
                      }
                      className="mt-1"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>Telefon *</Label>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label>E-mail *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label>Poznámka</Label>
                  <Textarea
                    value={form.note}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, note: e.target.value }))
                    }
                    rows={2}
                    className="mt-1"
                  />
                </div>
              </section>

              <Divider />

              {/* Souhrn a odeslání */}
              <section className="space-y-3 pb-2">
                {submitError && <Notice variant="error">{submitError}</Notice>}
                <div className="sticky bottom-4 z-10">
                  <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-zinc-700">
                      <span className="font-medium">Součet:</span>{' '}
                      <span className="text-lg font-semibold text-zinc-900">
                        {totalCzk} Kč
                      </span>
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={!canSubmit || submitting}
                      className="w-full sm:w-auto"
                    >
                      {submitting ? 'Odesílám…' : 'Odeslat rezervaci'}
                    </Button>
                  </div>
                </div>
              </section>
            </form>
          </CardBody>
        </Card>

        <div className="mt-8 text-center text-xs text-zinc-500">
          Těšíme se na vás ·{' '}
          <a
            href="https://hospodauvavrince.cz"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-zinc-700"
          >
            hospodauvavrince.cz
          </a>{' '}
          · tel.: +420 000 000 000
        </div>
      </Container>
    </div>
  );
}
