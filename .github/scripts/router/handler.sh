#!/usr/bin/env bash
# ==============================================================================
# Robust HTTP Request Handler for NVIDIA Router (OpenAI Compatible)
# ==============================================================================
set -uo pipefail

ROUTER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${ROUTER_DIR}/cooldown.sh"
source "${ROUTER_DIR}/context_limits.sh"
source "${ROUTER_DIR}/sanitize.sh"

ROUTER_PORT="${1:-${ROUTER_PORT:-20128}}"
STATE_DIR="${2:-${STATE_DIR:-/tmp/nvidia_router_state_${ROUTER_PORT}}}"
UPSTREAM_URL="${UPSTREAM_URL:-https://integrate.api.nvidia.com/v1/chat/completions}"
MAX_RETRIES="${MAX_RETRIES:-60}"
# Max per-attempt curl timeout — the remaining-time cap ensures we never exceed REQUEST_DEADLINE_SEC
CURL_TIMEOUT="${CURL_TIMEOUT:-200}"
# Hard deadline: router ALWAYS responds within this many seconds (capped per-curl via effective_timeout)
# Set below undici's confirmed headersTimeout (>241s) with safety margin
REQUEST_DEADLINE_SEC="${REQUEST_DEADLINE_SEC:-230}"

# Send formatted OpenAI JSON response
send_openai_json_response() {
    local status_line="$1"
    local json_body="$2"
    printf "%s\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: %d\r\nConnection: close\r\n\r\n%s" \
        "$status_line" "${#json_body}" "$json_body"
}

