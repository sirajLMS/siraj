// Helper function handles the S6551 primitive checks safely
export function parseUnknownPayload(payload: unknown): string {
  if (payload === null || payload === undefined) {
    return "";
  }

  // 1. Explicitly check for primitives
  if (typeof payload === "string" || typeof payload === "number" || typeof payload === "boolean") {
    return String(payload);
  }

  // 2. Handle plain objects
  if (typeof payload === "object") {
    const obj = payload as Record<string, unknown>;

    // If it's an object with a valid 'message' string property, use that
    if (typeof obj.message === "string") {
      return obj.message;
    }

    return JSON.stringify(payload) || "";
  }

  // 3. Fallback for weird types (functions, symbols)
  return JSON.stringify(payload) || "";
}
