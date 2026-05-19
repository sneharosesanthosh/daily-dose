# MCP from First Principles — a learning conversation

> Generated 2026-05-19 in conversation with Claude. Saved here so it survives context compaction.
>
> This file captures the back-and-forth of how I (Sneha) came to understand MCP, including my doubts and the clarifications. Read top-to-bottom — each section builds on the previous one.

---

## Part 1 — What's the fundamental problem MCP solves?

### Step 1: What an LLM actually IS

I (Claude) am a **prediction engine for text**. Given some input text, I predict what comes next. That's literally all I do at my core.

I can't do anything in the world by myself. I can't:
- Read a file from disk
- Send an HTTP request
- Query a database
- Run a shell command
- Look at the current weather

I'm like **a brain in a jar with no body**. Brilliant at thinking. Zero ability to act.

### Step 2: The "tools" idea

For me to be useful in the real world, someone has to give me **hands**. The way that's done is called **tools**:

> Someone writes a function (in real code: Python, JavaScript, whatever), tells me about it ("here's a function called `read_file(path)` that returns the file's contents"), and when I want to use it, I emit a special message that says *"please call `read_file('/path/to/foo')` and tell me the result."* The harness around me actually executes the function and feeds the result back to me.

That's it. Tools are just functions the LLM can request. The execution happens *outside* the LLM, in regular software.

In Claude Code, the tools I have right now include:
- `Bash` — runs a shell command
- `Read` — reads a file
- `Write` / `Edit` — modifies files
- `Grep` — searches text

### Step 3: The scale problem

Now imagine you're building an app where the LLM needs access to:
- GitHub (PRs, issues, repos)
- A database (queries, schema)
- Slack (send messages)
- Calendar (read events)
- Stripe (read payments)
- ...and 50 more things

For each one, **someone has to write tool definitions, implement the wiring, handle auth, parse errors**, and so on. Every. Single. App. Has to. Redo. This.

So Cursor's team writes GitHub integration. Claude Code's team writes GitHub integration. Your friend's homemade AI app writes GitHub integration. All slightly different, all maintained separately, all reinventing the wheel.

**This is the fundamental problem MCP solves.**

---

## Part 2 — What MCP actually is

**Model Context Protocol** is a **standard way for LLM apps to discover and call external tools.**

It says: *"Here's a universal language for an LLM app to ask a tool provider 'what can you do?' and then to call those tools."*

### The USB analogy

Before USB:
- Mouse → mouse port (PS/2)
- Keyboard → keyboard port (PS/2)
- Printer → parallel port (DB-25)
- Modem → serial port (RS-232)

Every new device meant new cables, new ports, new drivers.

After USB:
- One standard. Any device + any computer + any cable → it just works.

**MCP is USB for AI tools.**

- Before MCP: every LLM app builds its own GitHub integration, database integration, etc.
- After MCP: someone writes a "GitHub MCP server" once, and *every* MCP-compatible LLM app (Claude Code, Claude.ai, Cursor, etc.) can use it.

### What an MCP server actually is, in code

