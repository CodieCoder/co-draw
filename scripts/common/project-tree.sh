#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$(cd "$(dirname "$0")/../.." && pwd)}"

EXCLUDES=(
  node_modules
  .git
  .next
  dist
  build
  .turbo
  coverage
  .nyc_output
  .cache
  __pycache__
  .venv
  venv
  vendor
  target
  .idea
  .vscode
  .DS_Store
  Thumbs.db
  '*.log'
)

is_excluded() {
  local name="$1"
  local e
  for e in "${EXCLUDES[@]}"; do
    if [[ "$name" == $e ]]; then
      return 0
    fi
  done
  return 1
}

has_visible_children() {
  local dir="$1"
  local item
  while IFS= read -r item; do
    [[ -z "$item" ]] && continue
    local bname="${item##*/}"
    is_excluded "$bname" && continue
    if [[ -f "$item" ]]; then
      return 0
    fi
    if [[ -d "$item" ]]; then
      has_visible_children "$item" && return 0
    fi
  done < <(find "$dir" -mindepth 1 -maxdepth 1 \( -type f -o -type d \) 2>/dev/null)
  return 1
}

list_dir() {
  local dir="$1"
  local find_args=(-mindepth 1 -maxdepth 1)
  local e
  for e in "${EXCLUDES[@]}"; do
    find_args+=(-not -name "$e")
  done
  find "$dir" "${find_args[@]}" \( -type f -o -type d \) 2>/dev/null || true
}

generate_tree() {
  local dir="$1"
  local prefix="$2"

  local items_file
  items_file=$(mktemp /tmp/project-tree.XXXXXX)
  list_dir "$dir" | sort >"$items_file"

  if [[ ! -s "$items_file" ]]; then
    rm -f "$items_file"
    return
  fi

  local count
  count=$(wc -l <"$items_file" | tr -d ' ')
  local i=0

  while IFS= read -r entry; do
    i=$((i + 1))
    local name="${entry##*/}"
    local connector="├──"
    local child_prefix="│   "
    if [[ $i -eq $count ]]; then
      connector="└──"
      child_prefix="    "
    fi

    if [[ -d "$entry" ]]; then
      if has_visible_children "$entry"; then
        echo "${prefix}${connector} ${name}/"
        generate_tree "$entry" "${prefix}${child_prefix}"
      else
        echo "${prefix}${connector} ${name}/"
      fi
    else
      echo "${prefix}${connector} ${name}"
    fi
  done <"$items_file"

  rm -f "$items_file"
}

if command -v tree &>/dev/null; then
  echo "$(basename "$ROOT")/"
  tree "$ROOT" -a --dirsfirst -I "$(IFS='|'; echo "${EXCLUDES[*]}")" 2>/dev/null || {
    echo "(tree failed, using built-in)"
    echo "$(basename "$ROOT")/"
    generate_tree "$ROOT" ""
  }
else
  echo "$(basename "$ROOT")/"
  generate_tree "$ROOT" ""
fi
