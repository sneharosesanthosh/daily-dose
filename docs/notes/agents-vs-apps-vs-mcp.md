# Agents, Tools, and MCP — Clarified

> Notes from a 2026-05-20 conversation. Captures the conceptual hierarchy that GH-600 (and any agent work) rests on. Reach for this whenever you find yourself confused about *what* is the agent and *what* is the tool.

---

## The mix-up that prompted this note

While planning Option A of the [study plan](./gh-600-study-plan.md) (build a GitHub Copilot custom agent), I asked Claude:

> *"Was Daily Dose an agent? I saw it consuming the GitHub MCP tools."*

That sentence has the agent-vs-app confusion baked into it. Daily Dose is **not** an agent. Daily Dose isn't consuming anything. The confusion is worth writing down because it's the exact category mistake GH-600 will test you on.

---

## The roles, kept separate

| Thing | Role | Has instructions? | Calls tools? |
|---|---|---|---|
| **Sneha** | Human operator | — | — |
| **Claude Code** | The agent | ✅ (CLAUDE.md, system prompt) | ✅ (Bash, Read, Edit, MCP servers, …) |
| **GitHub MCP server** | A tool layer | ❌ | ❌ (it *is* a tool — agents call it) |
| **Daily Dose** | The codebase / web app being built | ❌ | ❌ |

The two columns on the right are what defines "an agent." If a thing has no instructions and calls no tools, it isn't an agent — no matter how sophisticated it is.

---

## The actual flow

```
┌──────────┐
│  Sneha   │  ← you, the human
└────┬─────┘
     │ talks to
     ▼
┌──────────────────────────────┐
│  Claude Code (THE AGENT)     │  ← instructions, reasoning, tool calls
│  • scoped to ~/Desktop/      │
│    daily-dose                │
│  • tools: Bash, Read, Edit,  │
│    GitHub MCP, …             │
└────┬───────────────┬─────────┘
     │ calls         │ edits files in
     ▼               ▼
┌──────────────┐  ┌────────────────────┐
│ GitHub MCP   │  │  Daily Dose        │
│ (tool layer) │  │  (codebase /       │
│              │  │   web app — NOT    │
│              │  │   an agent)        │
└──────────────┘  └────────────────────┘
                            │
                            ▼
                  ┌────────────────────┐
                  │ Visitor's browser  │
                  │ (loads quotes)     │
                  └────────────────────┘
```

---

## What does "Daily Dose used the GitHub MCP" actually translate to?

It translates to a wrong sentence. What really happened during the recent MCP work:

- **Claude Code** (the agent) called GitHub MCP tools (e.g. `list_pull_requests`, `get_file_contents`)
- While **editing files in Daily Dose** (the codebase)
- The running Daily Dose website has no MCP client and doesn't know MCP exists

The agent and the codebase happen to share a working directory. That proximity is what makes the confusion easy.

---

## Two kinds of MCP work (both exam-relevant)

| Activity | What it means | Status in this project |
|---|---|---|
| **Consume an existing MCP server** | Wire someone else's MCP server (e.g. official GitHub MCP) into your agent. Configure allow/deny lists. | ✅ done — see [.claude/settings.local.json](../../.claude/settings.local.json) and [.claude/settings.json](../../.claude/settings.json) |
| **Build your own MCP server** | Write a small server process that exposes tools *you* define. Any MCP-aware agent could then call those tools. | ❌ not yet — possible future step (Domain 2 deep-dive) |

Domain 2 of GH-600 ("Implement tool use and environment interaction") covers both.

---

## Where GitHub Copilot custom agents fit

A **Copilot custom agent** is a *new agent*, not a new feature of Daily Dose. It's a sibling to Claude Code, but living inside GitHub Copilot's ecosystem:

- Has its own instructions
- Has its own scope (a repo, an org, a workflow)
- Has its own tools — which *could* be served by an MCP server, or could be Copilot-native tools

That's why building one means creating a **separate project folder**, not a subfolder of Daily Dose. We are building a new agent — not adding a feature to an existing app.

---

## Sequencing for Option A (from the study plan)

1. **First**, build a small Copilot custom agent: instructions + maybe one inline tool. Learn the agent shape end-to-end.
2. **Then** (optional, exam-relevant), build a small MCP server that exposes one or two tools. Have the new agent use it. A "Daily Dose MCP server" exposing the quotes API would tie the side project back to this one — Claude Code → Copilot agent → MCP server → Daily Dose API.

---

## TL;DR (one sentence per concept)

- **Agent** — the thing with instructions that reasons and calls tools (Claude Code, a future Copilot agent).
- **MCP server** — a separate process that exposes tools to agents. Not an agent itself.
- **Daily Dose** — the codebase being worked on. Not an agent. Doesn't call tools.
- **Tool consumption** ≠ **tool authorship** — wiring up the GitHub MCP (consumption) is different from writing our own MCP server (authorship). Both matter for GH-600.

---

## Related notes
- [gh-600-study-plan.md](./gh-600-study-plan.md) — the 4–6 week plan this fits into
- [fine-grained-pat-public-repo-quirk.md](./fine-grained-pat-public-repo-quirk.md) — concrete guardrail finding from the MCP setup work
