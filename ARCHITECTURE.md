# Daily Dose — Architecture

A curated quotes web app. Visitors pick a category and click "Generate" to get a random uplifting quote. An admin panel manages the quote library.

## System overview

```mermaid
graph TB
    Visitor[👤 Visitor]
    Admin[🔐 Admin]

    subgraph Vercel["Vercel (Edge + Serverless)"]
        Proxy["proxy.js<br/>Auth gate for /admin/*"]

        subgraph App["Next.js App"]
            Home["/ — Home<br/>(Server Component)"]
            Generator["QuoteGenerator<br/>(Client Component)"]
            API["/api/random-quote<br/>(Route Handler)"]
            Login["/login<br/>(Server Action)"]
            Logout["/logout<br/>(POST Route Handler)"]
            AdminUI["/admin /admin/add /admin/edit/[id]<br/>(Server Components + Actions)"]
        end
    end

    Neon[("Neon Postgres<br/>via WebSocket")]

    Visitor -->|"HTTPS"| Home
    Visitor -->|"fetch on click"| API
    Home -->|"list categories"| Neon
    API -->|"SELECT random quote"| Neon

    Admin -->|"submit password"| Login
    Login -->|"sets admin_session cookie"| Admin
    Admin -->|"navigates"| Proxy
    Proxy -->|"if cookie valid"| AdminUI
    Proxy -->|"if not"| Login
    AdminUI -->|"CRUD via Prisma"| Neon
    AdminUI -->|"POST"| Logout
    Logout -->|"deletes cookie"| Admin
```

---

## Flow 1 — Visitor generates a quote

```mermaid
sequenceDiagram
    actor Visitor
    participant Home as Home (/)
    participant API as /api/random-quote
    participant DB as Neon Postgres

    Visitor->>Home: GET /
    Home->>DB: SELECT DISTINCT category
    DB-->>Home: ["courage", "motivation", ...]
    Home-->>Visitor: Render page with category pills

    Visitor->>API: GET /api/random-quote?category=courage&exclude=42
    Note over API: exclude prevents same quote twice in a row
    API->>DB: SELECT * FROM Quote WHERE category=? AND id != ? OFFSET random()
    DB-->>API: Quote row
    API-->>Visitor: JSON quote
    Note over Visitor: QuoteGenerator client component<br/>fades in the new quote
```

---

## Flow 2 — Admin login + manage quotes

```mermaid
sequenceDiagram
    actor Admin
    participant Login as /login
    participant Proxy as proxy.js
    participant AdminPage as /admin
    participant AddPage as /admin/add
    participant DB as Neon Postgres

    Admin->>Login: POST password
    Note over Login: Server Action checks ADMIN_PASSWORD
    Login->>Admin: Set-Cookie: admin_session=1<br/>303 → /admin

    Admin->>Proxy: GET /admin
    Proxy->>Proxy: Read admin_session cookie
    alt cookie valid
        Proxy->>AdminPage: forward request
        AdminPage->>DB: SELECT * FROM Quote
        DB-->>AdminPage: All quotes
        AdminPage-->>Admin: Quote list + Add/Edit/Delete UI
    else cookie invalid
        Proxy-->>Admin: 307 → /login
    end

    Admin->>AddPage: GET /admin/add
    Note over Proxy: same cookie check runs here too
    AddPage-->>Admin: Form (text, author, source, category)
    Admin->>AddPage: POST form (Server Action)
    AddPage->>DB: INSERT INTO Quote
    AddPage->>Admin: 303 → /admin (with revalidatePath)
```

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Server Components, Server Actions, Route Handlers, file-based routing |
| **UI** | React 19 + Tailwind CSS v4 | Component-driven, warm cream/ink palette via custom tokens |
| **Icons** | lucide-react | Lightweight icon set (BookOpen, Sparkles, LogOut, etc.) |
| **Database** | Neon Postgres (serverless) | Pay-as-you-go, hibernates when idle, WebSocket-based |
| **ORM** | Prisma 7 with `@prisma/adapter-neon` | Type-safe queries, serverless-friendly driver |
| **Auth** | Cookie-based admin session | Simple single-admin pattern: httpOnly `admin_session=1` cookie |
| **Hosting** | Vercel | Atomic zero-downtime deploys, auto-builds on `git push` |

---

## File map

```
daily-dose/
├── app/
│   ├── page.js                    ← Home (Server Component, fetches categories)
│   ├── QuoteGenerator.js          ← Client Component (generate button + quote display)
│   ├── layout.js                  ← Root layout, fonts, body styling
│   ├── globals.css                ← Tailwind theme tokens + quote-appear animation
│   │
│   ├── api/
│   │   └── random-quote/route.js  ← GET endpoint, returns random quote (with exclude support)
│   │
│   ├── login/page.js              ← Login form + Server Action setting cookie
│   ├── logout/route.js            ← POST Route Handler clearing cookie
│   │
│   └── admin/
│       ├── page.js                ← Quote list + Add/Edit/Delete actions
│       ├── add/page.js            ← Add quote form
│       ├── edit/[id]/page.js      ← Edit quote form
│       ├── CategoryPicker.js      ← Client: text input + clickable existing-category chips
│       ├── SubmitButton.js        ← Client: useFormStatus spinner for "Saving…" state
│       └── DeleteButton.js        ← Client: delete with confirm() dialog
│
├── lib/
│   └── prisma.js                  ← Prisma client singleton with Neon WebSocket adapter
│
├── prisma/
│   └── schema.prisma              ← Quote model (text, author?, source?, category, timestamps)
│
├── proxy.js                       ← Edge auth gate for /admin/* (Next.js 16 "middleware")
│
└── .claude/skills/seed-quotes/    ← Claude Code skill — invoke /seed-quotes for curated quotes
```

---

## Key design decisions

1. **Generator UX over flat list** — visitors get one random quote at a time, building curiosity. The list view is admin-only.
2. **`secure + httpOnly` cookie** — admin session is HTTP-only (JS can't read it) and HTTPS-only in production.
3. **`force-dynamic` on admin pages** — prevents Vercel from caching auth-protected pages.
4. **POST for logout** — prevents Next.js Link prefetching from accidentally logging users out.
5. **Edge proxy for auth** — runs before any rendering or caching, the canonical Next.js 16 way to gate routes.
6. **Random by `OFFSET` + `exclude` param** — fine for small libraries; avoids same quote twice in a row.
7. **Categories stored as free-text strings** — no separate `Category` table needed; the home page derives the pills from `DISTINCT category` queries.

---

## Environment variables

| Variable | Where it's used | Required? |
|---|---|---|
| `DATABASE_URL` | `lib/prisma.js` — Neon connection string | ✅ Yes (locally + on Vercel) |
| `ADMIN_PASSWORD` | `app/login/page.js` — login check | ✅ Yes (locally + on Vercel) |
