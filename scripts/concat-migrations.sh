#!/usr/bin/env bash
# Concatenate migrations 001-010 for pasting into the Supabase SQL editor.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
out="${1:-/tmp/pulseflow-all-migrations.sql}"
: > "$out"
for f in "$root"/supabase/migrations/*.sql; do
  echo "-- >>> $(basename "$f")" >> "$out"
  cat "$f" >> "$out"
  echo "" >> "$out"
done
echo "Wrote $out"
