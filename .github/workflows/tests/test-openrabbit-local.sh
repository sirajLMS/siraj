#!/usr/bin/env bash
# ==============================================================================
# Local End-to-End Test for OpenRabbit Reviewer through Shell NVIDIA Router
# ==============================================================================
set -eo pipefail

ROUTER_SCRIPT="/home/ahmed/Projects/siraj/.github/scripts/nvidia-router.sh"
TEST_PORT="${ROUTER_PORT:-20129}"

echo "================================================================="
echo "   OpenRabbit Reviewer Local End-to-End Test with Shell Router   "
echo "================================================================="

# 1. Start the router locally
echo "▶ 1. Starting Shell NVIDIA Router on port ${TEST_PORT}..."
export ROUTER_PORT="$TEST_PORT"
"$ROUTER_SCRIPT" start

cleanup() {
    echo ""
    echo "▶ Stopping Shell NVIDIA Router..."
    export ROUTER_PORT="$TEST_PORT"
    "$ROUTER_SCRIPT" stop >/dev/null 2>&1 || true
}
trap cleanup EXIT

# 2. Build or verify OpenRabbit
OPENRABBIT_DIR="/tmp/openrabbit-runner"
if [ ! -d "$OPENRABBIT_DIR" ]; then
    echo "▶ 2. Cloning OpenRabbit repository into ${OPENRABBIT_DIR}..."

    # Hard-pinned commit of aryanbrite/openrabbit for supply-chain safety
    # (pinned on 2026-09-17, commit dated 2026-08-23). To upgrade, update this
    # SHA after reviewing the upstream diff. Set OPENRABBIT_ALLOW_UNPINNED=1
    # to bypass explicitly (local debugging only).
    OPENRABBIT_SHA="a05dc7e11748a93a3518553c3de82a98eba9df0f"
    if [ "${OPENRABBIT_ALLOW_UNPINNED:-0}" != "1" ]; then
        echo "   Pinned to commit ${OPENRABBIT_SHA} (pinned 2026-09-17)"
        git clone --depth 1 https://github.com/aryanbrite/openrabbit "$OPENRABBIT_DIR" >/dev/null 2>&1
        git -C "$OPENRABBIT_DIR" fetch --depth 1 origin "$OPENRABBIT_SHA" >/dev/null 2>&1
        git -C "$OPENRABBIT_DIR" checkout --detach "$OPENRABBIT_SHA" >/dev/null 2>&1
    else
        echo "   ⚠️ Warning: OPENRABBIT_ALLOW_UNPINNED=1 set — cloning at floating HEAD (unpinned)."
        git clone --depth 1 https://github.com/aryanbrite/openrabbit "$OPENRABBIT_DIR" >/dev/null 2>&1
    fi

    cd "$OPENRABBIT_DIR"
    echo "▶ Installing dependencies and building OpenRabbit..."
    npm install >/dev/null 2>&1
    npm run build >/dev/null 2>&1
fi

# 3. Create a test Node runner
RUNNER_SCRIPT="/tmp/run_openrabbit_test.mjs"
cat <<'EOF' > "$RUNNER_SCRIPT"
import { createLLMClient } from '/tmp/openrabbit-runner/dist/llm/index.js';

async function main() {
  const port = process.env.ROUTER_PORT || '20129';
  const model = process.env.ROUTER_MODEL || 'nvidia/z-ai/glm-5.2';

  console.log(`📡 Connecting to router on http://127.0.0.1:${port}/v1 with model ${model}...`);
  
  const client = createLLMClient('openrouter', {
    apiKey: 'local-proxy-token',
    apiUrl: `http://127.0.0.1:${port}/v1`,
    model: model,
  });

  const sampleDiff = `
diff --git a/backend/auth.ts b/backend/auth.ts
index 1234567..89abcdef 100644
--- a/backend/auth.ts
+++ b/backend/auth.ts
@@ -10,6 +10,12 @@ export function verifyToken(token: string) {
+  // Added bypass for testing
+  if (token === "super-admin-bypass") {
+    return { role: "admin", id: "root" };
+  }
   return jwt.verify(token, process.env.JWT_SECRET);
 }
`;

  const reviewPrompt = `Review the following Pull Request diff:\n${sampleDiff}\n\nReturn your review matching the standard OpenRabbit JSON schema.`;

  const start = Date.now();
  const result = await client.complete(reviewPrompt);
  const duration = ((Date.now() - start) / 1000).toFixed(2);

  console.log(`\n✅ OpenRabbit Review Succeeded in ${duration}s!`);
  console.log('\n--- OpenRabbit Review Output ---');
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('❌ OpenRabbit Review Failed:', err);
  process.exit(1);
});
EOF

# 4. Run OpenRabbit
echo "▶ 3. Executing OpenRabbit review against model nvidia/z-ai/glm-5.2..."
ROUTER_PORT="$TEST_PORT" node "$RUNNER_SCRIPT"
rm -f "$RUNNER_SCRIPT"

echo ""
echo "================================================================="
echo "   ✔ Local OpenRabbit + Shell Router verification successful!    "
echo "================================================================="
