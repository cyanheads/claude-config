#!/bin/sh
#
# install.sh — set up Claude Code with cyanheads' public config on any machine.
# No GitHub authentication required.
#
# Installs the Claude Code CLI and the Bun runtime (if missing), then writes
# settings.json, CLAUDE.md, and skills into ~/.claude, backing up anything
# already there. Personal hooks, secrets, and machine-specific paths are
# intentionally excluded.
#
#   sh -c "$(curl -fsLS https://raw.githubusercontent.com/cyanheads/claude-config/main/install.sh)"
#
set -eu

REPO="cyanheads/claude-config"
CLAUDE_DIR="${HOME}/.claude"
TARBALL="https://github.com/${REPO}/archive/refs/heads/main.tar.gz"

echo "==> Claude Code CLI"
if command -v claude >/dev/null 2>&1; then
  echo "    present: $(claude --version)"
else
  echo "    installing..."
  curl -fsSL https://claude.ai/install.sh | bash \
    || echo "    WARN: install failed — retry later: curl -fsSL https://claude.ai/install.sh | bash"
fi

echo "==> Bun runtime (assumed by this config's workflows)"
if command -v bun >/dev/null 2>&1; then
  echo "    present: $(bun --version)"
else
  echo "    installing..."
  curl -fsSL https://bun.sh/install | bash \
    || echo "    WARN: install failed — retry later: curl -fsSL https://bun.sh/install | bash"
fi

echo "==> Fetching config from ${REPO}"
TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT
curl -fsSL "${TARBALL}" | tar -xz -C "${TMP}" --strip-components=1

mkdir -p "${CLAUDE_DIR}/skills"
stamp="$(date +%Y%m%d-%H%M%S)"

for f in settings.json CLAUDE.md; do
  if [ -e "${CLAUDE_DIR}/${f}" ]; then
    cp "${CLAUDE_DIR}/${f}" "${CLAUDE_DIR}/${f}.bak-${stamp}"
    echo "    backed up ${f} -> ${f}.bak-${stamp}"
  fi
  cp "${TMP}/${f}" "${CLAUDE_DIR}/${f}"
  echo "    wrote ~/.claude/${f}"
done

cp -R "${TMP}/skills/." "${CLAUDE_DIR}/skills/"
echo "    wrote ~/.claude/skills/"

echo
echo "==> Done. Two steps left (neither can be automated):"
echo "    1. claude        # then /login to authenticate"
echo "    2. export any API keys/secrets your workflow needs"
