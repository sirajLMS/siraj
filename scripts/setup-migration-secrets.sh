#!/usr/bin/env bash
set -euo pipefail

# One-time setup: copy Neon DATABASE_URL from .env.vercel into GitHub Actions secrets.
# Requires: gh CLI authenticated, run from repo root.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.vercel"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Run: vercel env pull .env.vercel --environment=production"
  exit 1
fi

DATABASE_URL="$(grep -E '^DATABASE_URL=' "${ENV_FILE}" | head -1 | cut -d= -f2- | tr -d '"')"
if [[ -z "${DATABASE_URL}" ]]; then
  echo "DATABASE_URL not found in ${ENV_FILE}"
  exit 1
fi

echo "Setting GitHub secret DATABASE_URL for $(gh repo view --json nameWithOwner -q .nameWithOwner)..."
printf '%s' "${DATABASE_URL}" | gh secret set DATABASE_URL

echo "Done. Push to master to trigger .github/workflows/migrate-production.yml"
