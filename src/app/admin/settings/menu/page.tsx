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
  Notice,
} from '@/components/ui';

type MenuItem = {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  category: string;
  priceCzk: number;
  countsTowardBurger: boolean;
  isAvailable: boolean;
  sortOrder: number;
};

export default function AdminSettingsMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch('/api/admin/menu', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data);
        else setItems([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Container className="max-w-4xl">
      <Link href="/admin/dashboard" className="mb-6 inline-block text-sm text-zinc-600 hover:text-zinc-900">
        ← Dashboard
      </Link>
      <h1 className="mb-8 text-xl font-bold text-zinc-900 sm:text-2xl">Menu</h1>

      <Card className="mb-8">
        <CardHeader>
          <h2 className="text-lg font-semibold text-zinc-900">Přidat položku</h2>
        </CardHeader>
        <CardBody>
          <MenuForm onSuccess={load} />
        </CardBody>
      </Card>

      <div className="space-y-4">
        {items.map((item) => (
          <MenuItemCard key={item.id} item={item} onSuccess={load} />
        ))}
      </div>
      {items.length === 0 && !loading && (
        <Notice variant="info">Žádné položky menu.</Notice>
      )}
      {loading && <p className="py-4 text-zinc-500">Načítání…</p>}
    </Container>
  );
}

function MenuForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priceCzk, setPriceCzk] = useState('');
  const [countsTowardBurger, setCountsTowardBurger] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [sortOrder, setSortOrder] = useState('0');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await fetch('/api/admin/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || undefined,
        category: category.trim() || 'Hlavní',
        priceCzk: parseInt(priceCzk, 10) || 0,
        countsTowardBurger,
        isAvailable,
        sortOrder: parseInt(sortOrder, 10) || 0,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError('Uložení se nepodařilo.');
      return;
    }
    setName('');
    setDescription('');
    setCategory('');
    setPriceCzk('');
    setSortOrder('0');
    setCountsTowardBurger(false);
    setIsAvailable(true);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Název *</Label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label>Kategorie</Label>
          <Input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Hlavní"
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label>Popis</Label>
        <Input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Cena (Kč) *</Label>
          <Input
            type="number"
            min={0}
            value={priceCzk}
            onChange={(e) => setPriceCzk(e.target.value)}
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label>Pořadí</Label>
          <Input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={countsTowardBurger}
            onChange={(e) => setCountsTowardBurger(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300"
          />
          <span className="text-sm text-zinc-700">Počítat do burgerů</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300"
          />
          <span className="text-sm text-zinc-700">Dostupné</span>
        </label>
      </div>
      {error && <Notice variant="error">{error}</Notice>}
      <Button type="submit" variant="primary" disabled={saving}>
        {saving ? 'Ukládám…' : 'Přidat položku'}
      </Button>
    </form>
  );
}

function MenuItemCard({ item, onSuccess }: { item: MenuItem; onSuccess: () => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/admin/menu/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    });
    setSaving(false);
    setEditing(false);
    onSuccess();
  };

  const handleDelete = async () => {
    if (!confirm('Opravdu smazat položku?')) return;
    await fetch(`/api/admin/menu/${item.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    onSuccess();
  };

  if (editing) {
    return (
      <Card className="border-amber-200 bg-amber-50/30">
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="sm:col-span-2">
              <Label>Název</Label>
              <Input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Kategorie</Label>
              <Input
                type="text"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Cena (Kč)</Label>
              <Input
                type="number"
                min={0}
                value={form.priceCzk}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priceCzk: parseInt(e.target.value, 10) || 0 }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Pořadí</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value, 10) || 0 }))
                }
                className="mt-1"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.countsTowardBurger}
                onChange={(e) =>
                  setForm((f) => ({ ...f, countsTowardBurger: e.target.checked }))
                }
                className="h-4 w-4 rounded border-zinc-300"
              />
              <span className="text-sm text-zinc-700">Počítat do burgerů</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))}
                className="h-4 w-4 rounded border-zinc-300"
              />
              <span className="text-sm text-zinc-700">Dostupné</span>
            </label>
          </div>
          <div className="mt-4 flex gap-3">
            <Button type="button" variant="secondary" onClick={handleSave} disabled={saving}>
              {saving ? 'Ukládám…' : 'Uložit'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
              Zrušit
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-medium text-zinc-900">{item.name}</p>
            <p className="text-sm text-zinc-500">
              {item.category} · {item.priceCzk} Kč · pořadí {item.sortOrder}
            </p>
            <div className="mt-1 flex gap-2 text-xs">
              {item.countsTowardBurger && (
                <span className="text-amber-700">Počítá do burgerů</span>
              )}
              {item.isAvailable ? (
                <span className="text-emerald-600">Dostupné</span>
              ) : (
                <span className="text-zinc-400">Nedostupné</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
              Upravit
            </Button>
            <Button type="button" variant="danger" onClick={handleDelete}>
              Smazat
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
