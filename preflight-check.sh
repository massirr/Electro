#!/bin/bash
# Electro Pre-Flight Checklist
# Run from the project root: bash preflight-check.sh

PASS="✅"
FAIL="❌"
WARN="⚠️ "
ALL_GOOD=true

echo ""
echo "═══════════════════════════════════════"
echo "  Electro Pre-Flight Checklist"
echo "═══════════════════════════════════════"
echo ""

# 1. Bun
if command -v bun &>/dev/null; then
  BUN_VER=$(bun --version)
  echo "$PASS  Bun: $BUN_VER"
else
  echo "$FAIL  Bun: NOT INSTALLED"
  echo "       → Run: curl -fsSL https://bun.sh/install | bash"
  ALL_GOOD=false
fi

# 2. gstack
GSTACK_PATH="$HOME/.claude/skills/gstack/setup"
if [ -f "$GSTACK_PATH" ]; then
  echo "$PASS  gstack: found at ~/.claude/skills/gstack"
else
  echo "$FAIL  gstack: NOT INSTALLED"
  echo "       → Run: git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup"
  ALL_GOOD=false
fi

# 3. OpenSpec
if command -v openspec &>/dev/null; then
  OS_VER=$(openspec --version 2>/dev/null || echo "installed")
  echo "$PASS  OpenSpec: $OS_VER"
else
  echo "$FAIL  OpenSpec: NOT INSTALLED"
  echo "       → Run: bun add -g @fission-ai/openspec@latest"
  ALL_GOOD=false
fi

# 4. PocketBase binary
PB_PATH="./infra/pocketbase/pocketbase"
if [ -f "$PB_PATH" ]; then
  PB_VER=$("$PB_PATH" --version 2>/dev/null || echo "binary present")
  echo "$PASS  PocketBase: $PB_VER"
else
  echo "$FAIL  PocketBase binary: NOT FOUND at infra/pocketbase/pocketbase"
  echo "       → Download from https://pocketbase.io/docs/"
  ALL_GOOD=false
fi

# 5. DESIGN.md (Linear)
if [ -f "./DESIGN.md" ]; then
  echo "$PASS  DESIGN.md (Linear): present"
else
  echo "$WARN DESIGN.md: not yet installed"
  echo "       → Run: npx getdesign@latest add linear.app"
  # Not blocking — can be added during scaffold
fi

echo ""
echo "═══════════════════════════════════════"
if [ "$ALL_GOOD" = true ]; then
  echo "  🟢 ALL CLEAR — ready to scaffold"
else
  echo "  🔴 FIX the items above, then re-run"
fi
echo "═══════════════════════════════════════"
echo ""
