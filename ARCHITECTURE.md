# Daily Dose — Architecture

A curated quotes web app. Visitors pick a category and click "Generate" to get a random uplifting quote. An admin panel manages the quote library.

## System overview

```mermaid
graph TB
    Dev[👩‍💻 Developer]
    Visitor[👤 Visitor]
    Admin[🔐 Admin]

    subgraph ClaudeCode["Claude Code (dev tooling)"]
        ClaudeLLM["Claude (LLM)"]
        MCPServer["GitHub MCP server<br/>(read-only PAT)"]
        ClaudeLLM -->|"structured<br/>tool calls"| MCPServer
    end

    subgraph GitHub["GitHub"]
        Repo[(Repository)]
        Actions["GitHub Actions<br/>CI: lint + build"]
        Protection["Branch Protection<br/>blocks direct push to main"]
        GHAPI["GitHub REST API"]
    end

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

    Dev -->|"push branch + open PR"| Repo
    Dev -.->|"asks Claude<br/>for help"| ClaudeLLM
    MCPServer -.->|"HTTPS<br/>(read-only)"| GHAPI
    GHAPI -.-> Repo
    Repo --> Actions
    Actions -->|"green ✅ unlocks merge"| Protection
    Protection -->|"merge to main"| Repo
    Repo -->|"auto-deploy on main update"| Vercel

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

## Flow 3 — CI/CD pipeline (from `git push` to live site)

```mermaid
sequenceDiagram
    actor Dev as Developer
    participant Local as Local repo
    participant GH as GitHub
    participant CI as GitHub Actions (CI)
    participant Vercel as Vercel (CD)

    Dev->>Local: git checkout -b new-feature
    Dev->>Local: ...code + commit...
    Dev->>GH: git push -u origin new-feature
    Dev->>GH: Open PR via web UI

    GH->>CI: trigger CI workflow
    CI->>CI: npm ci
    CI->>CI: npm run lint
    CI->>CI: npm run build
    alt CI passes ✅
        CI-->>GH: green check
        Dev->>GH: click "Merge pull request"
        GH->>GH: merge into main
        GH->>Vercel: webhook: main updated
        Vercel->>Vercel: build + atomic deploy
        Vercel-->>Dev: site live
    else CI fails ❌
        CI-->>GH: red check
        Note over GH: Branch protection blocks merge<br/>until CI is green
    end
```

**Split:** GitHub Actions handles **CI** (validation before merge); Vercel handles **CD** (deployment after merge). They don't conflict because they run at different times — CI on PRs, CD only when `main` is updated.

**Branch protection** ensures broken code never reaches `main`:
- Direct pushes to `main` are blocked
- PRs cannot be merged until the `check` job (lint + build) is green
- All changes must therefore go through PR → CI → merge → deploy

---

## MCP servers (agentic tooling)

Claude Code can talk to external systems through **MCP** (Model Context Protocol) servers. Each MCP server exposes a set of structured tools (typed functions) that Claude can call — cleaner than shelling out to CLI tools, with per-function permission control and reusability across MCP-compatible apps.

### Configured MCP servers

| Server | Endpoint | Purpose | Config scope |
|---|---|---|---|
| **GitHub MCP** | `https://api.githubcopilot.com/mcp/` (remote HTTP) | Structured access to GitHub APIs (PRs, issues, repo metadata) | Local — config in `~/.claude.json`, not committed |

### How the GitHub MCP is wired up

```mermaid
graph LR
    Claude["Claude (LLM)"]
    CC["Claude Code"]
    MCP["GitHub MCP server<br/>(remote HTTP)"]
    GH["GitHub REST API"]

    Claude -->|"calls structured tool<br/>e.g. list_pull_requests"| CC
    CC -->|"HTTPS + Bearer PAT"| MCP
    MCP -->|"HTTPS API call"| GH
    GH -->|"JSON response"| MCP
    MCP -->|"structured result"| CC
    CC -->|"tool output"| Claude
```

### Authentication — fine-grained PAT

A **GitHub fine-grained personal access token (PAT)** is used as a Bearer token by the MCP server. Scoped narrowly:

- **Repository:** only `daily-dose` (no other repos accessible)
- **Permissions (all read-only):**
  - Contents: Read
  - Issues: Read
  - Metadata: Read
  - Pull requests: Read
- **Expiration:** 90 days (rotated when expired)

The token lives in `~/.claude.json` on the local machine. It is never committed to the repo, and Claude Code never echoes the token back into the LLM context — even though the LLM can *use* the MCP tools, it never sees the raw token.

### Conservative read-only setup — defense in depth

The PAT itself enforces the safety boundary: **even if Claude attempts a write/delete operation through the MCP, GitHub will reject the API call** because the token lacks those scopes. This is a stronger guarantee than relying on Claude's good behavior or per-tool allow lists alone.

When write capability is genuinely needed (e.g., opening PRs via MCP), the plan is to **deliberately upgrade the PAT's scopes** with explicit human-in-the-loop consent — not auto-grant Claude broader access.

### Setup command (for reproducibility)

```bash
claude mcp add --transport http github https://api.githubcopilot.com/mcp/ \
  --header "Authorization: Bearer $GITHUB_MCP_TOKEN" \
  --scope local
```

The `$GITHUB_MCP_TOKEN` env var is set in the user's shell environment, not committed anywhere in the repo.

### Verification

```bash
claude mcp list           # should show "github: ✓ Connected"
```

Then inside Claude Code, `/mcp` shows connected servers and the tool count exposed by each one.

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
├── .github/
│   └── workflows/ci.yml           ← GitHub Actions CI — lint + build on every PR
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
8. **CI on GitHub Actions, CD on Vercel** — clean split: validation gates before merge, atomic deploys after merge. Branch protection on `main` enforces the PR workflow so broken code never reaches production.

---

## Environment variables

| Variable | Where it's used | Required? |
|---|---|---|
| `DATABASE_URL` | `lib/prisma.js` — Neon connection string | ✅ Yes (locally + on Vercel) |
| `ADMIN_PASSWORD` | `app/login/page.js` — login check | ✅ Yes (locally + on Vercel) |
