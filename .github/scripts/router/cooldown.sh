#!/usr/bin/env bash
# ==============================================================================
# Key Pool Manager & Cooldown Tracker
# ==============================================================================

COOLDOWN_429_SEC="${COOLDOWN_429_SEC:-${COOLDOWN_SEC:-60}}"
COOLDOWN_5XX_SEC="${COOLDOWN_5XX_SEC:-10}"
COOLDOWN_AUTH_SEC="${COOLDOWN_AUTH_SEC:-86400}" # 24h for dead keys

hash_key() {
    local key="$1"
    echo -n "$key" | md5sum | cut -d' ' -f1
}

# Select next available key that is not cooling down
get_available_key() {
    local state_dir="$1"
    local keys_file="${state_dir}/keys.txt"
    local cooldown_dir="${state_dir}/cooldowns"
    local counter_file="${state_dir}/counter"

    if [ ! -s "$keys_file" ]; then
        return 1
    fi

    local total
    total=$(wc -l < "$keys_file")
    local now
    now=$(date +%s)
    local counter
    counter=$(cat "$counter_file" 2>/dev/null || echo 0)

    # 1. Round-robin scan for healthy key
    for ((i=0; i<total; i++)); do
        local idx=$(( (counter + i) % total + 1 ))
        local key
        key=$(sed -n "${idx}p" "$keys_file")
        local kh
        kh=$(hash_key "$key")
        local cd_file="${cooldown_dir}/${kh}"

        local is_cooling=0
        if [ -f "$cd_file" ]; then
            local expiry
            expiry=$(cat "$cd_file" 2>/dev/null || echo 0)
            if [ "$now" -lt "$expiry" ]; then
                is_cooling=1
            fi
        fi

        if [ "$is_cooling" -eq 0 ]; then
            # Advance counter atomically
            echo "$(( (counter + i + 1) % total ))" > "$counter_file"
            echo "$key"
            return 0
        fi
    done

    # 2. If all keys cooling, fallback to earliest expiring key
    local earliest_key=""
    local earliest_time=9999999999
    for ((i=1; i<=total; i++)); do
        local key
        key=$(sed -n "${i}p" "$keys_file")
        local kh
        kh=$(hash_key "$key")
        local cd_file="${cooldown_dir}/${kh}"
        local expiry
        expiry=$(cat "$cd_file" 2>/dev/null || echo 0)
        if [ "$expiry" -lt "$earliest_time" ]; then
            earliest_time="$expiry"
            earliest_key="$key"
        fi
    done

    echo "$(( (counter + 1) % total ))" > "$counter_file"
    echo "${earliest_key:-$(sed -n '1p' "$keys_file")}"
    return 0
}

# Mark a key with a cooldown duration based on error category
mark_key_failure() {
    local state_dir="$1"
    local key="$2"
    local error_type="$3" # "429", "auth", "gateway", or custom sec

    local duration="$COOLDOWN_429_SEC"
    case "$error_type" in
        429)
            duration="$COOLDOWN_429_SEC"
            ;;
        401|403|auth)
            duration="$COOLDOWN_AUTH_SEC"
            ;;
        500|502|503|504|gateway)
            duration="$COOLDOWN_5XX_SEC"
            ;;
        [0-9]*)
            duration="$error_type"
            ;;
    esac

    local kh
    kh=$(hash_key "$key")
    local until=$(( $(date +%s) + duration ))
    mkdir -p "${state_dir}/cooldowns"
    echo "$until" > "${state_dir}/cooldowns/${kh}"
    echo "[Cooldown] Key $key marked until $until in ${state_dir}/cooldowns/${kh}" >&2
}

# Get detailed stats for /health endpoint
get_pool_stats_json() {
    local state_dir="$1"
    local keys_file="${state_dir}/keys.txt"
    local cooldown_dir="${state_dir}/cooldowns"

    local total=0
    [ -f "$keys_file" ] && total=$(wc -l < "$keys_file")

    local now
    now=$(date +%s)
    local cooling=0
    local dead=0

    if [ -d "$cooldown_dir" ]; then
        for cd in "$cooldown_dir"/*; do
            if [ -f "$cd" ]; then
                local expiry
                expiry=$(cat "$cd" 2>/dev/null || echo 0)
                local diff=$((expiry - now))
                if [ "$diff" -gt 3600 ]; then
                    dead=$((dead + 1))
                elif [ "$diff" -gt 0 ]; then
                    cooling=$((cooling + 1))
                fi
            fi
        done
    fi

    local total_reqs=0
    local successful_reqs=0
    local failed_reqs=0
    local avg_latency_ms=0

    mkdir -p "${state_dir}/metrics"

    if [ -f "${state_dir}/metrics/requests_total" ]; then
        total_reqs=$(cat "${state_dir}/metrics/requests_total" 2>/dev/null || echo 0)
    fi
    if [ -f "${state_dir}/metrics/requests_success" ]; then
        successful_reqs=$(cat "${state_dir}/metrics/requests_success" 2>/dev/null || echo 0)
    fi
    if [ -f "${state_dir}/metrics/requests_failed" ]; then
        failed_reqs=$(cat "${state_dir}/metrics/requests_failed" 2>/dev/null || echo 0)
    fi
    if [ -f "${state_dir}/metrics/latencies" ]; then
        local count
        count=$(wc -l < "${state_dir}/metrics/latencies" 2>/dev/null || echo 0)
        if [ "$count" -gt 0 ]; then
            local sum
            sum=$(awk '{s+=$1} END {print s}' "${state_dir}/metrics/latencies" 2>/dev/null || echo 0)
            avg_latency_ms=$((sum / count))
        fi
    fi

    local active=$((total - cooling - dead))
    [ "$active" -lt 0 ] && active=0

    printf '{"status":"ok","total_keys":%d,"active_keys":%d,"cooling_keys":%d,"invalid_keys":%d,"total_requests":%d,"successful_requests":%d,"failed_requests":%d,"avg_response_time_ms":%d,"cooldown_429_sec":%d}' \
        "$total" "$active" "$cooling" "$dead" "$total_reqs" "$successful_reqs" "$failed_reqs" "$avg_latency_ms" "$COOLDOWN_429_SEC"
}
