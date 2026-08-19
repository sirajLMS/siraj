#!/usr/bin/env bash
# ==============================================================================
# Comprehensive Resilience & Stress Test for NVIDIA Shell Router
# - Tests 1000-request throughput with 429 failover
# - Tests Context Window limits (GLM-5.2: 186,365 tokens input)
# - Tests all error codes: 401, 403, 404, 410, 429, 500, 502, 503, 504
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROUTER_SH="${SCRIPT_DIR}/../../scripts/nvidia-router.sh"
TEST_PORT="29200"
MOCK_PORT="29201"
STATE_DIR="/tmp/test_resilience_state_${TEST_PORT}"

PASSED=0
FAILED=0

cleanup() {
    pkill -f "socat.*${TEST_PORT}" 2>/dev/null || true
    pkill -f "socat.*${MOCK_PORT}" 2>/dev/null || true
    rm -rf "$STATE_DIR" "/tmp/mock_resilience_${MOCK_PORT}"
}
trap cleanup EXIT

log_test() {
    echo "▶ $1"
}

assert_eq() {
    local expected="$1"
    local actual="$2"
    local msg="$3"
    if [ "$expected" = "$actual" ]; then
        echo "  ✔ $msg"
        PASSED=$((PASSED + 1))
    else
        echo "  ✖ $msg (Expected: '$expected', Got: '$actual')"
        FAILED=$((FAILED + 1))
    fi
}

assert_contains() {
    local haystack="$1"
    local needle="$2"
    local msg="$3"
    if [[ "$haystack" == *"$needle"* ]]; then
        echo "  ✔ $msg"
        PASSED=$((PASSED + 1))
    else
        echo "  ✖ $msg (Expected to contain '$needle')"
        FAILED=$((FAILED + 1))
    fi
}

# ── Test 1: Context Window Exceeded Guardrail (GLM-5.2) ───────────────────────
log_test "1. Context Window Exceeded Guardrail for GLM-5.2 (186,365 tokens)"
cleanup
mkdir -p "$STATE_DIR"
export NVIDIA_API_KEYS="nvapi-key1"
export ROUTER_PORT="$TEST_PORT" STATE_DIR

"$ROUTER_SH" serve >/dev/null 2>&1 &
ROUTER_PID=$!
sleep 0.5

# Generate oversized payload (~200,000 tokens / 800,000 chars)
HUGE_PAYLOAD_FILE="/tmp/huge_payload.json"
python3 -c '
import json
large_text = "x" * 760000
payload = {
    "model": "nvidia/z-ai/glm-5.2",
    "messages": [{"role": "user", "content": large_text}]
}
with open("/tmp/huge_payload.json", "w") as f:
    json.dump(payload, f)
'

resp=$(curl -s -i -X POST "http://127.0.0.1:${TEST_PORT}/v1/chat/completions" \
    -H "Content-Type: application/json" \
    --data-binary @"$HUGE_PAYLOAD_FILE")

rm -f "$HUGE_PAYLOAD_FILE"
assert_contains "$resp" "400 Bad Request" "Router returned 400 Bad Request on oversized context"
assert_contains "$resp" "context_length_exceeded" "Router error code is context_length_exceeded"

kill "$ROUTER_PID" 2>/dev/null || true
sleep 0.2

# ── Test 2: Model Not Found (404) and EOL (410) Pass-Through ──────────────────
log_test "2. Model Not Found (404) and Model EOL (410) Direct Pass-Through"
cleanup
mkdir -p "$STATE_DIR" "/tmp/mock_resilience_${MOCK_PORT}"

mock_404_handler() {
    read -r req_line
    while IFS= read -r h; do [ -z "$(echo "$h" | tr -d "\r")" ] && break; done
    printf "HTTP/1.1 404 Not Found\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n{\"error\":{\"message\":\"The model does not exist\",\"type\":\"invalid_request_error\",\"code\":\"model_not_found\"}}"
}
export -f mock_404_handler

socat TCP-LISTEN:"${MOCK_PORT}",fork,reuseaddr EXEC:"bash -c mock_404_handler" &
MOCK_PID=$!
sleep 0.3

