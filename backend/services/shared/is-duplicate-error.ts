const POSTGRES_UNIQUE_VIOLATION = "23505";

export function isDuplicateError(error: unknown): boolean {
  if (error == null || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  return code === POSTGRES_UNIQUE_VIOLATION;
}
