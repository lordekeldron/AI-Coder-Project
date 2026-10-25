#!/usr/bin/env bash
#
# setup.sh — one-command bootstrap for the AI Programming Agent app.
#
# What it does:
#   1. Checks that Node.js (>= 18) and npm are installed.
#   2. Installs project dependencies (npm install).
#   3. Ensures a .env file exists with the required Supabase variables.
#   4. Builds the app to verify everything compiles.
#   5. Starts the preview server so you can open it in a browser.
#
# Usage:
#   chmod +x setup.sh
#   ./setup.sh
#
# Re-run it any time — it's idempotent.

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { printf "${CYAN}▶ %s${NC}\n" "$1"; }
ok()    { printf "${GREEN}✓ %s${NC}\n" "$1"; }
warn()  { printf "${YELLOW}! %s${NC}\n" "$1"; }
fail()  { printf "${RED}✗ %s${NC}\n" "$1"; exit 1; }

# Resolve the project directory (the folder this script lives in).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "========================================"
echo "  AI Programming Agent — setup"
echo "========================================"
echo ""

# ----------------------------------------------------------------------------
# 1. Verify Node.js + npm
# ----------------------------------------------------------------------------
info "Checking for Node.js…"

if ! command -v node >/dev/null 2>&1; then
  fail "Node.js is not installed. Install it from https://nodejs.org (LTS recommended) and re-run this script."
fi

NODE_VERSION="$(node -v | sed 's/v//')"
NODE_MAJOR="${NODE_VERSION%%.*}"
if [ "$NODE_MAJOR" -lt 18 ]; then
  fail "Node.js $NODE_VERSION found, but version 18 or higher is required. Upgrade at https://nodejs.org."
fi

if ! command -v npm >/dev/null 2>&1; then
  fail "npm is not installed. It ships with Node.js — reinstall from https://nodejs.org."
fi

ok "Node.js $(node -v) and npm $(npm -v) detected."

# ----------------------------------------------------------------------------
# 2. Install dependencies
# ----------------------------------------------------------------------------
info "Installing dependencies (this can take a minute on first run)…"

# Use npm ci if a lockfile is present and in sync; fall back to npm install.
if [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund || npm install --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi

ok "Dependencies installed."

# ----------------------------------------------------------------------------
# 3. Ensure .env exists with Supabase variables
# ----------------------------------------------------------------------------
info "Checking environment configuration…"

if [ ! -f .env ]; then
  warn ".env not found. Creating one from .env.example if present, otherwise a minimal template."
  if [ -f .env.example ]; then
    cp .env.example .env
    ok "Copied .env.example → .env"
  else
    {
      echo "# Supabase credentials — fill these in with your project's values."
      echo "# Find them in your Supabase dashboard: Project Settings → API."
      echo "VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co"
      echo "VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY"
    } > .env
    ok "Created a .env template."
  fi
  warn "Open .env and fill in your Supabase URL and anon key before running the app."
else
  ok ".env already exists."
fi

# Quick sanity check that the placeholder hasn't been left untouched.
if grep -q "YOUR-PROJECT" .env 2>/dev/null || grep -q "YOUR-ANON-KEY" .env 2>/dev/null; then
  warn ".env still contains placeholder values. Edit it with your real Supabase credentials before the app will work."
fi

# ----------------------------------------------------------------------------
# 4. Build the project to verify it compiles
# ----------------------------------------------------------------------------
info "Building the project (type-check + bundle)…"

if npm run build >/dev/null 2>&1; then
  ok "Build succeeded."
else
  warn "Build reported errors. Run 'npm run build' manually to see the details."
  warn "You can still start the dev server with 'npm run dev' if you want to iterate."
fi

# ----------------------------------------------------------------------------
# 5. Start the preview server
# ----------------------------------------------------------------------------
echo ""
echo "========================================"
echo "  Setup complete!"
echo "========================================"
echo ""
echo "  Next steps:"
echo "    • Open the .env file and confirm your Supabase URL + anon key are set."
echo "    • Run the database migration in supabase/migrations/ against your"
echo "      Supabase project (the agent and GitHub features need those tables)."
echo "    • Start the dev server with:  npm run dev"
echo "      or preview the production build with:  npm run preview"
echo ""
echo "  Then open the printed local URL in your browser."
echo ""

read -r -p "Start the dev server now? [Y/n] " response
response="${response:-Y}"

case "$(echo "$response" | tr '[:upper:]' '[:lower:]')" in
  y|yes)
    info "Starting the dev server (press Ctrl+C to stop)…"
    echo ""
    npm run dev
    ;;
  *)
    ok "All set. Run 'npm run dev' whenever you're ready."
    ;;
esac
