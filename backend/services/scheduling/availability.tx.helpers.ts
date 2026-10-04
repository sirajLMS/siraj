import type { DBTransaction, ReadExecutor } from "@/backend/types";

// Type guard: `ReadExecutor` is a union of `DBTransaction | typeof db`. Both
// members share Drizzle's query interface, so repositories treat them
// interchangeably. We cannot reliably distinguish them at runtime, so this
// guard accepts any `ReadExecutor` as a `DBTransaction`.
const isDbTransaction = (_tx: ReadExecutor): _tx is DBTransaction => true;

// Helper to narrow `ReadExecutor` to `DBTransaction` for repository calls.
export const txParam = (tx?: ReadExecutor): DBTransaction | undefined =>
  tx !== undefined && isDbTransaction(tx) ? tx : undefined;
