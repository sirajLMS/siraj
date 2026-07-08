#!/usr/bin/env bash
set -euo pipefail

# One-time setup: copy Neon secrets from .env.vercel into GitHub Actions.
# Requires: gh CLI authenticated, run from repo root.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.vercel"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Run: vercel env pull .env.vercel --environment=production"
  exit 1
fi

read_env_value() {
  local key="$1"
  grep -E "^${key}=" "${ENV_FILE}" | head -1 | cut -d= -f2- | tr -d '"'
}

REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"

for key in DATABASE_URL DATABASE_ENCRYPTION_KEY; do
  value="$(read_env_value "${key}")"
  if [[ -z "${value}" ]]; then
    echo "Missing ${key} in ${ENV_FILE}"
    exit 1
  fi
  echo "Setting GitHub secret ${key} for ${REPO}..."
  printf '%s' "${value}" | gh secret set "${key}"
done

echo "Done. Push to master to trigger .github/workflows/migrate-production.yml"
