import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hospoda u Vavřince – Rezervace',
  description: 'Rezervační systém pro akci Hospoda u Vavřince',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <body className="min-h-screen flex flex-col bg-zinc-50 text-zinc-900 antialiased">
        <header className="border-b border-zinc-200 bg-white shadow-sm">
          <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
            <Link
              href="/"
              className="text-lg font-semibold text-zinc-900 hover:text-zinc-700"
            >
              Hospoda u Vavřince
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/rezervace"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                Rezervace
              </Link>
              <Link
                href="/admin"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                Admin
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-200 bg-white py-6">
          <div className="mx-auto max-w-4xl px-4 text-center text-sm text-zinc-500 sm:px-6">
            Hospoda u Vavřince · Rezervační systém
          </div>
        </footer>
      </body>
    </html>
  );
}
