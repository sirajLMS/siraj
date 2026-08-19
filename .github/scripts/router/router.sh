#!/usr/bin/env bash
# ==============================================================================
# Pure Shell AI Router - Main Orchestrator
# ==============================================================================
set -euo pipefail

ROUTER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${ROUTER_DIR}/loader.sh"
source "${ROUTER_DIR}/cooldown.sh"

ROUTER_PORT="${ROUTER_PORT:-20128}"
STATE_DIR="${STATE_DIR:-/tmp/nvidia_router_state_${ROUTER_PORT}}"
PID_FILE="/tmp/nvidia-router-${ROUTER_PORT}.pid"
LOG_FILE="/tmp/nvidia-router-${ROUTER_PORT}.log"

init_router() {
    mkdir -p "${STATE_DIR}/cooldowns" "${STATE_DIR}/tmp"
    load_keys_to_state "$STATE_DIR"
    echo 0 > "${STATE_DIR}/counter"
}

run_server() {
    init_router
    local port="$ROUTER_PORT"
    export ROUTER_PORT STATE_DIR

    if ! command -v socat >/dev/null 2>&1; then
        if command -v sudo >/dev/null 2>&1 && command -v apt-get >/dev/null 2>&1; then
            sudo apt-get update -y >/dev/null 2>&1 && sudo apt-get install -y socat >/dev/null 2>&1 || true
        fi
    fi

    if command -v socat >/dev/null 2>&1; then
        echo "[NvidiaRouter] Starting with socat on port ${port}..."
        exec socat TCP-LISTEN:"${port}",fork,reuseaddr SYSTEM:"${ROUTER_DIR}/handler.sh ${port} ${STATE_DIR}"
    elif command -v nc >/dev/null 2>&1; then
        echo "[NvidiaRouter] Starting with nc on port ${port}..."
        while true; do
            nc -l -p "${port}" -e "${ROUTER_DIR}/handler.sh" "${port}" "${STATE_DIR}" || sleep 0.1
        done
    else
        echo "Error: Neither socat nor nc is available." >&2
        exit 1
    fi
}

start_daemon() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo "NvidiaRouter is already running (PID: $(cat "$PID_FILE"))"
        return 0
    fi

    echo "Starting NvidiaRouter on port ${ROUTER_PORT}..."
    export ROUTER_PORT STATE_DIR
    "$0" serve > "$LOG_FILE" 2>&1 &
    local pid=$!
    echo "$pid" > "$PID_FILE"

    # Wait for readiness
    local ready=0
    for i in {1..30}; do
        if curl -sf "http://127.0.0.1:${ROUTER_PORT}/health" >/dev/null 2>&1; then
            ready=1
            break
        fi
        sleep 0.2
    done

    if [ "$ready" -eq 1 ]; then
        local stats
        stats=$(curl -s "http://127.0.0.1:${ROUTER_PORT}/health")
        echo "✓ NvidiaRouter is healthy on http://127.0.0.1:${ROUTER_PORT} (PID: $pid)"
        echo "  Stats: $stats"
    else
        echo "✗ Failed to verify NvidiaRouter health. Check logs at $LOG_FILE"
        cat "$LOG_FILE"
        return 1
    fi
}

stop_daemon() {
    if [ -f "$PID_FILE" ]; then
        local pid
        pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            echo "Stopping NvidiaRouter (PID: $pid)..."
            kill "$pid" 2>/dev/null || true
            sleep 0.3
            kill -9 "$pid" 2>/dev/null || true
        fi
        rm -f "$PID_FILE"
        echo "✓ NvidiaRouter stopped."
    else
        echo "NvidiaRouter is not running."
    fi
}

status_daemon() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo "NvidiaRouter is running (PID: $(cat "$PID_FILE"))"
        curl -s "http://127.0.0.1:${ROUTER_PORT}/health" || echo " (Health endpoint not responding)"
        echo ""
    else
        echo "NvidiaRouter is not running."
    fi
}

case "${1:-serve}" in
    serve)
        run_server
        ;;
    start)
        start_daemon
        ;;
    stop)
        stop_daemon
        ;;
    status)
        status_daemon
        ;;
    restart)
        stop_daemon
        start_daemon
        ;;
    load-keys)
        init_router
        ;;
    *)
        echo "Usage: $0 {start|stop|status|restart|serve|load-keys}"
        exit 1
        ;;
esac
