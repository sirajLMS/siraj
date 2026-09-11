import { performance } from "node:perf_hooks";

type MarkResult =
  | { success: true; candidate: { id: string } }
  | { success: false; candidate: { id: string }; error: unknown };

// Create synthetic data matching typical production sizes (e.g. 20 items) and larger arrays (e.g. 1000 items)
function createData(size: number, failureRate = 0.1): MarkResult[] {
  const results: MarkResult[] = [];
  for (let i = 0; i < size; i++) {
    if (Math.random() < failureRate) {
      results.push({
        success: false,
        candidate: { id: `del-${i}` },
        error: new Error("Failed to mark delivery"),
      });
    } else {
      results.push({
        success: true,
        candidate: { id: `del-${i}` },
      });
    }
  }
  return results;
}

// Dummy logger to simulate logging overhead without IO noise
const dummyLogger = {
  warn: (_msg: string, _meta: unknown) => {
    // noop for benchmark
  },
};

function runBaseline(markResults: MarkResult[]): number {
  let updatedCount = 0;
  for (const result of markResults) {
    if (result.success) {
      updatedCount++;
      continue;
    }
    dummyLogger.warn("markAlertsRead: failed to mark delivery OPENED", {
      deliveryId: result.candidate.id,
      error: result.error instanceof Error ? result.error.message : String(result.error),
    });
  }
  return updatedCount;
}

function runReduce(markResults: MarkResult[]): number {
  return markResults.reduce((updatedCount, result) => {
    if (result.success) {
      return updatedCount + 1;
    }
    dummyLogger.warn("markAlertsRead: failed to mark delivery OPENED", {
      deliveryId: result.candidate.id,
      error: result.error instanceof Error ? result.error.message : String(result.error),
    });
    return updatedCount;
  }, 0);
}

function runStandardFor(markResults: MarkResult[]): number {
  let updatedCount = 0;
  const len = markResults.length;
  for (let i = 0; i < len; i++) {
    const result = markResults[i];
    if (result.success) {
      updatedCount++;
    } else {
      dummyLogger.warn("markAlertsRead: failed to mark delivery OPENED", {
        deliveryId: result.candidate.id,
        error: result.error instanceof Error ? result.error.message : String(result.error),
      });
    }
  }
  return updatedCount;
}

function benchmark(name: string, fn: (data: MarkResult[]) => number, data: MarkResult[], iterations: number) {
  // Warmup
  for (let i = 0; i < 1000; i++) {
    fn(data);
  }

  const start = performance.now();
  let checksum = 0;
  for (let i = 0; i < iterations; i++) {
    checksum += fn(data);
  }
  const end = performance.now();
  const totalMs = end - start;
  const opsPerSec = (iterations / totalMs) * 1000;
  console.log(
    `${name}: ${totalMs.toFixed(2)} ms (${Math.round(opsPerSec).toLocaleString()} ops/sec) [checksum: ${checksum}]`
  );
  return totalMs;
}

const ITERATIONS = 1_000_000;
console.log("--- Benchmark Array Size 20 (Typical Page Size) ---");
const data20 = createData(20, 0.1);
benchmark("Baseline (for..of)", runBaseline, data20, ITERATIONS);
benchmark("Reduce", runReduce, data20, ITERATIONS);
benchmark("Standard For Loop", runStandardFor, data20, ITERATIONS);

console.log("\n--- Benchmark Array Size 1000 ---");
const data1000 = createData(1000, 0.1);
benchmark("Baseline (for..of)", runBaseline, data1000, 20_000);
benchmark("Reduce", runReduce, data1000, 20_000);
benchmark("Standard For Loop", runStandardFor, data1000, 20_000);