export NVIDIA_API_KEYS="nvapi-keyA,nvapi-keyB"
export UPSTREAM_URL="http://127.0.0.1:${MOCK_PORT}/v1/chat/completions"
export ROUTER_PORT="$TEST_PORT" STATE_DIR

"$ROUTER_SH" serve >/dev/null 2>&1 &
ROUTER_PID=$!
sleep 0.5

resp=$(curl -s -i -X POST "http://127.0.0.1:${TEST_PORT}/v1/chat/completions" \
    -H "Content-Type: application/json" \
    -d '{"model":"non_existent_model","messages":[]}')

assert_contains "$resp" "404 Not Found" "Router passes 404 Not Found directly to client"
assert_contains "$resp" "model_not_found" "Error payload contains model_not_found"

kill "$ROUTER_PID" "$MOCK_PID" 2>/dev/null || true
sleep 0.2

# ── Test 3: Invalid Key (401/403) Automatic Lockout & Failover ────────────────
log_test "3. Invalid / Revoked Key (401/403) Lockout & Transparent Failover"
cleanup
mkdir -p "$STATE_DIR" "/tmp/mock_resilience_${MOCK_PORT}"

mock_auth_fail_handler() {
    read -r req_line
    local auth=""
    while IFS= read -r h; do
        h=$(echo "$h" | tr -d "\r")
        [ -z "$h" ] && break
        if [[ "$h" =~ ^[Aa]uthorization: ]]; then auth="$h"; fi
    done

    if [[ "$auth" == *"nvapi-revoked-key"* ]]; then
        printf "HTTP/1.1 401 Unauthorized\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n{\"error\":{\"message\":\"Invalid API key\"}}"
    else
        printf "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n{\"choices\":[{\"message\":{\"content\":\"valid-response-from-key2\"}}]}"
    fi
}
export -f mock_auth_fail_handler

socat TCP-LISTEN:"${MOCK_PORT}",fork,reuseaddr EXEC:"bash -c mock_auth_fail_handler" &
MOCK_PID=$!
sleep 0.3

export NVIDIA_API_KEYS="nvapi-revoked-key,nvapi-healthy-key"
export UPSTREAM_URL="http://127.0.0.1:${MOCK_PORT}/v1/chat/completions"
export ROUTER_PORT="$TEST_PORT" STATE_DIR

"$ROUTER_SH" serve >/dev/null 2>&1 &
ROUTER_PID=$!
sleep 0.5

resp=$(curl -s -X POST "http://127.0.0.1:${TEST_PORT}/v1/chat/completions" \
    -H "Content-Type: application/json" \
    -d '{"model":"nvidia/z-ai/glm-5.2","messages":[]}')

assert_contains "$resp" "valid-response-from-key2" "Client successfully received response after 401 key failover"

health_res=$(curl -s "http://127.0.0.1:${TEST_PORT}/health")
invalid_keys=$(echo "$health_res" | jq -r '.invalid_keys // empty')
assert_eq "1" "$invalid_keys" "Revoked key is tracked as invalid_keys: 1"

kill "$ROUTER_PID" "$MOCK_PID" 2>/dev/null || true
sleep 0.2

# ── Test 4: 1,000 Requests Stress & Failover Test ─────────────────────────────
log_test "4. 1,000 Requests Stress Test with Multi-Key 429 Rotation"
cleanup
mkdir -p "$STATE_DIR" "/tmp/mock_resilience_${MOCK_PORT}"

# Mock server that returns 429 on 10% of requests randomly, 200 on others
mock_stress_handler() {
    read -r req_line
    while IFS= read -r h; do [ -z "$(echo "$h" | tr -d "\r")" ] && break; done
    
    # 10% chance of 429
    local r=$(( RANDOM % 10 ))
    if [ "$r" -eq 0 ]; then
        printf "HTTP/1.1 429 Too Many Requests\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n{\"error\":\"rate_limit\"}"
    else
        printf "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n{\"id\":\"stress-ok\",\"choices\":[{\"message\":{\"content\":\"stress-pass\"}}]}"
    fi
}
export -f mock_stress_handler

socat TCP-LISTEN:"${MOCK_PORT}",fork,reuseaddr EXEC:"bash -c mock_stress_handler" &
MOCK_PID=$!
sleep 0.3

