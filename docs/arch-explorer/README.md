# arch-explorer

Interactive single-page map of a system's components and the flows that travel through them.

## Run it

```bash
bash arch-explorer/serve.sh
# open http://localhost:8765
```

`serve.sh` is just `python3 -m http.server 8765` from this folder — needed because `fetch('flows/*.json')` is blocked over `file://` in modern browsers.

If `http://localhost:8765` hangs on macOS (IPv6/v4 weirdness), use `http://127.0.0.1:8765`. Override the port with `PORT=9000 bash serve.sh`.

## Use it

- First paint is the **Overview** — every structural relationship rendered with text-pill labels (unnumbered, peer arrows). Click the "Overview · the big picture" button at the top of the sidebar any time to return to it.
- Click a flow in the left sidebar → involved components light up, arrows draw between them with numbered step badges.
- The panel on the right lists each hop: `from → to`, HTTP/event label, payload, prose note, and a `file:line` ref into the codebase.
- **Click a connector** → highlights that hop (hit area widened to 14px so you don't need pixel-perfect aim).
- **Click a node** → activates the first hop it touches; **click again** → next hop touching it; wraps after the last. The cycle uses a per-node cursor so switching nodes restarts at 1.
- Hover a component → tooltip with kind + summary + path.
- **Zoom** with the `+`/`−`/`⤢` buttons in the top-right, `Cmd/Ctrl + scroll wheel` (pinch on trackpads), or `+`/`−`/`0` keys (`0` = fit to window). Cursor-anchored — the point under the cursor stays put while zooming. The page fits the window on load.
- **Pan** by dragging on the empty canvas, plain scroll wheel, middle-mouse anywhere, or `Space` + drag anywhere (Figma-style). Cursor is `grab` / `grabbing`.
- `↓`/`↑` (or `→`/`←`) step through hops · `Esc` closes the flow.

## Edit it

- `components.json` — every node on the canvas. Add/move/rename here; `x` and `y` are absolute pixels on the `stage` (default 1000×720).
- `flows/<flow-id>.json` — one flow per file. Schema:
  ```json
  {
    "id": "kebab-case-id",
    "title": "Human title",
    "category": "Matches a category label in _index.json",
    "actor": "Who initiates this",
    "summary": "One-paragraph what+why",
    "unnumbered": false,
    "steps": [
      { "from": "comp-id", "to": "comp-id",
        "label": "POST /api/v1/foo",
        "payload": "{ shape, of, body }",
        "note": "Why this hop exists",
        "ref": "path/to/file.go:42" }
    ]
  }
  ```
  Setting `"unnumbered": true` renders the flow overview-style: text-pill labels on each arrow instead of numbered circles, and no auto-highlighted first hop. Used by `flows/overview.json`.
- `flows/_index.json` — sidebar grouping. A flow listed here but missing a file shows as grayed-out + italic in the sidebar (handy for stub-then-fill).

Refresh the browser after edits. No build, no framework.
