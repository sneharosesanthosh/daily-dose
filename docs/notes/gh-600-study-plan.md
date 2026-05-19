# GH-600 — Developing in Agentic AI Systems

> Study plan generated 2026-05-18 in conversation with Claude. Saved here so it survives context compaction.

**Important first — GH-600 is NOT the basic "GitHub Actions" cert.** It's **"Developing in Agentic AI Systems"** — a new exam (released May 2026) about operating AI agents within GitHub-based SDLC workflows.

Microsoft Learn study guide: https://learn.microsoft.com/en-gb/credentials/certifications/resources/study-guides/gh-600

---

## What GH-600 covers

| Domain | Weight |
|---|---|
| **Prepare agent architecture and SDLC processes** | 15–20% |
| **Implement tool use and environment interaction** (MCP servers, tools, agent scope) | 20–25% |
| **Manage memory, state, and execution** | 10–15% |
| **Perform evaluation, error analysis, and tuning** | 15–20% |
| **Orchestrate multi-agent coordination** | 15–20% |
| **Implement guardrails and accountability** | 10–15% |

### Skills assessed
- Configuring MCP servers and allow lists
- Branch-based agent scopes
- Custom agents (GitHub Copilot, agent SDKs)
- Defining autonomy levels and human-in-the-loop checkpoints
- Multi-agent orchestration patterns
- Memory strategies (short/long-term, drift detection)
- Evaluation signals and error analysis

**The audience profile:** *"Subject matter expertise in operating, integrating, supervising, and governing AI agents inside production-grade SDLC workflows."*

This isn't a "code along with a tutorial" exam. It's about *supervising AI agents* in real engineering workflows.

---

## Can you crack it?

**Yes — with focused work.**

You've been LIVING the exam content already while building Daily Dose:
- Set up **guardrails** (Claude Code's permission system, with allow lists)
- Configured **agent scope** (the `seed-quotes` and `arch-explorer` skills are scoped custom agents)
- Enforced **human-in-the-loop** (every Bash command needed your approval)
- Added **observability** (you reviewed PRs, watched CI logs)
- Built **inspectable artifacts** (`ARCHITECTURE.md`, the arch-explorer)

You already understand the *spirit* of the exam — agents as collaborators with bounded autonomy, not autonomous wrecking balls. Most candidates start cold.

### Gaps to close

- **MCP servers** — what they are, how to configure, how to allow-list
- **Custom GitHub Copilot agents** — the SDK, instructions files, tools registration
- **Multi-agent orchestration** — agents talking to agents, conflict resolution, isolation
- **Memory strategies** — agent state across runs, drift detection
- **Evaluation frameworks** — how to measure if an agent is performing well (logs, traces, artifacts)

---

## Continue this project or start a new one?

**Continue THIS one — but extend it for exam topics.**

1. You already have a working SDLC: repo, CI, branch protection, PRs, deploys. Don't rebuild that.
2. You have an existing agent setup: Claude Code with permissions, custom skills (`/seed-quotes`, `/arch-explorer`).
3. Building on something real beats throwaway tutorials.

You'll also need to step outside this project to practice GitHub Copilot custom agents (which Daily Dose won't teach you).

---

## Concrete 4–6 week study plan

### Week 1–2 — Foundations and architecture (Domain 1)

- Read Microsoft Learn's [Foundations of Agentic AI in GitHub](https://learn.microsoft.com/en-us/training/modules/foundations-agentic-ai/)
- Read [Designing Agent Architecture and SDLC Integration](https://learn.microsoft.com/en-us/training/modules/design-agent-architecture-integration/)
- **In Daily Dose:** Document your agent architecture explicitly. What's the scope? What tools does Claude Code have access to? What's the human-in-the-loop step?

### Week 2–3 — Tools and MCP servers (Domain 2 — biggest %, prioritize)

- Read [Tooling, MCP, and Agent Execution Environments](https://learn.microsoft.com/en-us/training/modules/agent-tooling-mcp-execution-environments/)
- **Hands-on:** Set up an MCP server in Claude Code (GitHub MCP). Configure allow lists. Try restricting which tools it can call.
- **In Daily Dose:** Add an MCP server that gives Claude Code direct access to GitHub APIs.
- **Side project:** Build a GitHub Copilot custom agent following [the docs](https://docs.github.com/en/copilot/how-tos/copilot-sdk/use-copilot-sdk/custom-agents).

### Week 3–4 — Memory, state, evaluation (Domains 3, 4)

- Read [Manage Memory, State, and Execution](https://docs.github.com/en/copilot/concepts/agents/copilot-memory)
- **Hands-on:** Read your own auto-memory files in `~/.claude/projects/-Users-sneha-Desktop-daily-dose/memory/` — you've been building agent memory all along.
- **In Daily Dose:** Add evaluation criteria for `/seed-quotes` (what makes a "good" generated quote? How would you measure?)

### Week 4–5 — Multi-agent and guardrails (Domains 5, 6)

- Read [Orchestrate Multi-Agent Coordination](https://docs.github.com/en/copilot/how-tos/copilot-sdk/use-copilot-sdk/custom-agents)
- **Side project:** Build a workflow where two agents collaborate (e.g., one generates a code change, another reviews it).
- **In Daily Dose:** Add a CI workflow that uses a GitHub Action with autonomous decision-making.

### Week 5–6 — Practice exam, gaps, review

- Take Microsoft's exam sandbox: https://aka.ms/examdemo
- Use practice exams (if Microsoft has any) or build flashcards for the specific skills
- Review your weakest domain twice

---

## What to try RIGHT NOW in Daily Dose (maps to exam objectives)

| Exam skill | Try in this project |
|---|---|
| Configure agent tool permissions | Audit your `.claude/settings.local.json` — what's auto-allowed? What's denied? Make some changes deliberately. |
| Implement guardrails | Set up branch protection (done!), require human review, define what agents can/can't merge |
| Configure agent scope to a specific repository | Your `.claude/skills/` is repo-scoped — explore why and how |
| Implement traceability and accountability | Look at your git log + PR history — that's literal accountability for agent actions |
| Define inputs, outputs, and success criteria | Your `seed-quotes` skill has these (category in, formatted quotes out, success = paste-ready format) |
| Configure MCP allow lists | Set up an MCP server with restrictive allow lists. Try denying things to see what happens. |

---

## TL;DR

> Yes, you can crack GH-600 — but it's an **advanced** cert about supervising AI agents, not basic Actions. 4–6 focused weeks to fill gaps (MCP servers, custom Copilot agents, multi-agent patterns, formal evaluation). Continue Daily Dose as your sandbox — it's perfect — but supplement with side experiments and Microsoft Learn modules. You're more prepared than you think, but don't underestimate the depth of the new material.