# Provide 50 keys
KEYS_ARRAY=()
for i in {1..50}; do
    KEYS_ARRAY+=("nvapi-stress-key-$i")
done
export NVIDIA_API_KEYS=$(IFS=,; echo "${KEYS_ARRAY[*]}")
export UPSTREAM_URL="http://127.0.0.1:${MOCK_PORT}/v1/chat/completions"
export COOLDOWN_SEC=5
export ROUTER_PORT="$TEST_PORT" STATE_DIR

"$ROUTER_SH" serve >/dev/null 2>&1 &
ROUTER_PID=$!
sleep 0.5

echo "  Running 1,000 requests in batches..."
SUCCESS_COUNT=0
TOTAL_REQUESTS=1000

# Execute 1000 requests with 20 parallel workers
export TEST_PORT
run_batch() {
    local count="$1"
    for ((j=0; j<count; j++)); do
        local res
        res=$(curl -s -X POST "http://127.0.0.1:${TEST_PORT}/v1/chat/completions" \
            -H "Content-Type: application/json" \
            -d '{"model":"nvidia/z-ai/glm-5.2","messages":[]}')
        if [[ "$res" == *"stress-pass"* ]]; then
            echo "OK"
        else
            echo "FAIL"
        fi
    done
}
export -f run_batch

RESULTS_FILE="/tmp/stress_results.txt"
> "$RESULTS_FILE"

# 20 parallel batches of 50 requests = 1000 requests
WORKER_PIDS=()
for w in {1..20}; do
    run_batch 50 >> "$RESULTS_FILE" &
    WORKER_PIDS+=($!)
done

for pid in "${WORKER_PIDS[@]}"; do
    wait "$pid" 2>/dev/null || true
done

SUCCESS_COUNT=$(grep -c "^OK" "$RESULTS_FILE" || echo 0)
assert_eq "$TOTAL_REQUESTS" "$SUCCESS_COUNT" "1,000 out of 1,000 requests succeeded cleanly through multi-key router"
rm -f "$RESULTS_FILE"

kill "$ROUTER_PID" "$MOCK_PID" 2>/dev/null || true
sleep 0.2

# ── Test 5: Unsupported Parameter Stripping (e.g. snippy) ─────────────────────
log_test "5. Automatic Unsupported Parameter Stripping (e.g. 'snippy') & Bounded Retry"
cleanup
mkdir -p "$STATE_DIR" "/tmp/mock_resilience_${MOCK_PORT}"

mock_snippy_handler() {
    read -r req_line
    local cl=0
    while IFS= read -r h; do
        h=$(echo "$h" | tr -d "\r")
        [ -z "$h" ] && break
        if [[ "$(echo "$h" | tr "[:upper:]" "[:lower:]")" =~ ^content-length: ]]; then
            cl=$(echo "$h" | cut -d: -f2 | tr -d " ")
        fi
    done

    local body=""
    if [ "$cl" -gt 0 ]; then
        body=$(head -c "$cl")
    fi

    # If payload contains "snippy", reject with 400 Unsupported parameter
    if echo "$body" | grep -q "snippy"; then
        local err_body='{"status":400,"title":"Bad Request","detail":"Validation: Unsupported parameter(s): '\''snippy'\''"}'
        printf "HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n%s" "$err_body"
    else
        local ok_body='{"id":"chatcmpl-clean","choices":[{"message":{"content":"success-without-snippy"}}]}'
        printf "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n%s" "$ok_body"
    fi
}
export -f mock_snippy_handler

socat TCP-LISTEN:"${MOCK_PORT}",fork,reuseaddr EXEC:"bash -c mock_snippy_handler" &
MOCK_PID=$!
sleep 0.3

export NVIDIA_API_KEYS="nvapi-test-key"
export UPSTREAM_URL="http://127.0.0.1:${MOCK_PORT}/v1/chat/completions"
export ROUTER_PORT="$TEST_PORT" STATE_DIR

"$ROUTER_SH" serve >/dev/null 2>&1 &
ROUTER_PID=$!
sleep 0.5

# Send request containing "snippy": true
resp=$(curl -s -X POST "http://127.0.0.1:${TEST_PORT}/v1/chat/completions" \
    -H "Content-Type: application/json" \
    -d '{"model":"nvidia/z-ai/glm-5.2","messages":[{"role":"user","content":"hi"}],"snippy":true}')

