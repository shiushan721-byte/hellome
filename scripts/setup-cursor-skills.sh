#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_DIR="$ROOT/.cursor/skills"
VENDOR_DIR="$ROOT/.cursor/agent-skills/skills"

cd "$ROOT"

git submodule update --init --recursive .cursor/agent-skills

if [[ ! -d "$VENDOR_DIR" ]]; then
  echo "Missing vendor skills at $VENDOR_DIR" >&2
  exit 1
fi

for skill_path in "$VENDOR_DIR"/*; do
  skill_name="$(basename "$skill_path")"
  link_path="$SKILLS_DIR/$skill_name"

  if [[ -e "$link_path" && ! -L "$link_path" ]]; then
    echo "Skip $skill_name (project-owned skill already exists)"
    continue
  fi

  ln -sfn "../agent-skills/skills/$skill_name" "$link_path"
  echo "Linked $skill_name"
done

echo "Cursor skills ready in $SKILLS_DIR"
