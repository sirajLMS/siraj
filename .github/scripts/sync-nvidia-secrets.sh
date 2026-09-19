#!/usr/bin/env bash
# ==============================================================================
# Sync Active NVIDIA Keys from Local OmniRoute to GitHub Repository Secrets
# ==============================================================================
set -eo pipefail

OMNIROUTE_DB="${OMNIROUTE_DB:-/home/ahmed/.omniroute/storage.sqlite}"
OMNIROUTE_ENV="${OMNIROUTE_ENV:-/home/ahmed/.omniroute/.env}"

echo "================================================================="
echo "   NVIDIA API Keys Sync -> GitHub Repository Secrets (via gh)    "
echo "================================================================="

# 1. Verify gh CLI is installed & authenticated
if ! command -v gh >/dev/null 2>&1; then
    echo "❌ Error: GitHub CLI ('gh') is not installed. Please install it first."
    exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
    echo "❌ Error: GitHub CLI is not authenticated. Please run 'gh auth login'."
    exit 1
fi

# 2. Determine target GitHub repository
TARGET_REPO="${1:-${GITHUB_REPOSITORY:-}}"
if [ -z "$TARGET_REPO" ]; then
    TARGET_REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)
fi

if [ -z "$TARGET_REPO" ]; then
    echo "❌ Error: Could not determine GitHub repository. Please pass it as an argument: $0 <owner/repo>"
    exit 1
fi

echo "🎯 Target GitHub Repository: ${TARGET_REPO}"

# 3. Verify local OmniRoute database & encryption key
if [ ! -f "$OMNIROUTE_DB" ]; then
    echo "❌ Error: OmniRoute database not found at ${OMNIROUTE_DB}"
    exit 1
fi

if [ ! -f "$OMNIROUTE_ENV" ]; then
    echo "❌ Error: OmniRoute environment file not found at ${OMNIROUTE_ENV}"
    exit 1
fi

if ! command -v bun >/dev/null 2>&1; then
    echo "❌ Error: 'bun' runtime is required to decrypt SQLite field values."
    exit 1
fi

# 4. Extract and decrypt ONLY active NVIDIA keys
echo "🔍 Extracting and decrypting active NVIDIA keys from OmniRoute DB..."

TMP_DIR=$(mktemp -d)
# Ensure decrypted keys never linger in the temp dir on mid-script failure
trap 'rm -rf "$TMP_DIR"' EXIT
KEYS_FILE="${TMP_DIR}/active_keys.txt"

OMNIROUTE_DB="$OMNIROUTE_DB" OMNIROUTE_ENV="$OMNIROUTE_ENV" KEYS_FILE="$KEYS_FILE" bun -e '
import { Database } from "bun:sqlite";
import { scryptSync, createDecipheriv } from "crypto";
import fs from "fs";

const envContent = fs.readFileSync(process.env.OMNIROUTE_ENV || "/home/ahmed/.omniroute/.env", "utf8");
let storageKey = "";
for (const line of envContent.split("\n")) {
  if (line.startsWith("STORAGE_ENCRYPTION_KEY=")) {
    storageKey = line.split("=")[1].trim();
  }
}
if (!storageKey) {
  console.error("Missing STORAGE_ENCRYPTION_KEY in .env");
  process.exit(1);
}

const derivedKey = scryptSync(storageKey, "omniroute-field-encryption-v1", 32);
const db = new Database(process.env.OMNIROUTE_DB || "/home/ahmed/.omniroute/storage.sqlite");

// Select ONLY active keys (is_active = 1 and test_status = active)
const rows = db.query(`
  SELECT api_key, is_active, test_status
  FROM provider_connections
  WHERE provider = "nvidia"
    AND is_active = 1
    AND test_status = "active"
`).all();

function decrypt(ciphertext) {
  if (!ciphertext || !ciphertext.startsWith("enc:v1:")) return ciphertext;
  try {
    const parts = ciphertext.slice("enc:v1:".length).split(":");
    const iv = Buffer.from(parts[0], "hex");
    const encrypted = Buffer.from(parts[1], "hex");
    const authTag = Buffer.from(parts[2], "hex");
    const decipher = createDecipheriv("aes-256-gcm", derivedKey, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(encrypted, undefined, "utf8") + decipher.final("utf8");
  } catch {
    return null;
  }
}

const validKeys = [];
for (const row of rows) {
  const decrypted = decrypt(row.api_key);
  if (decrypted && decrypted.startsWith("nvapi-")) {
    validKeys.push(decrypted);
  }
}

// Deduplicate keys preserving order
const uniqueKeys = Array.from(new Set(validKeys));
fs.writeFileSync(process.env.KEYS_FILE, uniqueKeys.join("\n"));
console.log(`[Decrypter] Successfully extracted ${uniqueKeys.length} verified active NVIDIA keys.`);
'

TOTAL_ACTIVE_KEYS=$(wc -l < "$KEYS_FILE" || echo 0)
if [ "$TOTAL_ACTIVE_KEYS" -eq 0 ]; then
    echo "⚠️ Warning: No active NVIDIA keys found in OmniRoute database."
    rm -rf "$TMP_DIR"
    exit 0
fi

echo "📊 Total Active Keys to Sync: ${TOTAL_ACTIVE_KEYS}"

# 5. Split keys into chunks < 40 KB to respect GitHub Secrets API limits
# ~500 keys per chunk (each key is ~71 bytes = ~35.5 KB)
CHUNK_SIZE=500
split -l "$CHUNK_SIZE" -d "$KEYS_FILE" "${TMP_DIR}/chunk_"

CHUNKS=("${TMP_DIR}"/chunk_*)
CHUNK_COUNT=${#CHUNKS[@]}
echo "📦 Key Chunks to Sync: ${CHUNK_COUNT}"

# 6. Push Secrets to GitHub Repository
for idx in "${!CHUNKS[@]}"; do
    chunk_file="${CHUNKS[$idx]}"
    chunk_keys=$(wc -l < "$chunk_file")
    chunk_bytes=$(wc -c < "$chunk_file")

    secret_name="NVIDIA_API_KEYS"
    if [ "$idx" -gt 0 ]; then
        suffix=$((idx + 1))
        secret_name="NVIDIA_API_KEYS_${suffix}"
    fi

    # Convert newline-separated to comma-separated string
    secret_value=$(tr '\n' ',' < "$chunk_file" | sed 's/,$//')

    echo "🔐 Syncing ${secret_name} (${chunk_keys} keys, ${chunk_bytes} bytes) to ${TARGET_REPO}..."
    echo -n "$secret_value" | gh secret set "$secret_name" --repo "$TARGET_REPO"
    echo "  ✔ ${secret_name} updated successfully in ${TARGET_REPO}."
done

rm -rf "$TMP_DIR"

echo ""
echo "================================================================="
echo "   ✔ Sync complete! ${TOTAL_ACTIVE_KEYS} active keys synced to ${TARGET_REPO}."
echo "================================================================="