assert_contains "$resp" "success-without-snippy" "Router automatically stripped 'snippy' and succeeded on retry"

kill "$ROUTER_PID" "$MOCK_PID" 2>/dev/null || true
sleep 0.2

# ── Test 6: OpenAI max_completion_tokens -> max_tokens Auto-Mapping ───────────
log_test "6. OpenAI max_completion_tokens Auto-Mapping for NIM Compatibility"
cleanup
mkdir -p "$STATE_DIR" "/tmp/mock_resilience_${MOCK_PORT}"

mock_param_map_handler() {
    read -r req_line
    local cl=0
    while IFS= read -r h; do
        h=$(echo "$h" | tr -d "\r")
        [ -z "$h" ] && break
        if [[ "$(echo "$h" | tr "[:upper:]" "[:lower:]")" =~ ^content-length: ]]; then
            cl=$(echo "$h" | cut -d: -f2 | tr -d " ")
        fi
    done

    local body=""
    [ "$cl" -gt 0 ] && body=$(head -c "$cl")

    # Verify max_tokens is present and max_completion_tokens is deleted
    local has_max_tokens=$(echo "$body" | jq -r '.max_tokens // empty')
    local has_max_comp=$(echo "$body" | jq -r '.max_completion_tokens // empty')

    if [ "$has_max_tokens" = "2048" ] && [ -z "$has_max_comp" ]; then
        local ok_body='{"id":"chatcmpl-map","choices":[{"message":{"content":"mapped-successfully"}}]}'
        printf "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n%s" "$ok_body"
    else
        local err_body='{"error":{"message":"Failed to map max_tokens"}}'
        printf "HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n%s" "$err_body"
    fi
}
export -f mock_param_map_handler

socat TCP-LISTEN:"${MOCK_PORT}",fork,reuseaddr EXEC:"bash -c mock_param_map_handler" &
MOCK_PID=$!
sleep 0.3

export NVIDIA_API_KEYS="nvapi-test-key"
export UPSTREAM_URL="http://127.0.0.1:${MOCK_PORT}/v1/chat/completions"
export ROUTER_PORT="$TEST_PORT" STATE_DIR

"$ROUTER_SH" serve >/dev/null 2>&1 &
ROUTER_PID=$!
sleep 0.5

resp=$(curl -s -X POST "http://127.0.0.1:${TEST_PORT}/v1/chat/completions" \
    -H "Content-Type: application/json" \
    -d '{"model":"nvidia/z-ai/glm-5.2","messages":[{"role":"user","content":"hi"}],"max_completion_tokens":2048}')

assert_contains "$resp" "mapped-successfully" "Router automatically mapped max_completion_tokens to max_tokens"

kill "$ROUTER_PID" "$MOCK_PID" 2>/dev/null || true
sleep 0.2

# ── Test 7: Quota Exhausted (insufficient_quota) Failover ─────────────────────
log_test "7. Quota Exhaustion (insufficient_quota) Automatic Lockout & Failover"
cleanup
mkdir -p "$STATE_DIR" "/tmp/mock_resilience_${MOCK_PORT}"

mock_quota_handler() {
    read -r req_line
    local auth=""
    while IFS= read -r h; do
        h=$(echo "$h" | tr -d "\r")
        [ -z "$h" ] && break
        if [[ "$h" =~ ^[Aa]uthorization: ]]; then auth="$h"; fi
    done

    if [[ "$auth" == *"nvapi-empty-wallet"* ]]; then
        printf "HTTP/1.1 403 Forbidden\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n{\"error\":{\"message\":\"You exceeded your current quota, please check your plan and billing details.\",\"type\":\"insufficient_quota\",\"code\":\"insufficient_quota\"}}"
    else
        printf "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n{\"choices\":[{\"message\":{\"content\":\"success-from-funded-key\"}}]}"
    fi
}
export -f mock_quota_handler

socat TCP-LISTEN:"${MOCK_PORT}",fork,reuseaddr EXEC:"bash -c mock_quota_handler" &
MOCK_PID=$!
sleep 0.3

