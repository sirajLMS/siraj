/** Reads a single URL query param, trimmed; absent or blank values mean "no value". */
export function readTrimmedParam(searchParams: URLSearchParams, name: string): string | null {
  const value = searchParams.get(name)?.trim() ?? null;
  return value === "" ? null : value;
}