handle_http_connection() {
    mkdir -p "${STATE_DIR}/tmp"
    # 1. Parse Request Line
    read -r request_line || return 0
    local method path proto
    method=$(echo "$request_line" | awk '{print $1}')
    path=$(echo "$request_line" | awk '{print $2}')
    proto=$(echo "$request_line" | awk '{print $3}')

    # 2. Parse Headers
    local content_length=0
    while IFS= read -r header_line; do
        header_line=$(echo "$header_line" | tr -d '\r')
        [ -z "$header_line" ] && break
        local h_lower
        h_lower=$(echo "$header_line" | cut -d: -f1 | tr '[:upper:]' '[:lower:]')
        if [ "$h_lower" = "content-length" ]; then
            content_length=$(echo "$header_line" | cut -d: -f2 | tr -d ' ')
        fi
    done

    # 3. Health Endpoint
    if [ "$path" = "/health" ] || [ "$path" = "/v1/health" ]; then
        local stats_json
        stats_json=$(get_pool_stats_json "$STATE_DIR")
        send_openai_json_response "HTTP/1.1 200 OK" "$stats_json"
        return 0
    fi

    # 4. Models List Endpoint (/v1/models)
    if [ "$path" = "/v1/models" ] && [ "$method" = "GET" ]; then
        local models_json='{"object":"list","data":[{"id":"nvidia/z-ai/glm-5.2","object":"model","owned_by":"z-ai","context_window":202365},{"id":"meta/llama-3.3-70b-instruct","object":"model","owned_by":"meta","context_window":128000}]}'
        send_openai_json_response "HTTP/1.1 200 OK" "$models_json"
        return 0
    fi

    # 5. Chat Completions (/v1/chat/completions)
    if [[ "$path" == *"/v1/chat/completions"* ]] && [ "$method" = "POST" ]; then
        local body_file
        body_file=$(mktemp "${STATE_DIR}/tmp/req_XXXXXX")
        if [ "$content_length" -gt 0 ]; then
            head -c "$content_length" > "$body_file"
        fi

        # Pre-normalize OpenAI request fields (e.g. max_completion_tokens -> max_tokens)
        normalize_openai_payload "$body_file"

        # Extract requested model
        local requested_model="nvidia/z-ai/glm-5.2"
        if command -v jq >/dev/null 2>&1 && [ -s "$body_file" ]; then
            local parsed_model
            parsed_model=$(jq -r '.model // empty' "$body_file" 2>/dev/null || true)
            [ -n "$parsed_model" ] && requested_model="$parsed_model"
        fi

        # Validate Context Window
        local context_check
        context_check=$(validate_context_window "$requested_model" "$body_file")
        local is_valid
        is_valid=$(echo "$context_check" | jq -r '.valid' 2>/dev/null || echo "true")
        if [ "$is_valid" = "false" ]; then
            local err_resp
            err_resp=$(echo "$context_check" | jq -c '.error')
            send_openai_json_response "HTTP/1.1 400 Bad Request" "$err_resp"
            rm -f "$body_file"
            return 0
        fi

        # Multi-Key Failover Loop
        mkdir -p "${STATE_DIR}/metrics"
        local req_num
        req_num=$(cat "${STATE_DIR}/metrics/requests_total" 2>/dev/null || echo 0)
        req_num=$((req_num + 1))
        echo "$req_num" > "${STATE_DIR}/metrics/requests_total"

        local attempts=0
        local strip_attempts=0
        local max_strip_attempts=3
        local total_keys=1
        if [ -f "${STATE_DIR}/keys.txt" ]; then
            total_keys=$(wc -l < "${STATE_DIR}/keys.txt")
        fi
        local max_attempts="$MAX_RETRIES"
        [ "$total_keys" -lt "$max_attempts" ] && max_attempts="$total_keys"
        [ "$max_attempts" -lt 1 ] && max_attempts=1

        echo "[Router] 📥 [REQ #${req_num}] Incoming review request for model '${requested_model}' (${total_keys} active keys in pool)..." >&2

        local req_start_sec
        req_start_sec=$(date +%s)

        while [ "$attempts" -lt "$max_attempts" ]; do
            local current_sec
            current_sec=$(date +%s)
            local elapsed_sec=$(( current_sec - req_start_sec ))
            if [ "$elapsed_sec" -ge "$REQUEST_DEADLINE_SEC" ]; then
                echo "[Router] [REQ #${req_num}] ⏱️ Request reached ${REQUEST_DEADLINE_SEC}s safety deadline. Returning error to prevent client timeout." >&2
                break
            fi

            attempts=$((attempts + 1))
            local key
            key=$(get_available_key "$STATE_DIR" || true)
            if [ -z "$key" ]; then
                echo "[Router] [REQ #${req_num}] ⚠️ No available key found in active pool." >&2
                break
            fi

            local masked_key="${key:0:10}...${key: -4}"
            local header_dump
            header_dump=$(mktemp "${STATE_DIR}/tmp/hdr_XXXXXX")
            local body_dump
            body_dump=$(mktemp "${STATE_DIR}/tmp/body_XXXXXX")

            local start_ms
            start_ms=$(date +%s%3N 2>/dev/null || date +%s000)

            # Cap each curl to remaining budget so router ALWAYS responds within REQUEST_DEADLINE_SEC
            # This prevents the last attempt from overshooting the deadline and triggering undici headersTimeout
            local remaining_sec=$(( REQUEST_DEADLINE_SEC - elapsed_sec ))
            local effective_timeout=$(( remaining_sec < CURL_TIMEOUT ? remaining_sec : CURL_TIMEOUT ))
            [ "$effective_timeout" -le 0 ] && break

            # Execute upstream request with curl (clean separation of headers and body)
            curl -s --http1.1 \
                --connect-timeout 10 \
                --max-time "$effective_timeout" \
                -X POST "$UPSTREAM_URL" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $key" \
                --data-binary @"$body_file" \
                -D "$header_dump" \
                -o "$body_dump" || true

            local end_ms
            end_ms=$(date +%s%3N 2>/dev/null || date +%s000)
            local duration_ms=$((end_ms - start_ms))
            [ "$duration_ms" -lt 0 ] && duration_ms=0

            local http_code
            http_code=$(head -n 1 "$header_dump" 2>/dev/null | awk '{print $2}' || echo "000")
            local error_text
            error_text=$(cat "$body_dump" 2>/dev/null || echo "")

            # Classify error based on OpenAI standards
            local error_cat
            error_cat=$(classify_openai_error "$error_text" "$http_code")

            # 1. Model Not Found / EOL -> Pass-through clean OpenAI 404 to OpenRabbit
            if [ "$error_cat" = "model_not_found" ]; then
                echo "[Router] [REQ #${req_num}] [Attempt ${attempts}] ✗ 404 Model Not Found | Model: ${requested_model} | Latency: ${duration_ms}ms" >&2
                local formatted_err
                formatted_err=$(format_openai_error_json "The model '$requested_model' does not exist or has reached end of life." "invalid_request_error" "model_not_found" "model")
                send_openai_json_response "HTTP/1.1 404 Not Found" "$formatted_err"
                rm -f "$header_dump" "$body_dump" "$body_file"
                return 0
            fi

            # 2. Quota Exhausted / Insufficient Balance -> 24h lockout -> Immediate retry next key
            if [ "$error_cat" = "quota_exhausted" ]; then
                echo "[Router] [REQ #${req_num}] [Attempt ${attempts}] ⛔ Quota Exhausted | Key: ${masked_key} | Latency: ${duration_ms}ms | Action: Locking key (24h) & retrying next" >&2
                mark_key_failure "$STATE_DIR" "$key" auth
                rm -f "$header_dump" "$body_dump"
                continue
            fi

            # 3. Auth Failed / Invalid API key -> 24h lockout -> Immediate retry next key
            if [ "$error_cat" = "auth_failed" ]; then
                echo "[Router] [REQ #${req_num}] [Attempt ${attempts}] ⛔ 401/403 Invalid Key | Key: ${masked_key} | Latency: ${duration_ms}ms | Action: Locking key (24h) & retrying next" >&2
                mark_key_failure "$STATE_DIR" "$key" auth
                rm -f "$header_dump" "$body_dump"
                continue
            fi

            # 4. Rate Limit (429) -> 60s cooldown -> Immediate retry next key
            if [ "$error_cat" = "rate_limit" ]; then
                echo "[Router] [REQ #${req_num}] [Attempt ${attempts}] ⚠️ 429 Rate Limit | Key: ${masked_key} | Latency: ${duration_ms}ms | Action: Rotating key (${COOLDOWN_429_SEC}s cooldown)" >&2
                mark_key_failure "$STATE_DIR" "$key" 429
                rm -f "$header_dump" "$body_dump"
                continue
            fi

            # 5. Gateway / Server Hiccup (500/502/503/504) -> 10s cooldown -> Retry next key
            if [ "$error_cat" = "gateway_error" ]; then
                echo "[Router] [REQ #${req_num}] [Attempt ${attempts}] ⚡ ${http_code} Upstream Hiccup | Key: ${masked_key} | Latency: ${duration_ms}ms | Action: Retrying next key" >&2
                mark_key_failure "$STATE_DIR" "$key" gateway
                rm -f "$header_dump" "$body_dump"
                continue
            fi

            # 6. Unsupported Parameter -> Strip parameter & retry payload (bounded)
            if [ "$error_cat" = "unsupported_param" ] || [ "$http_code" = "400" ]; then
                # Check transient DEGRADED state
                if grep -qi "DEGRADED" "$body_dump" 2>/dev/null; then
                    echo "[Router] [REQ #${req_num}] [Attempt ${attempts}] ⚡ 400 DEGRADED state | Key: ${masked_key} | Action: Retrying next key" >&2
                    mark_key_failure "$STATE_DIR" "$key" gateway
                    rm -f "$header_dump" "$body_dump"
                    continue
                fi

                if [ "$strip_attempts" -lt "$max_strip_attempts" ]; then
                    local bad_params
                    bad_params=$(extract_unsupported_params "$error_text")
                    if [ -n "$bad_params" ]; then
                        echo "[Router] [REQ #${req_num}] [Attempt ${attempts}] 🔧 400 Unsupported param '${bad_params}' | Action: Stripping & retrying" >&2
                        local stripped_any=0
                        for bp in $bad_params; do
                            if strip_param_from_json "$body_file" "$bp"; then
                                stripped_any=1
                            fi
                        done
                        if [ "$stripped_any" -eq 1 ]; then
                            strip_attempts=$((strip_attempts + 1))
                            attempts=$((attempts - 1)) # Re-attempt with sanitized payload
                            rm -f "$header_dump" "$body_dump"
                            continue
                        fi
                    fi
                fi
            fi

            # 7. Success / Valid 200 Response -> Deliver clean HTTP/1.1 response with accurate Content-Length
            if [ "$http_code" = "200" ] && [ -s "$body_dump" ]; then
                echo "[Router] [REQ #${req_num}] [Attempt ${attempts}] ✔ 200 OK | Model: ${requested_model} | Key: ${masked_key} | Latency: ${duration_ms}ms" >&2
                echo "$duration_ms" >> "${STATE_DIR}/metrics/latencies"
                local succ_count
                succ_count=$(cat "${STATE_DIR}/metrics/requests_success" 2>/dev/null || echo 0)
                echo "$((succ_count + 1))" > "${STATE_DIR}/metrics/requests_success"

                local body_len
                body_len=$(wc -c < "$body_dump")
                printf "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: %d\r\nConnection: close\r\n\r\n" "$body_len"
                cat "$body_dump"
                rm -f "$header_dump" "$body_dump" "$body_file"
                return 0
            fi

            # Curl timed out or returned unrecognized status — log and retry next key
            echo "[Router] [REQ #${req_num}] [Attempt ${attempts}] ⏰ Upstream timeout/unknown | http_code=${http_code} | Key: ${masked_key} | Latency: ${duration_ms}ms | effective_timeout: ${effective_timeout}s" >&2
            rm -f "$header_dump" "$body_dump"
        done

        echo "[Router] [REQ #${req_num}] ❌ FAILED: All candidate keys exhausted after ${attempts} attempts." >&2
        local fail_count
        fail_count=$(cat "${STATE_DIR}/metrics/requests_failed" 2>/dev/null || echo 0)
        echo "$((fail_count + 1))" > "${STATE_DIR}/metrics/requests_failed"

        rm -f "$body_file"
        local exhausted_json
        exhausted_json=$(format_openai_error_json "All candidate NVIDIA API keys exhausted or rate-limited." "rate_limit_error" 502)
        send_openai_json_response "HTTP/1.1 502 Bad Gateway" "$exhausted_json"
        return 0
    fi

    # 404 for unknown endpoints
    local not_found_json
    not_found_json=$(format_openai_error_json "Endpoint not found" "invalid_request_error" 404)
    send_openai_json_response "HTTP/1.1 404 Not Found" "$not_found_json"
}

# Invoke handler when called directly
handle_http_connection
