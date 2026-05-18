---
name: arch-explorer
description: Scaffold an interactive single-page architecture explorer for any codebase. Produces a self-contained `arch-explorer/` folder with a curated component map + per-flow JSON files, opened in a browser via a one-line http server. Use when the user asks to "document the architecture", "show how the system connects", "build an interactive system diagram", "map out the flows", or wants a clickable flow explorer instead of a static Mermaid diagram. Bundled template includes the runtime HTML/CSS/JS (cursor-anchored pan/zoom, drag-pan, collision-avoiding labels, sequenced step panel) — you only fill in JSON.
---

# arch-explorer

A skill for scaffolding **interactive architecture documentation**. The output is a static folder you serve with `python3 -m http.server`. No build step, no JS framework, no dependencies beyond a browser.

Every numbered flow renders as a sequenced journey across the components. The overview flow renders as labelled structural relationships. You don't write any UI code — you write **two kinds of JSON** and the bundled runtime handles the rest.

## Trigger conditions

Invoke this skill when the user wants any of the following:

- "Document the architecture / system design"
- "Show how X talks to Y end-to-end"
- "Build a clickable / interactive system diagram"
- "Map out the workflows / journeys / flows between [services]"
- "An architecture explorer" / "system explorer" / "flow explorer"
- A clickable replacement for a static Mermaid / PlantUML diagram

**Skip this skill** if the user wants:
- A static diagram only (Mermaid + a markdown file is faster).
- Auto-extracted dependency graphs (this skill is curated, not extracted).
- A force-directed graph (no built-in physics; nodes are placed at fixed `x`/`y`).

## Output

A folder (default `tools/dev/arch-explorer/` or `docs/arch-explorer/`) with:

```
arch-explorer/
├── index.html              ← runtime, copy verbatim from skill template/
├── serve.sh                ← starts python3 http.server, copy verbatim
├── README.md               ← user-facing usage doc, copy verbatim
├── components.json         ← the canvas: lanes + positioned components
└── flows/
    ├── _index.json         ← sidebar category structure
    ├── overview.json       ← always-present, auto-loaded, unnumbered
    └── <flow-id>.json      ← one numbered journey per file
```

The runtime (`index.html`) does **everything visual**: pan, zoom, hit-testing, badge layout, collision avoidance, animations. You only edit JSON.

---

## Workflow

### Step 1 · Place the folder

Ask the user (or pick a sensible default):

- Mono-repo with a `tools/dev/` convention → `tools/dev/arch-explorer/`
- General project → `docs/arch-explorer/` or root `arch-explorer/`

### Step 2 · Copy the template verbatim

Copy every file from this skill's `template/` directory into the target folder. The skill template lives next to this SKILL.md, at `~/.claude/skills/arch-explorer/template/` (or wherever your harness stores user skills).

```bash
SKILL=~/.claude/skills/arch-explorer
TARGET=<repo>/tools/dev/arch-explorer
mkdir -p "$TARGET/flows"
cp "$SKILL/template/index.html" "$TARGET/"
cp "$SKILL/template/serve.sh"   "$TARGET/" && chmod +x "$TARGET/serve.sh"
cp "$SKILL/template/README.md"  "$TARGET/"
cp "$SKILL/template/components.json"      "$TARGET/"
cp "$SKILL/template/flows/_index.json"    "$TARGET/flows/"
cp "$SKILL/template/flows/overview.json"  "$TARGET/flows/"
cp "$SKILL/template/flows/user-signup.json" "$TARGET/flows/"
```

The bundled `components.json` ships with a 6-component "Hello World" architecture (web-client / api-server / worker / database / queue / OAuth IdP) and one example numbered flow (`user-signup.json`) so the page works immediately. Replace them as you map the user's system.

### Step 3 · Discover the system

**Do not guess flows from imagination.** Trace actual code. If your harness supports parallel sub-agents (Claude Code has `Agent`, OpenCode has `task`, etc.), launch them in parallel — one per flow area:

> Brief: Trace [flow area] flows in `<repo path>`. For each flow return ordered steps as `{from, to, label, payload, note, ref}` where `ref` is `path/to/file.ext:lineNumber`. Use ONLY these component IDs in `from`/`to`: [stable IDs you've declared in components.json]. Mark UNCERTAIN inline where you couldn't verify the hop. Return Markdown with one `## flow-id` per flow plus a bulleted step list.

Typical flow areas to map in parallel (rename to fit the codebase):

| Area | Examples |
|---|---|
| Auth / onboarding | signup, sign-in, OAuth, dev bypass, invitations |
| Users / permissions | invite, accept, role binding, role checks |
| Entity / content CRUD | create, rename, delete, list, reorder |
| Runtime / playback | content sync, playback engine, telemetry |
| Infrastructure / workers | uploads, embeddings, scheduled jobs, emails |
| Observability | telemetry ingest, admin dashboards |

If your harness does NOT support parallel sub-agents, do the same thing serially: open the relevant directories, grep for entry points (handler, route, controller, endpoint definitions), and read along the call chain.

### Step 4 · Populate `components.json`

**Schema:**

```json
{
  "title": "My System",
  "stage": { "width": 1700, "height": 820 },
  "lanes": [
    { "id": "client",   "label": "Clients",          "y": 80 },
    { "id": "server",   "label": "Services",         "y": 240 },
    { "id": "storage",  "label": "Data + queues",    "y": 400 },
    { "id": "external", "label": "External",         "y": 560 }
  ],
  "components": [
    {
      "id":      "kebab-case-id",
      "label":   "display-name",
      "lane":    "client | server | storage | external | ...",
      "kind":    "short type — e.g. 'CF Worker (TS)', 'Go + SQLite', 'OAuth provider'",
      "path":    "repo/path/  OR  external URL",
      "x":       180,
      "y":       80,
      "summary": "One-line tooltip describing the component's purpose."
    }
  ]
}
```

`title` (optional) sets the header and page title. Omit to keep the default "Architecture · Explorer".

**Layout guidelines:**

- 4–6 horizontal lanes, top-down by abstraction (clients on top, infra/external on bottom).
- Components within a lane share the same `y`.
- Space components ~180px apart horizontally; 160px between lanes vertically.
- Stage default 1700×820. For smaller systems use 1000×600. The runtime fits-to-window on first paint regardless.
- Lane `y` should match the components' `y` (the lane label renders ~22px above).
- Box dimensions are fixed in CSS at 150×56. Don't overlap two components within ~180px horizontal.

**Component-ID rules:**

- Lowercase, kebab-case, stable. Used as foreign keys in flows.
- Prefer the real noun ("pocketbase", "signup-worker", "r2") over generic ("backend", "storage").

### Step 5 · Populate flows/*.json

**Schema:**

```json
{
  "id": "kebab-case-id",
  "title": "Human-readable title",
  "category": "Must match a label in flows/_index.json",
  "actor": "Who initiates this — e.g. 'Anonymous visitor', 'Admin', 'Background cron'",
  "summary": "One-paragraph what + why. Surfaces in the panel header.",
  "unnumbered": false,
  "steps": [
    {
      "from":    "component-id",
      "to":      "component-id",
      "label":   "HTTP verb / event name — e.g. 'POST /api/v1/foo'",
      "payload": "Key body fields, ≤80 chars — e.g. '{ id_token, org_name }'",
      "note":    "Why this hop exists — one sentence.",
      "ref":     "path/to/file.ext:lineNumber"
    }
  ]
}
```

**Field rules:**

- `from` / `to` MUST exist in `components.json`. Validate before declaring done (see Step 7).
- `label` is shown inline next to the step. Keep it short — verb + path or event name.
- `payload` is rendered in monospace below the step. Truncate complex objects.
- `note` is prose context. One sentence, not a paragraph.
- `ref` lets the reader navigate to source. Always include a line number when possible.
- Self-loops (`from === to`) are valid — used for in-process work. Runtime fans them as badges above the node.

**Special flow: `overview.json`**

- ALWAYS include one named exactly `overview` with `"unnumbered": true`.
- Auto-loaded on first paint.
- 15–25 structural relationships covering the big picture.
- `label` becomes the visible pill text on the arrow ("Signup", "Bundle sync", "Provision tenant").
- No `payload` needed; `note` and `ref` still useful.

### Step 6 · Populate `flows/_index.json`

Groups flows into collapsible sidebar categories:

```json
{
  "categories": [
    {
      "id":    "auth",
      "label": "Auth & onboarding",
      "flows": ["tenant-signup", "google-oauth-signin", "..."]
    }
  ]
}
```

- Flows listed here but with no file render as italic / grayed-out in the sidebar — handy for stubs you plan to fill later.
- `overview` is NOT listed in `_index.json` — it's a special always-on entry above the categories.

### Step 7 · Validate

Run a quick sanity check before declaring done. This catches broken `from`/`to` references and missing flow files:

```python
import json, glob, os
comp = json.load(open('components.json'))
known = {c['id'] for c in comp['components']}
broken = []
for path in sorted(glob.glob('flows/*.json')):
    if path.endswith('_index.json'): continue
    flow = json.load(open(path))
    for i, step in enumerate(flow.get('steps', [])):
        for end in ('from', 'to'):
            if step.get(end) not in known:
                broken.append(f"{path} step {i+1} {end}={step.get(end)}")
idx = json.load(open('flows/_index.json'))
listed = [f for c in idx['categories'] for f in c['flows']]
missing_files = [f for f in listed if not os.path.exists(f'flows/{f}.json')]
print("BROKEN REFS:", broken or "none")
print("INDEX FLOWS WITHOUT FILES:", missing_files or "none")
```

A broken `from`/`to` causes the runtime to silently skip the arrow.

### Step 8 · Verify in a browser

```bash
bash arch-explorer/serve.sh    # → http://localhost:8765
```

If your harness has browser-automation (Playwright, Puppeteer, etc.), walk through every flow programmatically and assert:

- Overview loads on first paint.
- Each flow's badges all have unique screen positions (no overlap).
- No badge overlaps a node bounding box (text underneath stays visible).
- Clicking a node cycles through its hops in sidebar order.

If your harness has no browser, instruct the user to open the URL and click around.

---

## Schema reference (full)

### `components.json`

```json
{
  "title":  "string (optional, header + page title)",
  "stage":  { "width": 1700, "height": 820 },     // canvas pixel size
  "lanes": [
    { "id": "string", "label": "string", "y": 80 }
  ],
  "components": [
    {
      "id":      "string (kebab-case, unique)",
      "label":   "string (display)",
      "lane":    "string (matches lanes[].id)",
      "kind":    "string (type label)",
      "path":    "string (repo path or URL)",
      "x":       0,        // absolute px on stage
      "y":       0,        // matches lane y
      "summary": "string"  // tooltip
    }
  ]
}
```

### `flows/_index.json`

```json
{
  "categories": [
    { "id": "string", "label": "string", "flows": ["flow-id", "..."] }
  ]
}
```

### `flows/<id>.json`

```json
{
  "id":         "string (must match filename)",
  "title":      "string",
  "category":   "string (display, matches a category label)",
  "actor":      "string",
  "summary":    "string",
  "unnumbered": false,        // true for overview-style pills
  "steps": [
    {
      "from":    "string (component id)",
      "to":      "string (component id)",
      "label":   "string (short)",
      "payload": "string (optional)",
      "note":    "string (optional)",
      "ref":     "string (optional, path:line)"
    }
  ]
}
```

---

## What the runtime gives you (no work needed)

You don't change `index.html`. It already implements:

| Feature | Behaviour |
|---|---|
| Pan & zoom | Cursor-anchored zoom via translate-based stage (Cmd/Ctrl+wheel, pinch, +/-/0 keys, buttons). Cursor drift ≤2px. |
| Drag-to-pan | Empty canvas drag, middle-mouse anywhere, Space+drag anywhere. `grab`/`grabbing` cursor. |
| Connector click | Wide invisible 14px stroke hit path lays under each arrow. Click anywhere on it → highlights that hop. |
| Node click cycle | Click a node → activates its first hop. Click again → next hop in journey order. Wraps. Per-node cursor. |
| Step panel | Right-side card lists every hop. Hover/click syncs the canvas highlight. ↑/↓ arrow keys step through. |
| Label collision | Pills/badges read their own `offsetWidth/Height` and try 13 different `t`-values along the bezier curve until they don't overlap a node OR a previously-placed badge. |
| Self-loops | `from === to` steps fan as a row of badges above the node with thin connector stubs. |
| Reciprocal arrows | A→B and B→A fan to opposite sides via a canonical perpendicular. |
| Parallel arrows | Multiple same-direction A→B hops fan as a centred ribbon (e.g. 4 separate D1 writes from one worker). |
| Overview pills | `unnumbered: true` swaps numbered circles for text pills with the step `label`. |
| Vector strokes | All paths have `vector-effect: non-scaling-stroke` so arrow width stays legible at every zoom. |
| Crisp re-rasterize | No `will-change` on the stage; no permanent CSS transition. HTML re-paints at every scale → no bitmap-stretch blur. |
| rAF batching | `scheduleTransform()` coalesces multiple wheel events per frame into a single paint. |
| Fit on load | Auto-fits stage with 48px breathing margins on each side. |

If you find yourself wanting to edit `index.html`: don't. Edit the JSON. The runtime is intentionally complete.

---

## Anti-patterns (learned the hard way)

- **Don't fabricate flows.** If a step is unverified, omit it or mark UNCERTAIN inline. Wrong arrows in architecture docs are worse than missing ones because the reader builds their mental model from this.
- **Don't auto-extract the graph from imports/exports.** Imports show coupling, not journeys. The whole point is hand-picked clarity.
- **Don't add a build step.** No `npm install`, no `webpack`, no `vite`. The folder is self-contained. If you need a dependency, embed it.
- **Don't replace per-flow files with one big file.** Per-flow files give you clean PR diffs and parallel edits.
- **Don't estimate pill widths.** Measure `offsetWidth` after the badge is in the DOM (the runtime already does this — but if you tweak it, remember). String-length × constant is wrong by ~70% for real CSS.
- **Don't promote the stage to a GPU layer.** `will-change: transform` makes the stage bitmap-scale during zoom — text gets blurry. Re-rasterise instead.
- **Don't apply CSS transitions during wheel events.** Continuous input + 80ms tween = perpetually-stale visible scale.
- **Don't exclude the from/to nodes from collision checks.** Step badges that land on their own from/to still hide that node's text label. Treat every node as an obstacle.
- **Don't use the `flow.actor` field to identify the actor in arrow labels.** It's metadata for the panel only.
- **Don't put the overview button inside `_index.json`'s categories list.** It's a special standalone button at the top of the sidebar; the runtime renders it from a hard-coded ID.

---

## Runtime architecture (only if you must dig in)

If you genuinely need to modify `index.html`:

- Single ~835-line file, vanilla JS in one IIFE, no build, no modules.
- Three pieces of state: `let zoom, tx, ty;`
- `scheduleTransform()` is rAF-batched; never write `stage.style.transform` directly.
- `applyZoom(z, pivotClient, smooth)` computes new tx/ty so the world point under `pivotClient` (or viewport centre) stays at the same screen pixel.
- `computeSlots(steps)` pre-passes each flow to assign per-step slot/total within ordered-pair groups (and self-loop groups). Drives the fan layout.
- `drawArrowStep` and `drawSelfStep` create both a visible `path` and an invisible 14-px-stroke `path.hit` for clickability.
- `placedBadges[]` accumulates already-rendered badge bboxes per flow; new badges iterate `t` values along the curve and pick the first non-colliding position.
- Component nodes are positioned absolutely inside `.stage` using `left`/`top` from JSON. SVG `<path>` elements use the same coordinate space (no separate transform).
- All paths get `vector-effect: non-scaling-stroke` so stroke-width stays constant across zoom levels.
- The `.animating` class temporarily applies a 140ms cubic-bezier transition — added only when buttons or fit trigger zoom, removed after a timer.

---

## Reference sizing

The first project this skill was built for: 24 components × 39 flows × 9 categories. Fits comfortably in a 1700×820 stage at fit zoom on a 1280-wide viewport. Use that as a rough capacity ceiling per page — beyond ~60 components or ~80 flows the layout gets cluttered. For systems that big, split into multiple explorers (e.g. one per bounded context).

---

## Handoff summary the user sees

When done, tell the user:

```
arch-explorer scaffolded at <path>:
- <N> components across <M> lanes
- <K> flows across <C> categories
- run: `bash <path>/serve.sh` → http://localhost:8765

Edit components.json + flows/*.json to extend. The runtime in index.html
is generic and shouldn't need changes.
```