It's a separate program that:
1. **Starts up** when the LLM app needs it (or runs as a long-lived service)
2. **Tells the LLM app what tools it offers** — e.g., `"create_pr"`, `"list_issues"`, `"merge_pr"`
3. **Listens for tool calls** from the LLM app
4. **Executes them** (calling GitHub's API)
5. **Returns structured results** back to the LLM

---

## Part 3 — How MCP differs from current setup

### Operation: "Open a PR for my current branch"

#### Way 1 — current (via Bash + gh)

```
Me: I want to create a PR.

I emit: Bash({ command: "gh pr create --title 'My change' --base main --head feature" })

Claude Code: [runs that shell command]
   ↓
Shell: spawns the `gh` binary
   ↓
gh: reads my GitHub token, makes HTTPS POST to api.github.com/repos/.../pulls
   ↓
GitHub: creates the PR, returns JSON
   ↓
gh: parses JSON, prints a human-friendly URL to stdout
   ↓
Claude Code: captures stdout as a string
   ↓
Returns to me: "https://github.com/sneharosesanthosh/daily-dose/pull/9"
```

I had to:
- Know the EXACT `gh` command syntax
- Hope I quoted the title correctly
- Parse a stdout string to find the URL

Permission system: `Bash(gh pr create *)` — but `gh` has hundreds of subcommands. If I allowlist all `gh`, I've also allowed `gh repo delete`, `gh release create`, etc.

#### Way 2 — with MCP (hypothetical, with GitHub MCP installed)

```
Me: I want to create a PR.

I emit: github__create_pr({
  title: "My change",
  base:  "main",
  head:  "feature"
})

Claude Code: [routes to already-running GitHub MCP server]
   ↓
GitHub MCP server: receives structured call with typed parameters
   ↓
Makes HTTPS POST to api.github.com (same destination as gh)
   ↓
Returns structured JSON: { pr_number: 9, url: "...", state: "open" }
```

I:
- Don't need shell syntax
- Pass structured parameters with types
- Get structured data back

Permission system: each function is its own permission. `github__create_pr` can be allowed while `github__delete_repo` stays denied.

### Side-by-side comparison

| | Current (Bash + gh) | With MCP |
|---|---|---|
| **What I emit** | Shell command string | Structured function call |
| **What runs it** | Shell spawns binary | MCP server (already running) |
| **Input handling** | Construct correct shell syntax | Schema-validated arguments |
| **Output handling** | Parse stdout text | Get structured JSON |
| **Permission granularity** | Per-command-pattern | Per-function |
| **Reusable across LLM apps** | Each app needs own wiring | Any MCP app uses same server |

---

## ❓ Sneha asked: "Permission granularity is per-tool or per-function?"

Sharp catch — they're the same thing in MCP-speak.

In LLM/AI vocabulary:

> **Tool = one specific function the LLM can call, with defined inputs and output.**

A whole MCP server is just a **bundle of tools** (a bundle of functions). The server itself isn't called a tool — it's a "server" or "provider." Each individual operation it exposes IS a tool.

Hierarchy:
```
MCP server (one process)         ← "GitHub MCP"
  │
  ├── Tool: create_pr            ← each tool is one function
  ├── Tool: list_prs
  ├── Tool: merge_pr
  ├── Tool: delete_repo
  └── Tool: ...
```

Permissions live at the bottom level. **Per-tool = per-function.**

---

## ❓ Sneha asked: "What does 'Shell → spawns binary' mean?"

### The 3 concepts

**1. What's a "binary"?**
When you install a program (like `gh`, `git`, `node`), what gets put on your computer is a **file containing machine code** — compiled, ready-to-run instructions for your CPU.

```bash
which gh
# /opt/homebrew/bin/gh    ← that's the gh binary
```

**2. What's a "shell"?**
A **shell** is a program that reads commands you type and executes them. Examples: `bash`, `zsh`, `fish`. When you open your terminal, you're talking to a shell.

**3. What's "spawning"?**
"Spawn" means the OS creates a new running process from a binary file. A binary just sits on disk doing nothing. To actually USE it, you load it into memory and start running it. That act = spawning.

### Full chain when you type `gh pr create`

```
You type:  gh pr create --title "foo"
   ↓
1. Shell (zsh) reads the string
2. Shell parses: command "gh", arguments ["pr", "create", "--title", "foo"]
3. Shell looks for "gh" in PATH → finds /opt/homebrew/bin/gh
4. Shell asks OS: "spawn a process from this binary, with these args"
5. OS loads /opt/homebrew/bin/gh into RAM, starts it running
6. The gh process runs: reads config, makes API call, prints output, exits
7. Shell shows next prompt
```

### Library analogy

- **Binaries** = books on shelves. Just stored. Not doing anything.
- **The shell** = librarian. Finds the book when you ask.
- **Spawning** = opening the book and starting to read it. Now it's *active*.

### Why this matters for MCP

**Current setup:** every `gh` command = spawn new gh process → it runs → it dies. 10 commands = 10 process spawns.

**MCP setup:** MCP server spawned ONCE at startup, keeps running. Each operation is a message to the already-running process. No spawns per operation.

---

## ❓ Sneha asked: "So the binary file has an API call to GitHub?"

**Yes, exactly.**

### What's inside the gh binary

The `gh` tool is written in **Go**. Inside the source code:

```go
func createPR(title, body, base, head string) error {
    request := http.POST(
        "https://api.github.com/repos/{owner}/{repo}/pulls",
        headers: {
            "Authorization": "Bearer " + readTokenFromConfig(),
        },
        body: { "title": title, "body": body, "base": base, "head": head },
    )
    response := request.send()
    parseAndPrintResult(response)
}
```

When developers ship `gh`, they **compile** this Go code into a single binary. The binary contains the machine-code version of all that logic — URLs, headers, JSON shapes.

### Full chain (everything tied together)

```
You: "Open a PR"
   ↓
Me (Claude): I emit Bash({ command: "gh pr create ..." })
   ↓
Claude Code harness: executes via Bash tool
   ↓
Shell (zsh): finds /opt/homebrew/bin/gh, spawns it
   ↓
gh binary runs:
  - Reads your GitHub token from ~/.config/gh/hosts.yml
  - Builds HTTPS POST to api.github.com/repos/.../pulls
  - Sends it over the network
   ↓
[request crosses internet — your wifi → ISP → undersea cables → datacenters]
   ↓
GitHub's servers: validate token, create PR, respond with JSON
   ↓
gh binary: parses JSON, prints URL to stdout
   ↓
Shell: captures stdout
   ↓
Claude Code: returns string to me
   ↓
Me: "Here's your PR: https://..."
```

Every step is a real thing happening on real computers. No magic.

### A deep insight worth absorbing

> **Almost every CLI tool that talks to an online service is just a friendly wrapper around HTTP API calls.**

- `gh` = wrapper around GitHub's REST API
- `aws` = wrapper around AWS's HTTP APIs
- `gcloud` = wrapper around Google Cloud's APIs
- `curl` = the most generic wrapper, you specify URL/headers yourself

If `gh` didn't exist, you could do the same thing with `curl`:

```bash
curl -X POST \
  -H "Authorization: Bearer $YOUR_TOKEN" \
  https://api.github.com/repos/sneharosesanthosh/daily-dose/pulls \
  -d '{ "title": "My change", "base": "main", "head": "feature" }'
```

### So what's MCP really?

> An MCP server is **another wrapper around the same HTTP API**, but instead of you calling it via shell commands, the LLM calls its functions directly with structured arguments.

The underlying conversation with GitHub is **identical** whether you use `gh`, `curl`, or an MCP server. They're all sending HTTPS requests to `api.github.com`.

**The realization:** almost everything you "use" online is HTTP requests underneath. Web pages, mobile apps, CLI tools, AI agents — all just sending/receiving HTTPS messages.

---

## ❓ Sneha asked: "Are the things I permitted earlier MCP tools?"

**No — those are built-in tools, not MCP tools.**

| Type | Where it comes from | Examples in your session |
|---|---|---|
| **Built-in tools** | Ship with Claude Code, always there | `Bash`, `Read`, `Write`, `Edit`, `Grep` |
| **MCP tools** | From MCP servers you install | None — none configured yet |

Every action so far has used a built-in tool. You've never seen an MCP permission prompt because there are no MCP servers configured.

If you DID add the GitHub MCP server, you'd start seeing prompts like:
- `mcp_github__create_pr` — allow?
- `mcp_github__delete_repo` — allow? (probably deny!)

These would appear *alongside* existing permissions, not replace them.

---

## ❓ Sneha asked: "Without permission, Claude Code cannot access anything?"

**Correct.** Every tool call — built-in OR MCP — goes through the permission system:

```
I want to do something
   ↓
I emit a tool call
   ↓
Claude Code checks: is this allowed?
   ├─ ✅ Yes → run it, return result
   ├─ ❌ Denied → return error, I have to try a different way
   └─ ❓ Unknown → ask you with a prompt
```

There is no bypass. There is no "trust mode." There is no secret API.

If you set:
```json
"deny": [ "Bash(*)", "Read(*)", "Write(*)", "Edit(*)" ]
```

…I would be **completely paralyzed**. I could chat, think, summarize — but couldn't read a file, run a command, or write a line of code. Brain in a jar, jar locked.

### Architecture diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Claude Code (the harness in your VSCode)                   │
│                                                              │
│  ┌─────────────────────────────────────────────┐            │
│  │            Me (Claude, the LLM)              │            │
│  │   "I want to do X" → emits a tool call       │            │
│  └─────────────────┬───────────────────────────┘            │
│                    ↓                                          │
│  ┌─────────────────────────────────────────────┐            │
│  │   Permission system (your gatekeeper)        │            │
│  │   Checks settings.local.json + asks if unsure│            │
│  └─────────────────┬───────────────────────────┘            │
│                    ↓ (if allowed)                            │
│  ┌─────────────────────────────────────────────┐            │
│  │   Tool execution                              │            │
│  │                                               │            │
│  │   Built-in tools          MCP tools           │            │
│  │   ─────────────           ─────────           │            │
│  │   • Bash    • Read        (none yet)         │            │
│  │   • Write   • Edit                            │            │
│  │   • Grep    • WebFetch                        │            │
│  └─────────────────┬───────────────────────────┘            │
└─────────────────────┼─────────────────────────────────────────┘
                      ↓
              The actual outside world
        (your filesystem, GitHub, network, etc.)
```

**The permission system sits between Claude and the tools** — both built-in AND MCP. Adding MCP doesn't bypass anything; it adds more things on the right side that the same gatekeeper still controls.

### Where to see/edit your allowlist

- Project-level: `/Users/sneha/Desktop/daily-dose/.claude/settings.local.json`
- Global: `~/.claude/settings.json`

Whatever's in `"allow"` is auto-approved; whatever's in `"deny"` is blocked; everything else asks you.

---

## When MCP is NOT worth it

To be balanced — MCP isn't always the right tool:

- **For one-off operations** — overkill if I'll do it once. Bash is fine.
- **When the CLI is genuinely simple** — `git status` doesn't need an MCP server.
- **For small projects** — overhead of running multiple MCP servers isn't worth it.
- **When you DON'T have an MCP server for the thing** — building your own is real work.

For *Daily Dose* (a small portfolio app): MCP is **mostly valuable as a learning exercise** for the GH-600 exam, plus useful for a few things (granular GitHub permissions, structured DB queries).

---

## TL;DR — the full stack of mental models

1. **LLMs are brains with no hands.** "Tools" are how they get hands.
2. **Tools = functions** the LLM can call with arguments.
3. **In Claude Code, built-in tools** are `Bash`, `Read`, `Write`, etc. — always there.
4. **MCP** standardizes tool servers so any LLM app can use any MCP server.
5. **An MCP server** is a long-running process that exposes a bundle of tools.
6. **Underneath it all**, CLI tools and MCP servers both just make HTTPS API calls. The wrapping differs; the underlying internet conversation is the same.
7. **The permission system** gates EVERYTHING — built-in tools AND MCP tools. No bypass exists.
8. **Per-tool = per-function** in MCP-speak (they're the same thing).

---

## What we haven't done yet (future steps)

Saved for later — once Sneha decides to proceed:

- [ ] Install the GitHub MCP server in Claude Code
- [ ] Configure restrictive allow lists for it
- [ ] Generate a fine-grained Personal Access Token (vs. using `gh` auth)
- [ ] Test by creating a PR via MCP instead of `gh`
- [ ] Add a section to ARCHITECTURE.md about MCP usage
- [ ] Phase 2: Postgres MCP (read-only) for content inspection
- [ ] Phase 3: Custom MCP server with project-specific tools

Decisions still pending (from the MCP plan doc):
- **Goal:** learning (a) / project value (b) / both (c)?
- **Risk:** conservative (a) / moderate (b) / permissive (c)?
- **Auth:** existing `gh` auth / fine-grained PAT?
- **Docs:** add to ARCHITECTURE.md or keep separate?
