#!/usr/bin/env bash
# publish-body.sh <owner/repo> <issue-dir> — collision-check, apply candidate.md, verify.
set -euo pipefail
repo=$1 dir=$2 n=${dir##*issue-}
strip() { perl -0pe 's/\s+\z//' "$1"; }
gh api "repos/$repo/issues/$n" > "$dir/current.json"
jq -r '.body' "$dir/current.json" > "$dir/current.md"
if ! diff -q <(strip "$dir/original.md") <(strip "$dir/current.md") >/dev/null; then
  echo "COLLISION $repo#$n (updated_at $(jq -r .updated_at "$dir/current.json"))"; exit 1
fi
author=$(jq -r '.user.login' "$dir/current.json")
[ "$author" = "${EXPECTED_AUTHOR:-$(gh api user --jq .login)}" ] || { echo "AUTHOR $author on $repo#$n — skipped"; exit 1; }
gh issue edit "$n" -R "$repo" --body-file "$dir/candidate.md" >/dev/null
gh api "repos/$repo/issues/$n" > "$dir/final.json"
jq -r '.body' "$dir/final.json" > "$dir/final.md"
if diff -q <(strip "$dir/candidate.md") <(strip "$dir/final.md") >/dev/null; then
  echo "OK $repo#$n"
else
  echo "MISMATCH $repo#$n"; exit 1
fi
