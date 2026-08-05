/**
 * Test concurrent lint requests to verify in-process FIFO queue serialization.
 * This script spawns multiple concurrent calls to the lint service and verifies
 * that they are processed in order with proper queue depth tracking.
 */

import { requestLintWithMetrics } from "@/scripts/lint-service";

async function testConcurrentRequests() {
  console.log("=== Testing Concurrent Lint Requests ===\n");
  console.log("Spawning 5 concurrent lint requests...\n");

  const startTime = Date.now();

  // Launch 5 concurrent requests
  const promises = [
    requestLintWithMetrics("request-1", ["scripts/lint-service.ts"]),
    requestLintWithMetrics("request-2", ["scripts/health/sub-loop.ts"]),
    requestLintWithMetrics("request-3", ["scripts/safe-dev.ts"]),
    requestLintWithMetrics("request-4", ["package.json"]),
    requestLintWithMetrics("request-5", ["tsconfig.json"]),
  ];

  // Wait for all to complete
  const results = await Promise.all(promises);

  const totalTime = Date.now() - startTime;

  console.log("Results:\n");
  results.forEach((result, index) => {
    console.log(`Request ${index + 1} (${result.metrics.id}):`);
    console.log(`  Queue depth at enqueue: ${result.metrics.queueDepthAtEnqueue}`);
    console.log(`  Enqueued at: ${result.metrics.enqueuedAt}`);
    console.log(`  Started at: ${result.metrics.startedAt}`);
    console.log(`  Duration: ${result.metrics.durationMs}ms`);
    console.log(`  Success: ${result.success}`);
    console.log("");
  });

  console.log(`Total execution time: ${totalTime}ms\n`);

  // Verify serialization
  console.log("=== Verification ===");

  // Check queue depths - should be 0, 1, 2, 3, 4 (FIFO order)
  const queueDepths = results.map(r => r.metrics.queueDepthAtEnqueue);
  console.log(`Queue depths at enqueue: [${queueDepths.join(", ")}]`);

  const expectedDepths = [0, 1, 2, 3, 4];
  const depthsMatch = queueDepths.every((depth, idx) => depth === expectedDepths[idx]);

  if (depthsMatch) {
    console.log("✅ PASS: Requests were properly queued in FIFO order");
  } else {
    console.log("❌ FAIL: Queue depths don't match expected FIFO pattern");
  }

  // Check that requests didn't overlap (serialized execution)
  let overlapped = false;
  for (let i = 0; i < results.length - 1; i++) {
    const current = results[i];
    const next = results[i + 1];
    if (current.metrics.finishedAt > next.metrics.startedAt) {
      overlapped = true;
      console.log(`❌ FAIL: Request ${i + 1} overlapped with request ${i + 2}`);
    }
  }

  if (!overlapped) {
    console.log("✅ PASS: All requests executed serially (no overlap)");
  }

  // Check all succeeded
  const allSuccess = results.every(r => r.success);
  if (allSuccess) {
    console.log("✅ PASS: All lint requests succeeded");
  } else {
    console.log("❌ FAIL: Some lint requests failed");
  }

  console.log("\n=== Test Complete ===");
}

testConcurrentRequests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
