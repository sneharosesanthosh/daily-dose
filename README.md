# Daily Dose

A curated quotes web app. Visitors pick a category and click **Generate** to get a random uplifting quote — one at a time, building curiosity instead of scrolling through a flat list. An admin panel manages the quote library.

🌐 **Live site:** [daily-dose-sneha.vercel.app](https://daily-dose-sneha.vercel.app)
📐 **Architecture:** see [ARCHITECTURE.md](./ARCHITECTURE.md) for full system diagrams, request flows, and design decisions.

---

## Tech stack

- **Framework:** Next.js 16 (App Router, Server Components, Server Actions)
- **UI:** React 19, Tailwind CSS v4, lucide-react icons
- **Database:** Neon Postgres (serverless) via Prisma 7 with `@prisma/adapter-neon`
- **Auth:** Cookie-based admin session (httpOnly, secure)
- **Hosting:** Vercel (atomic zero-downtime deploys, auto-builds on `main`)
- **CI:** GitHub Actions (lint + build on every PR)

---

## Run locally

```bash
# Install deps
npm install

# Generate the Prisma client
npx prisma generate

# Create a .env file with your secrets
echo 'DATABASE_URL="your-neon-connection-string"' > .env
echo 'ADMIN_PASSWORD="your-admin-password"' >> .env

# Push schema to your DB (one-time)
npx prisma db push

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## CI/CD workflow

This project uses **GitHub Actions for CI** and **Vercel for CD**.

```
You open a PR
   ↓
GitHub Actions runs CI
   • lint  (npm run lint)
   • build (npm run build)
   ↓
If CI passes ✅  →  PR can be merged
   ↓
You merge PR to main
   ↓
Vercel auto-deploys to production
```

**Direct pushes to `main` are blocked** by branch protection — all changes must go through a PR with passing CI. This guarantees broken code never reaches production.

The CI workflow lives in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml).

---

## Contributing / making changes

```bash
git checkout main
git pull
git checkout -b your-feature-name

# ...make changes...

git add .
git commit -m "Describe what changed"
git push -u origin your-feature-name

# Then open a PR on GitHub. Wait for CI to pass. Merge.
```

---

## Project structure (quick reference)

```
app/
├── page.js                    Home page (Server Component)
├── QuoteGenerator.js          Generator UI (Client Component)
├── api/random-quote/route.js  Random quote API
├── login/page.js              Login form
├── logout/route.js            POST logout
└── admin/                     Admin CRUD pages + helpers
lib/prisma.js                  Prisma client singleton
prisma/schema.prisma           DB schema
proxy.js                       Edge auth gate for /admin/*
.github/workflows/ci.yml       CI workflow (lint + build)
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full breakdown.
