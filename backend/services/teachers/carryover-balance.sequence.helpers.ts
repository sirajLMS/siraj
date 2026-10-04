/** Applies `handle` to each item in order; the shared transaction connection must never see interleaved calls. */
export async function forEachInSequence<T>(items: readonly T[], handle: (item: T) => Promise<void>): Promise<void> {
  await items.reduce(async (prev, item) => {
    await prev;
    await handle(item);
  }, Promise.resolve());
}

/** Maps items to results, awaiting each step in order for the same shared-connection reason. */
export async function mapInSequence<T, R>(items: readonly T[], handle: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  await items.reduce(async (prev, item) => {
    await prev;
    results.push(await handle(item));
  }, Promise.resolve());
  return results;
}
