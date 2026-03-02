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
  Button,
} from '@/components/ui';

type EventSettings = {
  id: string;
  name: string;
  date: string;
  startTimeMinutes: number;
  endTimeMinutes: number;
  slotMinutes: number;
  maxPeopleOnPremises: number;
  avgStayMinutes: number;
  takeawayPeopleEquivalent: number;
  burgerTrackingEnabled: boolean;
};

export default function AdminSettingsEventPage() {
  const [data, setData] = useState<EventSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EventSettings | null>(null);

  useEffect(() => {
    fetch('/api/admin/event', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setData(null);
        else {
          setData(d);
          setForm(d);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    await fetch('/api/admin/event', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: form.name,
        startTimeMinutes: form.startTimeMinutes,
        endTimeMinutes: form.endTimeMinutes,
        slotMinutes: form.slotMinutes,
        maxPeopleOnPremises: form.maxPeopleOnPremises,
        avgStayMinutes: form.avgStayMinutes,
        takeawayPeopleEquivalent: form.takeawayPeopleEquivalent,
        burgerTrackingEnabled: form.burgerTrackingEnabled,
      }),
    });
    setData(form);
    setSaving(false);
  };

  if (loading || !form) {
    return (
      <Container>
        <p className="py-12 text-zinc-500">Načítání…</p>
      </Container>
    );
  }

  return (
    <Container className="max-w-2xl">
      <Link href="/admin/dashboard" className="mb-6 inline-block text-sm text-zinc-600 hover:text-zinc-900">
        ← Dashboard
      </Link>
      <Card>
        <CardHeader>
          <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Nastavení akce</h1>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>Název</Label>
              <Input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => (f ? { ...f, name: e.target.value } : f))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Datum (jen zobrazení)</Label>
              <Input type="text" value={form.date} readOnly className="mt-1 bg-zinc-50" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <Label>Čas začátku (minuty od půlnoci)</Label>
                <Input
                  type="number"
                  value={form.startTimeMinutes}
                  onChange={(e) =>
                    setForm((f) => (f ? { ...f, startTimeMinutes: parseInt(e.target.value, 10) || 0 } : f))
                  }
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-zinc-500">např. 13:00 = 780, 21:00 = 1260</p>
              </div>
              <div>
                <Label>Čas konce (minuty)</Label>
                <Input
                  type="number"
                  value={form.endTimeMinutes}
                  onChange={(e) =>
                    setForm((f) => (f ? { ...f, endTimeMinutes: parseInt(e.target.value, 10) || 0 } : f))
                  }
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-zinc-500">např. 21:00 = 1260</p>
              </div>
            </div>
            <div>
              <Label>Délka slotu (minuty)</Label>
              <Input
                type="number"
                value={form.slotMinutes}
                onChange={(e) =>
                  setForm((f) => (f ? { ...f, slotMinutes: parseInt(e.target.value, 10) || 15 } : f))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Max. osob v podniku</Label>
              <Input
                type="number"
                value={form.maxPeopleOnPremises}
                onChange={(e) =>
                  setForm((f) => (f ? { ...f, maxPeopleOnPremises: parseInt(e.target.value, 10) || 0 } : f))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Průměrná doba pobytu (minuty)</Label>
              <Input
                type="number"
                value={form.avgStayMinutes}
                onChange={(e) =>
                  setForm((f) => (f ? { ...f, avgStayMinutes: parseInt(e.target.value, 10) || 90 } : f))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Takeaway ekvivalent osob (0 = nepočítat)</Label>
              <Input
                type="number"
                value={form.takeawayPeopleEquivalent}
                onChange={(e) =>
                  setForm((f) =>
                    f ? { ...f, takeawayPeopleEquivalent: parseInt(e.target.value, 10) || 0 } : f
                  )
                }
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="burgerTracking"
                checked={form.burgerTrackingEnabled}
                onChange={(e) =>
                  setForm((f) => (f ? { ...f, burgerTrackingEnabled: e.target.checked } : f))
                }
                className="h-4 w-4 rounded border-zinc-300"
              />
              <Label htmlFor="burgerTracking" className="!mb-0">Zapnout report burgerů</Label>
            </div>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Ukládám…' : 'Uložit'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </Container>
  );
}
