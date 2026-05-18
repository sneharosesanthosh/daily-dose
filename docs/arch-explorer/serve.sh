#!/usr/bin/env bash
# Serve the arch-explorer over HTTP so fetch() works (file:// is blocked by browsers).
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-8765}"
echo "ShowGround arch-explorer → http://localhost:${PORT}/"
cd "$DIR" && exec python3 -m http.server "$PORT"
