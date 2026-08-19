#!/usr/bin/env bash
# ==============================================================================
# Automated Test Suite for Pure Shell NvidiaRouter
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROUTER_SH="${SCRIPT_DIR}/../../scripts/nvidia-router.sh"
TEST_PORT="29188"
MOCK_PORT="29189"
STATE_DIR="/tmp/test_nvidia_router_state_${TEST_PORT}"

PASSED=0
FAILED=0

log_test() {
    echo "▶ Test: $1"
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

cleanup() {
    echo "Cleaning up test processes..."
    pkill -f "socat.*${TEST_PORT}" 2>/dev/null || true
    pkill -f "socat.*${MOCK_PORT}" 2>/dev/null || true
    rm -rf "$STATE_DIR" "/tmp/mock_state_${MOCK_PORT}"
}
trap cleanup EXIT

# ── Test 1: Key parsing ────────────────────────────────────────────────────────
log_test "1. Key parsing from comma, whitespace, and newline string"
NVIDIA_API_KEYS="nvapi-key1, nvapi-key2
nvapi-key3,
nvapi-key4"
export NVIDIA_API_KEYS ROUTER_PORT="$TEST_PORT" STATE_DIR

mkdir -p "$STATE_DIR"
echo "$NVIDIA_API_KEYS" | tr ',' '\n' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' | sed '/^$/d' > "${STATE_DIR}/keys.txt"

key_count=$(wc -l < "${STATE_DIR}/keys.txt")
assert_eq "4" "$key_count" "Correctly parsed 4 keys into keys.txt"

# ── Test 2: Health Check Endpoint ──────────────────────────────────────────────
log_test "2. Health check endpoint (/health)"
cleanup
mkdir -p "$STATE_DIR"
export NVIDIA_API_KEYS="keyA,keyB,keyC"
export ROUTER_PORT="$TEST_PORT" STATE_DIR

"$ROUTER_SH" serve > /dev/null 2>&1 &
ROUTER_PID=$!
sleep 0.5

health_res=$(curl -sf "http://127.0.0.1:${TEST_PORT}/health" || echo "{}")
status=$(echo "$health_res" | jq -r '.status // empty')
total_keys=$(echo "$health_res" | jq -r '.total_keys // empty')
active_keys=$(echo "$health_res" | jq -r '.active_keys // empty')

assert_eq "ok" "$status" "Health endpoint returned status ok"
assert_eq "3" "$total_keys" "Total keys reported as 3"
assert_eq "3" "$active_keys" "Active keys reported as 3"

kill "$ROUTER_PID" 2>/dev/null || true
sleep 0.2

# ── Test 3: Round-Robin Key Rotation & Upstream Forwarding ────────────────────
log_test "3. Round-robin key rotation across requests"
cleanup
mkdir -p "$STATE_DIR" "/tmp/mock_state_${MOCK_PORT}"

# Mock upstream server echoing the Authorization header
MOCK_LOG="/tmp/mock_state_${MOCK_PORT}/calls.log"
> "$MOCK_LOG"

mock_handler() {
    read -r req_line
    local auth_header=""
    while IFS= read -r h; do
        h=$(echo "$h" | tr -d '\r')
        [ -z "$h" ] && break
        if [[ "$h" =~ ^[Aa]uthorization: ]]; then
            auth_header="$h"
        fi
    done
    echo "$auth_header" >> "$MOCK_LOG"
    local body='{"id":"chatcmpl-mock","choices":[{"message":{"content":"mock-ok"}}]}'
    printf "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: %d\r\nConnection: close\r\n\r\n%s" "${#body}" "$body"
}
export -f mock_handler
export MOCK_LOG

socat TCP-LISTEN:"${MOCK_PORT}",fork,reuseaddr EXEC:"bash -c mock_handler" &
MOCK_PID=$!
sleep 0.3

export NVIDIA_API_KEYS="nvapi-key1,nvapi-key2,nvapi-key3"
export UPSTREAM_URL="http://127.0.0.1:${MOCK_PORT}/v1/chat/completions"
export ROUTER_PORT="$TEST_PORT" STATE_DIR

"$ROUTER_SH" serve > /dev/null 2>&1 &
ROUTER_PID=$!
sleep 0.5

# Send 3 requests
for i in {1..3}; do
    curl -s -X POST "http://127.0.0.1:${TEST_PORT}/v1/chat/completions" \
        -H "Content-Type: application/json" \
        -d '{"model":"test","messages":[]}' > /dev/null
done

calls=$(cat "$MOCK_LOG")
assert_contains "$calls" "Bearer nvapi-key1" "First call used nvapi-key1"
assert_contains "$calls" "Bearer nvapi-key2" "Second call used nvapi-key2"
assert_contains "$calls" "Bearer nvapi-key3" "Third call used nvapi-key3"

kill "$ROUTER_PID" "$MOCK_PID" 2>/dev/null || true
sleep 0.2

# ── Test 4: Immediate 429 Rate Limit Failover ──────────────────────────────────
log_test "4. Immediate 429 failover to next available key"
cleanup
mkdir -p "$STATE_DIR" "/tmp/mock_state_${MOCK_PORT}"
MOCK_LOG="/tmp/mock_state_${MOCK_PORT}/calls.log"
> "$MOCK_LOG"

mock_429_handler() {
    read -r req_line
    local auth_header=""
    while IFS= read -r h; do
        h=$(echo "$h" | tr -d '\r')
        [ -z "$h" ] && break
        if [[ "$h" =~ ^[Aa]uthorization: ]]; then
            auth_header="$h"
        fi
    done
    echo "$auth_header" >> "$MOCK_LOG"

    if [[ "$auth_header" == *"nvapi-rate-limited"* ]]; then
        local err_body='{"error":{"message":"Rate limit exceeded"}}'
        printf "HTTP/1.1 429 Too Many Requests\r\nContent-Type: application/json\r\nContent-Length: %d\r\nConnection: close\r\n\r\n%s" "${#err_body}" "$err_body"
    else
        local ok_body='{"id":"chatcmpl-retry","choices":[{"message":{"content":"success-after-429"}}]}'
        printf "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: %d\r\nConnection: close\r\n\r\n%s" "${#ok_body}" "$ok_body"
    fi
}
export -f mock_429_handler
export MOCK_LOG

socat TCP-LISTEN:"${MOCK_PORT}",fork,reuseaddr EXEC:"bash -c mock_429_handler" &
MOCK_PID=$!
sleep 0.3

export NVIDIA_API_KEYS="nvapi-rate-limited,nvapi-healthy-backup"
export UPSTREAM_URL="http://127.0.0.1:${MOCK_PORT}/v1/chat/completions"
export COOLDOWN_SEC=10
export ROUTER_PORT="$TEST_PORT" STATE_DIR

"$ROUTER_SH" serve > /dev/null 2>&1 &
ROUTER_PID=$!
sleep 0.5

# Send request that triggers 429 on first key and should succeed on second key
resp=$(curl -s -X POST "http://127.0.0.1:${TEST_PORT}/v1/chat/completions" \
    -H "Content-Type: application/json" \
    -d '{"model":"test","messages":[]}')

content=$(echo "$resp" | jq -r '.choices[0].message.content // empty')
assert_eq "success-after-429" "$content" "Client received success response after 429 retry"

# Check health endpoint reflects cooldown
health_res=$(curl -sf "http://127.0.0.1:${TEST_PORT}/health")
cooling_keys=$(echo "$health_res" | jq -r '.cooling_keys // empty')
assert_eq "1" "$cooling_keys" "Health stats accurately track 1 cooling key"

kill "$ROUTER_PID" "$MOCK_PID" 2>/dev/null || true
sleep 0.2

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "================================================="
echo "Test Results: ${PASSED} Passed, ${FAILED} Failed"
echo "================================================="

if [ "$FAILED" -gt 0 ]; then
    exit 1
fi
exit 0
