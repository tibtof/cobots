#!/bin/bash
# Post-merge cleanup. Usage: post-merge-cleanup.sh <merged-branch>
# Run from anywhere inside the repo: returns the checkout to main, removes any
# leftover worktree still on the merged branch (dev agents historically leak
# these), deletes the local branch, and fast-forwards main. Every step is
# best-effort.

BRANCH="$1"
REPO_DIR=$(git rev-parse --show-toplevel 2>/dev/null) || exit 1
cd "$REPO_DIR" || exit 1

git checkout main 2>/dev/null || git checkout master 2>/dev/null || true

git worktree list --porcelain | awk '/^worktree /{print $2}' | while read -r wt; do
  [ "$wt" = "$REPO_DIR" ] && continue
  wb=$(git -C "$wt" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
  if [ -n "$BRANCH" ] && [ "$wb" = "$BRANCH" ]; then
    git worktree remove --force "$wt" 2>/dev/null || true
  fi
done
git worktree prune 2>/dev/null

if [ -n "$BRANCH" ]; then
  git branch -D "$BRANCH" 2>/dev/null || true
fi

git pull --ff-only origin "$(git rev-parse --abbrev-ref HEAD)"
git status --short
