#!/bin/bash
set -e

echo "[agent-sandbox] Starting up..."
echo "[agent-sandbox] Working directory: $(pwd)"
echo "[agent-sandbox] User: $(whoami) (uid=$(id -u), gid=$(id -g))"

git config --global --add safe.directory /workspaces/siraj 2>/dev/null || true
git config --global --add safe.directory '*' 2>/dev/null || true

echo "[agent-sandbox] Ready. Executing: $@"
exec "$@"
