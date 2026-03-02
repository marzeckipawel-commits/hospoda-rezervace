'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Card, CardHeader, CardBody, Label, Input, Button, Notice } from '@/components/ui';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(
        data.error === 'invalid_password' ? 'Nesprávné heslo.' : 'Přihlášení se nepodařilo.'
      );
      return;
    }
    router.push('/admin/dashboard');
    router.refresh();
  };

  return (
    <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Container className="max-w-sm">
        <Card>
          <CardHeader>
            <h1 className="text-xl font-bold text-zinc-900">Admin přihlášení</h1>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="admin-password">Heslo</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                  required
                  autoFocus
                />
              </div>
              {error && <Notice variant="error">{error}</Notice>}
              <Button type="submit" variant="primary" disabled={loading} className="w-full">
                {loading ? 'Přihlašování…' : 'Přihlásit'}
              </Button>
            </form>
          </CardBody>
        </Card>
      </Container>
    </main>
  );
}
