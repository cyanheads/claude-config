#!/bin/sh
#
# install.sh — install cyanheads' public Claude Code config as an isolated profile.
# No GitHub authentication required.
#
# Installs the Claude Code CLI and the Bun runtime (if missing), then writes
# settings.json, CLAUDE.md, and skills into a DEDICATED config dir
# (~/.claude-cyanheads) and drops a `claude-cyanheads` launcher on your PATH.
# Your existing ~/.claude is never touched. Personal hooks, secrets, and
# machine-specific paths are intentionally excluded.
#
#   sh -c "$(curl -fsLS https://raw.githubusercontent.com/cyanheads/claude-config/main/install.sh)"
#
set -eu

REPO="cyanheads/claude-config"
CONFIG_DIR="${HOME}/.claude-cyanheads"
BIN_DIR="${HOME}/.local/bin"
LAUNCHER="${BIN_DIR}/claude-cyanheads"
TARBALL="https://github.com/${REPO}/archive/refs/heads/main.tar.gz"

# --- preflight ---------------------------------------------------------------
for cmd in curl tar; do
  command -v "${cmd}" >/dev/null 2>&1 || {
    echo "ERROR: '${cmd}' is required but not on PATH. Install it and re-run." >&2
    exit 1
  }
done

# --- Claude Code CLI ---------------------------------------------------------
echo "==> Claude Code CLI"
if command -v claude >/dev/null 2>&1; then
  echo "    present: $(claude --version)"
else
  echo "    installing..."
  curl -fsSL https://claude.ai/install.sh | bash \
    || echo "    WARN: install failed — retry later: curl -fsSL https://claude.ai/install.sh | bash"
fi

# --- Bun runtime -------------------------------------------------------------
echo "==> Bun runtime (assumed by this config's workflows)"
if command -v bun >/dev/null 2>&1; then
  echo "    present: $(bun --version)"
else
  echo "    installing..."
  curl -fsSL https://bun.sh/install | bash \
    || echo "    WARN: install failed — retry later: curl -fsSL https://bun.sh/install | bash"
fi

# --- fetch config ------------------------------------------------------------
echo "==> Fetching config from ${REPO}"
TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT
curl -fsSL "${TARBALL}" | tar -xz -C "${TMP}" --strip-components=1

# --- install into a dedicated, isolated profile ------------------------------
echo "==> Installing into ${CONFIG_DIR} (your ~/.claude is left untouched)"
mkdir -p "${CONFIG_DIR}/skills"
stamp="$(date +%Y%m%d-%H%M%S)"

for f in settings.json CLAUDE.md; do
  if [ -e "${CONFIG_DIR}/${f}" ]; then
    cp "${CONFIG_DIR}/${f}" "${CONFIG_DIR}/${f}.bak-${stamp}"
    echo "    backed up existing ${f} -> ${f}.bak-${stamp}"
  fi
  cp "${TMP}/${f}" "${CONFIG_DIR}/${f}"
  echo "    wrote ${CONFIG_DIR}/${f}"
done

cp -R "${TMP}/skills/." "${CONFIG_DIR}/skills/"
echo "    wrote ${CONFIG_DIR}/skills/"

# --- install the launcher ----------------------------------------------------
echo "==> Installing launcher ${LAUNCHER}"
mkdir -p "${BIN_DIR}"
cat > "${LAUNCHER}" <<'LAUNCH'
#!/bin/sh
# Run Claude Code against the cyanheads config profile, leaving ~/.claude alone.
exec env CLAUDE_CONFIG_DIR="${HOME}/.claude-cyanheads" claude "$@"
LAUNCH
chmod +x "${LAUNCHER}"
echo "    wrote ${LAUNCHER}"

# --- report existing global config (untouched) -------------------------------
if [ -e "${HOME}/.claude/CLAUDE.md" ] || [ -e "${HOME}/.claude/settings.json" ]; then
  echo "    note: an existing ~/.claude config was detected and left untouched."
fi

# --- PATH check --------------------------------------------------------------
case ":${PATH}:" in
  *":${BIN_DIR}:"*) ;;
  *)
    echo
    echo "    NOTE: ${BIN_DIR} is not on your PATH. Add it to your shell rc:"
    echo "      export PATH=\"\$HOME/.local/bin:\$PATH\""
    ;;
esac

# --- done --------------------------------------------------------------------
echo
echo "==> Done."
echo "    Launch this config:    claude-cyanheads     # isolated profile"
echo "    Your normal Claude:    claude               # ~/.claude, untouched"
echo "    Make it your default:  add to your shell rc →"
echo "      export CLAUDE_CONFIG_DIR=\"\$HOME/.claude-cyanheads\""
echo
echo "    First launch: run /login if prompted (one time)."
