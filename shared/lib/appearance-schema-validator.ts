/**
 * Runtime validator for `AppearanceFields` (AC-25).
 *
 * Schema-driven: hex color pattern, enum values, and string length bounds
 * are read at module-load time from `shared/schemas/appearance.schema.json`,
 * so tightening the JSON Schema automatically tightens runtime validation
 * (single source of truth). The validator is self-contained — it does not
 * depend on Ajv (v6.x is present in `node_modules` as a transitive dep but
 * is not declared in `package.json`, so a direct import would be fragile).
 *
 * Layer note: lives in `shared/` so both the backend publish/saveDraft path
 * and the frontend "Import JSON" customizer flow can call it without crossing
 * the layer boundary. Accepts `unknown` (no import of `AppearanceFields` from
 * `@/backend/types` — that would violate `shared/` layer isolation).
 *
 * Used by:
 * - `AppearanceSettingsService.saveDraft` / `publish` (defensive re-validation
 *   of `draft_fields` JSONB before write — AC-9, AC-10).
 * - Task 9.3 "Export JSON" / future "Import JSON" customizer flow (AC-28).
 * - Task 9.2 ENV hydration parser (validates `NEXT_PUBLIC_APP_BRANDING`
 *   payload before falling back to defaults — AC-27).
 */

import appearanceSchema from "@/shared/schemas/appearance.schema.json";

export interface AppearanceValidationResult {
  /** `true` when `data` conforms to the `AppearanceFields` schema. */
  valid: boolean;
  /** Human-readable constraint violations (instance paths). Present iff `valid === false`. */
  errors?: string[];
}

/** Subset of JSON Schema supported by this validator (string-focused). */
interface StringPropSchema {
  type?: string | string[];
  pattern?: string;
  enum?: string[];
  minLength?: number;
  maxLength?: number;
  format?: string;
  $ref?: string;
  properties?: Record<string, StringPropSchema>;
}

interface AppearanceSchemaShape {
  required: readonly string[];
  properties: Record<string, StringPropSchema>;
  $defs: Record<string, StringPropSchema>;
}

/**
 * Trust-but-verify: the JSON Schema is a private file we ship, but we still
 * guard its shape at module load so a future edit can't silently turn the
 * validator into a no-op (or, worse, throw on access). Uses a type predicate
 * (no `as` cast) so `no-unsafe-type-assertion` stays clean.
 */
function isAppearanceSchema(value: unknown): value is AppearanceSchemaShape {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  return (
    "required" in value &&
    Array.isArray(value.required) &&
    "properties" in value &&
    typeof value.properties === "object" &&
    value.properties !== null &&
    "$defs" in value &&
    typeof value.$defs === "object" &&
    value.$defs !== null
  );
}

if (!isAppearanceSchema(appearanceSchema)) {
  throw new Error("appearance.schema.json: invalid shape (expected `required`, `properties`, `$defs`)");
}

const SCHEMA: AppearanceSchemaShape = appearanceSchema;

const REQUIRED_MODES = ["light", "dark"] as const;
const SCALAR_FIELDS = ["logoUrl", "siteName", "siteTitle", "siteDescription", "defaultColorScheme"] as const;

/** Compiled regex cache keyed by pattern source (the schema only has the hex pattern, reused 4x). */
const patternCache = new Map<string, RegExp>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolveDef(ref: string | undefined): StringPropSchema | undefined {
  if (!ref) {
    return undefined;
  }
  const name = ref.replace(/^#\/\$defs\//, "");
  return SCHEMA.$defs[name];
}

function validateStringField(node: StringPropSchema, value: unknown, path: string): string[] {
  if (typeof value !== "string") {
    return [`${path}: expected string`];
  }
  const errors: string[] = [];
  if (node.pattern) {
    let regex = patternCache.get(node.pattern);
    if (!regex) {
      regex = new RegExp(node.pattern);
      patternCache.set(node.pattern, regex);
    }
    if (!regex.test(value)) {
      errors.push(`${path}: must match pattern ${node.pattern}`);
    }
  }
  if (node.minLength !== undefined && value.length < node.minLength) {
    errors.push(`${path}: must be at least ${node.minLength} characters`);
  }
  if (node.maxLength !== undefined && value.length > node.maxLength) {
    errors.push(`${path}: must be at most ${node.maxLength} characters`);
  }
  if (node.enum && !node.enum.includes(value)) {
    errors.push(`${path}: must be one of [${node.enum.join(", ")}]`);
  }
  if (node.format === "uri" && value !== "" && !URL.canParse(value)) {
    errors.push(`${path}: must be a valid URI`);
  }
  return errors;
}

/**
 * Validate the `colors` block of `AppearanceFields`.
 *
 * Extracted from {@link validateAppearanceFields} to keep Cognitive Complexity
 * under the SonarQube budget (15) — the colors branch has its own per-mode
 * traversal that would otherwise push the parent over the limit.
 *
 * Mutates `errors` in place.
 */
function validateColors(colors: unknown, errors: string[]): void {
  if (!isRecord(colors)) {
    errors.push("colors: expected an object");
    return;
  }
  const colorsNode = SCHEMA.properties.colors;
  for (const mode of REQUIRED_MODES) {
    const modeNode = colorsNode?.properties?.[mode];
    const def = resolveDef(modeNode?.$ref);
    const modeVal = colors[mode];
    if (!isRecord(modeVal)) {
      errors.push(`colors.${mode}: expected an object`);
      continue;
    }
    if (def?.properties) {
      for (const [field, node] of Object.entries(def.properties)) {
        errors.push(...validateStringField(node, modeVal[field], `colors.${mode}.${field}`));
      }
    }
  }
}

/**
 * Validate an unknown payload against the `AppearanceFields` JSON Schema.
 *
 * Returns `{ valid: true }` on success, or `{ valid: false, errors }` with
 * one entry per violated constraint (instance-path prefixed). Nullable
 * `logoUrl` accepts `null` (per `type: ["string", "null"]`).
 *
 * @example
 *   const result = validateAppearanceFields(parsed);
 *   if (!result.valid) { logger.warn("appearance invalid", { errors: result.errors }); }
 */
export function validateAppearanceFields(data: unknown): AppearanceValidationResult {
  if (!isRecord(data)) {
    return { valid: false, errors: ["root: expected an object"] };
  }

  const errors: string[] = [];

  for (const key of SCHEMA.required) {
    if (!(key in data)) {
      errors.push(`${key}: missing required property`);
    }
  }

  const colors = data.colors;
  if (colors !== undefined) {
    validateColors(colors, errors);
  }

  for (const key of SCALAR_FIELDS) {
    const val = data[key];
    if (val === undefined) {
      continue;
    }
    // `logoUrl` is nullable (`type: ["string", "null"]`) — `null` is always valid.
    if (key === "logoUrl" && val === null) {
      continue;
    }
    const node = SCHEMA.properties[key];
    errors.push(...validateStringField(node, val, key));
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}
