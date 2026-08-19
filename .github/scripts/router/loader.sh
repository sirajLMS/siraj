#!/usr/bin/env bash
# ==============================================================================
# Secure Key Loader for NVIDIA API Keys
# - Loads from NVIDIA_API_KEYS environment variable (CI / GitHub Secrets)
# - Or loads from a local keys file
# - Or automatically decrypts active keys from OmniRoute SQLite database if present
# ==============================================================================

load_keys_to_state() {
    local target_dir="$1"
    local keys_file="${target_dir}/keys.txt"
    mkdir -p "$target_dir"

    # 1. Check if keys already exist and non-empty
    if [ -s "$keys_file" ]; then
        return 0
    fi

    # 2. Load from Environment Variable(s) (CI / Secret)
    local env_keys=""
    for var in $(compgen -v | grep -E '^NVIDIA_API_KEYS(_[0-9]+)?$' || true); do
        local val="${!var}"
        if [ -n "$val" ]; then
            env_keys="${env_keys}${val}"$'\n'
        fi
    done
    if [ -n "$env_keys" ]; then
        echo "$env_keys" | tr ',' '\n' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' | sed '/^$/d' | awk '!seen[$0]++' > "$keys_file"
        local count
        count=$(wc -l < "$keys_file")
        if [ "$count" -gt 0 ]; then
            echo "[Loader] Loaded $count keys from NVIDIA_API_KEYS environment variable(s)." >&2
            return 0
        fi
    fi

    # 3. Load from keys file if specified
    if [ -n "${NVIDIA_API_KEYS_FILE:-}" ] && [ -f "$NVIDIA_API_KEYS_FILE" ]; then
        grep -E "^nvapi-" "$NVIDIA_API_KEYS_FILE" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' | sort -u > "$keys_file"
        local count
        count=$(wc -l < "$keys_file")
        if [ "$count" -gt 0 ]; then
            echo "[Loader] Loaded $count keys from $NVIDIA_API_KEYS_FILE" >&2
            return 0
        fi
    fi

    # 4. Auto-export from local OmniRoute database if present (Only active keys)
    local omniroute_db="${OMNIROUTE_DB:-/home/ahmed/.omniroute/storage.sqlite}"
    local omniroute_env="${OMNIROUTE_ENV:-/home/ahmed/.omniroute/.env}"

    if [ -f "$omniroute_db" ] && [ -f "$omniroute_env" ] && command -v bun >/dev/null 2>&1; then
        echo "[Loader] Local OmniRoute database detected. Extracting active NVIDIA keys..." >&2
        bun -e '
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
        if (!storageKey) process.exit(0);

        const derivedKey = scryptSync(storageKey, "omniroute-field-encryption-v1", 32);
        const db = new Database(process.env.OMNIROUTE_DB || "/home/ahmed/.omniroute/storage.sqlite");
        const rows = db.query("SELECT api_key FROM provider_connections WHERE provider = '\''nvidia'\'' AND is_active = 1 AND test_status = '\''active'\''").all();

        function decrypt(ciphertext) {
          if (!ciphertext || !ciphertext.startsWith("enc:v1:")) return ciphertext;
          const parts = ciphertext.slice(7).split(":");
          if (parts.length !== 3) return null;
          const [ivHex, cipherHex, tagHex] = parts;
          try {
            const decipher = createDecipheriv("aes-256-gcm", derivedKey, Buffer.from(ivHex, "hex"), { authTagLength: 16 });
            decipher.setAuthTag(Buffer.from(tagHex, "hex"));
            let decrypted = decipher.update(cipherHex, "hex", "utf8");
            decrypted += decipher.final("utf8");
            return decrypted;
          } catch { return null; }
        }

        const keys = rows.map(r => decrypt(r.api_key)).filter(k => k && k.startsWith("nvapi-"));
        for (const k of keys) console.log(k);
        ' 2>/dev/null > "$keys_file" || true

        local count
        count=$(wc -l < "$keys_file")
        if [ "$count" -gt 0 ]; then
            echo "[Loader] Successfully loaded $count active NVIDIA keys from OmniRoute DB." >&2
            return 0
        fi
    fi

    echo "Error: No NVIDIA API keys found. Set NVIDIA_API_KEYS or ensure OmniRoute DB is accessible." >&2
    return 1
}
