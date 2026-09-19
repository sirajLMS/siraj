/**
 * Masks sensitive values inside audit JSONB payloads before they are persisted.
 *
 * Audit logs intentionally keep name/email visible (they are the point of the
 * table), but credentials and financial identifiers must never be stored in
 * plaintext inside `previousState` / `newState` / `changes`.
 */

const MASKED_VALUE = "[MASKED]";

/**
 * Sensitive key substrings (case/space/underscore/punctuation insensitive).
 * Matching is substring-based so decorated variants (passwordHash, apiKey,
 * clientSecret, capitalized or snake_case copies) are masked too —
 * over-masking an innocent key is safe, leaking a credential is not.
 */
const SENSITIVE_AUDIT_KEY_PATTERNS: ReadonlyArray<string> = [
  "password",
  "secret",
  "token",
  "apikey",
  "authorization",
  "iban",
  "accountnumber",
  "routingnumber",
  "swiftbic",
  "nationalid",
];

function isSensitiveAuditKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[\s_.-]/g, "");
  return SENSITIVE_AUDIT_KEY_PATTERNS.some(pattern => normalized.includes(pattern));
}

/** Depth cap for the recursive walk — guards against cyclic/hostile payloads. */
export const MAX_AUDIT_MASK_DEPTH = 8;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Recursively walks a JSON-like payload and replaces the value of every
 * sensitive key with "[MASKED]". Past the depth cap the entire subtree is
 * masked rather than passed through — an unmasked deep credential is a
 * leak, and audit payloads rarely legitimately exceed the cap. Returns the
 * original reference when there is nothing to mask; otherwise returns a new
 * structure (the input is never mutated).
 */
export function maskSensitiveAuditValues(value: unknown, depth = 0): unknown {
  if (depth >= MAX_AUDIT_MASK_DEPTH) {
    return MASKED_VALUE;
  }

  if (Array.isArray(value)) {
    const maskedItems = value.map(item => maskSensitiveAuditValues(item, depth + 1));
    return maskedItems.some((masked, index) => masked !== value[index]) ? maskedItems : value;
  }

  if (!isRecord(value)) {
    return value;
  }

  let masked = false;
  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (isSensitiveAuditKey(key)) {
      result[key] = MASKED_VALUE;
      masked = true;
      continue;
    }
    const maskedChild = maskSensitiveAuditValues(child, depth + 1);
    result[key] = maskedChild;
    if (maskedChild !== child) {
      masked = true;
    }
  }

  return masked ? result : value;
}

/**
 * Insert-boundary helper: masks an audit JSONB payload, preserving
 * `null`/`undefined → null` semantics used by the audit row mappers.
 */
export function maskAuditPayload(payload: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!payload) {
    return null;
  }
  const masked = maskSensitiveAuditValues(payload);
  return isRecord(masked) ? masked : payload;
}
