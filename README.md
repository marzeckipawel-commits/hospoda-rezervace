# Hospoda u Vavřince – Rezervační systém

Produkční rezervační systém pro jednorázovou akci. Next.js 14 (App Router), TypeScript, Prisma, PostgreSQL (Supabase), Resend pro e-maily.

## Požadavky

- Node.js 18+
- Účet Supabase
- Účet Resend (e-maily)
- Účet Vercel (deploy)

---

## 1. Supabase – vytvoření databáze

1. Přihlaste se na [supabase.com](https://supabase.com) a vytvořte nový projekt.
2. V **Project Settings → Database** zkopírujte **Connection string** (URI). Zvolte režim **URI** a použijte heslo z projektu.
   - Formát: `postgresql://postgres.[ref]:[HESLO]@aws-0-[region].pooler.supabase.com:6543/postgres`
   - Pro migrace je vhodné použít **Direct connection** (port 5432), pro aplikaci často **Session mode** (port 6543). Obojí lze použít jako `DATABASE_URL`.
3. Do connection stringu doplňte heslo místo `[YOUR-PASSWORD]` a uložte si ho jako `DATABASE_URL` pro další kroky.

---

## 2. Lokální vývoj

```bash
# Sklonování a instalace
cd HospodaRezervace
npm install

# Konfigurace prostředí
cp .env.example .env
# Do .env vyplňte:
# - DATABASE_URL (Supabase connection string)
# - ADMIN_PASSWORD (heslo do admin sekce)
# - JWT_SECRET (min. 32 znaků, náhodný řetězec)
# - NEXT_PUBLIC_BASE_URL (např. http://localhost:3000)
# - RESEND_API_KEY (z Resend dashboardu)
# - EMAIL_FROM (např. "Hospoda <rezervace@vasedomena.cz>")

# Migrace databáze
npm run db:migrate

# Seed – vytvoření výchozí akce (18. 4. 2026, 13:00–21:00, sloty po 15 min)
npm run db:seed

# Spuštění vývojového serveru
npm run dev
```

Aplikace běží na [http://localhost:3000](http://localhost:3000).

- **Veřejná rezervace:** http://localhost:3000/rezervace  
- **Admin:** http://localhost:3000/admin (přihlášení heslem z `ADMIN_PASSWORD`)

---

## 3. Deploy na Vercel

1. Nahrajte repozitář na GitHub (nebo jiný podporovaný Git).
2. Na [vercel.com](https://vercel.com) vytvořte nový projekt a importujte tento repozitář.
3. V **Settings → Environment Variables** nastavte všechny proměnné z `.env.example`:

   | Proměnná | Popis |
   |----------|--------|
   | `DATABASE_URL` | PostgreSQL connection string (Supabase) |
   | `ADMIN_PASSWORD` | Heslo pro přístup do /admin |
   | `JWT_SECRET` | Tajný klíč pro JWT (min. 32 znaků) |
   | `NEXT_PUBLIC_BASE_URL` | Plná URL aplikace (např. `https://rezervace.vasedomena.cz`) |
   | `RESEND_API_KEY` | API klíč z Resend |
   | `EMAIL_FROM` | Odesílatel e-mailů (např. `Hospoda u Vavřince <rezervace@vasedomena.cz>`) |

4. **Build:** Vercel automaticky použije `npm run build`. Prisma client se vygeneruje v `postinstall` (`prisma generate`).
5. Po prvním deployi spusťte migrace a seed **jednorázově** proti produkční DB (lokálně s `DATABASE_URL` z Vercelu, nebo přes Vercel CLI):

   ```bash
   # Varianta A: lokálně s produkční DATABASE_URL v .env
   npm run db:migrate
   npm run db:seed

   # Varianta B: Vercel CLI (pokud máte nainstalované)
   vercel env pull .env.production
   DATABASE_URL="..." npm run db:migrate
   DATABASE_URL="..." npm run db:seed
   ```

   Seed vytvoří jednu akci „Hospoda u Vavřince“ na 18. 4. 2026 (13:00–21:00, sloty 15 min, max 100 osob, avg. pobyt 90 min).

---

## 4. Přesměrování /rezervace na Vercel

Chcete-li, aby hlavní doména (např. `vasedomena.cz`) zobrazovala rezervace hostované na Vercelu:

- **Možnost A – subdoména:**  
  Nastavte DNS záznam např. `rezervace.vasedomena.cz` → CNAME na `cname.vercel-dns.com` (nebo Vercel vám ukáže konkrétní CNAME). Na Vercelu přidejte doménu `rezervace.vasedomena.cz`. Pak používejte `NEXT_PUBLIC_BASE_URL=https://rezervace.vasedomena.cz`.

- **Možnost B – přesměrování z hlavní domény:**  
  Na vašem hlavním webu (jiný hosting) nastavte přesměrování:
  - `https://vasedomena.cz/rezervace` → `https://vas-aplikace.vercel.app/rezervace` (301 nebo 302).
  Vercel aplikace pak mějte s doménou např. `vas-aplikace.vercel.app` a `NEXT_PUBLIC_BASE_URL` nastavte na tuto URL (nebo na vlastní doménu, pokud ji později přidáte na Vercel).

---

## Struktura aplikace

- **Veřejné:** `/` (úvod), `/rezervace` (formulář), `/rezervace/sprava/[token]` (správa rezervace).
- **Admin:** `/admin` (přihlášení), `/admin/dashboard` (přehled obsazenosti a burgerů), `/admin/settings/event`, `/admin/settings/menu`.
- **API:**  
  `GET /api/event`, `GET /api/menu`, `POST /api/reservations`,  
  `GET/PATCH/DELETE /api/reservations/[token]`,  
  `POST /api/admin/login`, `GET/PATCH /api/admin/event`, `GET/POST /api/admin/menu`, `PATCH/DELETE /api/admin/menu/[id]`, `GET /api/admin/metrics`.

---

## Skripty

| Příkaz | Popis |
|--------|--------|
| `npm run dev` | Vývojový server |
| `npm run build` | Production build (kontrola TypeScript) |
| `npm run start` | Spuštění production serveru |
| `npm run db:migrate` | Aplikace migrací (`prisma migrate deploy`) |
| `npm run db:seed` | Spuštění seedu (`tsx prisma/seed.ts`) |
| `npm run db:generate` | Vygenerování Prisma clientu |

---

## Kontrola TypeScript buildu

```bash
npm run build
```

Build musí projít bez chyb; tím se ověří i TypeScript.