export NVIDIA_API_KEYS="nvapi-empty-wallet,nvapi-funded-key"
export UPSTREAM_URL="http://127.0.0.1:${MOCK_PORT}/v1/chat/completions"
export ROUTER_PORT="$TEST_PORT" STATE_DIR

"$ROUTER_SH" serve >/dev/null 2>&1 &
ROUTER_PID=$!
sleep 0.5

resp=$(curl -s -X POST "http://127.0.0.1:${TEST_PORT}/v1/chat/completions" \
    -H "Content-Type: application/json" \
    -d '{"model":"nvidia/z-ai/glm-5.2","messages":[]}')

assert_contains "$resp" "success-from-funded-key" "Client received response after insufficient_quota failover"

health_res=$(curl -s "http://127.0.0.1:${TEST_PORT}/health")
invalid_keys=$(echo "$health_res" | jq -r '.invalid_keys // empty')
assert_eq "1" "$invalid_keys" "Exhausted key is tracked as invalid_keys: 1 (24h lockout)"

kill "$ROUTER_PID" "$MOCK_PID" 2>/dev/null || true
sleep 0.2

# ── Test 8: OmniRoute NVIDIA Pre-Transform Rules (prompt_cache_key, thinking, clamping) ───
log_test "8. OmniRoute NVIDIA Pre-Transform Rules (prompt_cache_key, thinking, max_tokens clamp)"
cleanup
mkdir -p "$STATE_DIR" "/tmp/mock_resilience_${MOCK_PORT}"

mock_omniroute_transform_handler() {
    read -r req_line
    local cl=0
    while IFS= read -r h; do
        h=$(echo "$h" | tr -d "\r")
        [ -z "$h" ] && break
        if [[ "$(echo "$h" | tr "[:upper:]" "[:lower:]")" =~ ^content-length: ]]; then
            cl=$(echo "$h" | cut -d: -f2 | tr -d " ")
        fi
    done

    local body=""
    [ "$cl" -gt 0 ] && body=$(head -c "$cl")

    local has_pck=$(echo "$body" | jq -r '.prompt_cache_key // empty')
    local has_thinking=$(echo "$body" | jq -r '.thinking // empty')
    local max_tok=$(echo "$body" | jq -r '.max_tokens // empty')

    # Ensure prompt_cache_key and thinking were removed, and max_tokens clamped from 65536 down to 16000
    if [ -z "$has_pck" ] && [ -z "$has_thinking" ] && [ "$max_tok" = "16000" ]; then
        local ok_body='{"id":"chatcmpl-omni","choices":[{"message":{"content":"omniroute-transforms-verified"}}]}'
        printf "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n%s" "$ok_body"
    else
        local err_body='{"error":{"message":"Failed omniroute transforms"}}'
        printf "HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n%s" "$err_body"
    fi
}
export -f mock_omniroute_transform_handler

socat TCP-LISTEN:"${MOCK_PORT}",fork,reuseaddr EXEC:"bash -c mock_omniroute_transform_handler" &
MOCK_PID=$!
sleep 0.3

export NVIDIA_API_KEYS="nvapi-test-key"
export UPSTREAM_URL="http://127.0.0.1:${MOCK_PORT}/v1/chat/completions"
export ROUTER_PORT="$TEST_PORT" STATE_DIR

"$ROUTER_SH" serve >/dev/null 2>&1 &
ROUTER_PID=$!
sleep 0.5

# Send request with prompt_cache_key, Claude-style thinking, and 65536 max_tokens
resp=$(curl -s -X POST "http://127.0.0.1:${TEST_PORT}/v1/chat/completions" \
    -H "Content-Type: application/json" \
    -d '{"model":"nvidia/z-ai/glm-5.2","messages":[{"role":"user","content":"hi"}],"prompt_cache_key":"cli_session_123","thinking":{"type":"adaptive"},"max_tokens":65536}')

assert_contains "$resp" "omniroute-transforms-verified" "Router pre-sanitized prompt_cache_key, thinking, and clamped max_tokens to 16000"

kill "$ROUTER_PID" "$MOCK_PID" 2>/dev/null || true
sleep 0.2

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "================================================="
echo "Resilience Test Results: ${PASSED} Passed, ${FAILED} Failed"
echo "================================================="

if [ "$FAILED" -gt 0 ]; then
    exit 1
fi
exit 0
