# Database alternatives to Neon

> Generated 2026-05-18 in conversation with Claude. Saved here so it survives context compaction.

This project uses **Neon** (serverless Postgres). If we ever needed to switch, these are the realistic options and their tradeoffs.

---

## First — what does Neon give us that we'd need to replace?

| Feature | Why it matters |
|---|---|
| **PostgreSQL** | SQL dialect we wrote (no need to change queries) |
| **Serverless** (pay-only-when-used) | Free tier hibernates when idle — perfect for portfolio apps |
| **WebSocket connection** | Works with serverless Vercel functions (TCP connections are flaky there) |
| **Branching** | Each PR can have its own DB copy (advanced — we haven't used this) |
| **Generous free tier** | 0.5 GB storage, no credit card |

The alternatives below either replicate these or trade them for something else.

---

## Direct alternatives (serverless Postgres-style)

### 🟢 Supabase — the most popular Neon alternative
- Postgres-based, has a generous free tier
- Bundles auth, file storage, and realtime out of the box
- Wider feature set than Neon (more like Firebase but SQL)
- **When to pick:** if you want one service for DB + auth + storage. With Supabase, you wouldn't have needed to write your own login/cookie code — they have built-in auth.

### 🟢 Vercel Postgres
- Vercel's own offering — tightest integration with their hosting
- Actually built on top of Neon (interesting!), so functionally similar
- **When to pick:** if you want everything (DB + hosting) on one bill, one dashboard

### 🟡 PlanetScale
- Was MySQL only, recently added Postgres
- Best-in-class database branching (better than Neon's)
- **When to pick:** if you want fancy schema-migration workflows

### 🟡 Xata
- Serverless Postgres with built-in full-text search and file attachments
- **When to pick:** if you need search beyond simple `WHERE` clauses

### 🟡 Turso
- Different engine — based on SQLite, not Postgres
- Edge-replicated globally (reads are super fast worldwide)
- **When to pick:** if you want lightning-fast reads worldwide and don't need complex SQL

---

## Traditional (always-on) Postgres options

These give you a real, always-running database. More expensive, no hibernation.

| Provider | Vibe |
|---|---|
| **Railway** | Cleanest UX. Great for beginners. Has a free tier with limits. |
| **Render** | Similar to Railway. |
| **Heroku Postgres** | The classic. Free tier removed in 2022, paid now. |
| **DigitalOcean Managed Postgres** | Solid, predictable. ~$15/month minimum. |
| **AWS RDS** | The enterprise standard. Complex setup but bulletproof. |
| **Google Cloud SQL** | Same vibe as RDS but Google. |

**When to pick traditional:** when your app has constant traffic and the "hibernate when idle" model would actually hurt (slow cold starts every time a user visits).

---

## Self-hosted options

For the brave / the budget-conscious:

- **Run Postgres in Docker on a $5/month VPS** (DigitalOcean droplet, Hetzner, etc.)
- **Tools like Coolify or Dokku** make this easier (self-hosted Heroku-like platforms)
- **Pros:** dirt cheap, full control
- **Cons:** you handle backups, security, updates, monitoring. Lots of responsibility.

**When to pick:** when you have a fleet of side projects and don't want to pay per-app, OR you're learning DevOps.

---

## Non-Postgres alternatives (different paradigm)

If you didn't need SQL specifically:

- **MongoDB Atlas** — document database (JSON-like). Different mental model from relational.
- **Firebase Firestore** — Google's realtime NoSQL DB. Built-in auth, hosting. Great for chat-style apps.
- **Cloudflare D1** — SQLite at the edge, free generous tier.
- **DynamoDB** — AWS's key-value store. Industrial. Cheap at huge scale.

These would require rewriting your Prisma schema and queries — and likely using a different ORM.

---

## What would change in YOUR code?

Surprisingly little, because **Prisma abstracts the database**. Your `prisma.quote.findMany()` calls would mostly stay the same. The changes would be:

| What changes | What stays the same |
|---|---|
| `DATABASE_URL` connection string | Your queries (`prisma.quote.findMany`, etc.) |
| Possibly the Prisma adapter (`@prisma/adapter-neon` → adapter for the new DB, if needed) | Your schema (`prisma/schema.prisma`) |
| `lib/prisma.js` setup (might not need the adapter) | All your page logic |

For most Postgres alternatives (Supabase, Vercel Postgres, Railway, etc.), you'd just:
1. Change `DATABASE_URL` to the new provider's URL
2. Maybe remove the Neon-specific adapter from `lib/prisma.js`
3. Done.

That's the beauty of Prisma — it makes the DB largely interchangeable.

---

## My honest take for *this* project

For a small portfolio quotes app:

- **Best free-tier choice** → Neon (current) or Supabase
- **Easiest swap if Neon hibernation annoys you** → Vercel Postgres (zero setup) or Railway (simplest UX)
- **Most learning value** → Supabase, because you'd see how built-in auth/storage works
- **Worst choice for this scale** → AWS RDS or self-hosted (massive overkill)

Neon is working fine. No reason to swap unless:
- You hate the 2-second cold start
- You want a feature Neon doesn't have (e.g., Supabase's built-in auth)

---

## TL;DR

> Lots of alternatives exist — **Supabase** is the most popular Neon alternative, **Vercel Postgres** has the tightest hosting integration, **Railway** is great for simplicity, traditional clouds (AWS/GCP) are for enterprise. Thanks to Prisma, swapping is mostly a `DATABASE_URL` change. For your scale, Neon's a great pick — no need to switch.
