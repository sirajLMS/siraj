import { describe, expect, test } from "bun:test";
import { graphql } from "graphql";

import { AppPermission, UserRole } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
// The production schema module registers every Pothos type/query/mutation
// (gqlSchema.definitions), declares the root types, and builds the executable
// schema — the build is what materializes the name-keyed field configs the
// structural assertions below read back and what the semantic tests execute.
import { graphQLSchema } from "@/backend/graphql/gqlSchema";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { getServerTranslations } from "@/shared/locale";

/**
 * Structural + semantic auth-scope coverage for the credential-managing
 * mutations (WhatsApp configuration + the sibling env-config override
 * entries).
 *
 * The `$all` wrap is load-bearing: the schema builder does not set
 * `scopeAuth.defaultStrategy`, so it defaults to "any" — a bare
 * `{ permission, notImpersonating }` map would grant on the first truthy
 * scope (`notImpersonating: true` on a normal session) and never evaluate
 * the permission check. The semantic tests execute the REAL schema with
 * hostile contexts to pin the intended semantics (permission AND
 * non-impersonating) rather than trusting the wiring.
 */

/** Reads a mutation field's declared `authScopes` back from the config store. */
function readAuthScopes(fieldName: string): unknown {
  const fields = gqlSchemaBuilder.configStore.getFields("Mutation");
  const field = fields.get(fieldName);
  if (!field) {
    throw new Error(`${fieldName} was not registered on the Mutation type`);
  }

  // `authScopes` only exists on some members of the field-options union, so
  // the access is guarded with an `in` check (no type assertion) — an
  // authScopes-less field fails loudly below instead of asserting wrongly.
  const { pothosOptions } = field;
  if (!("authScopes" in pothosOptions)) {
    throw new Error(`${fieldName} does not declare authScopes`);
  }
  return pothosOptions.authScopes;
}

function expectAllWrapped(authScopes: unknown, expected: Record<string, unknown>): void {
  expect(authScopes).toEqual({ $all: expected });
}

describe("credential mutations — authScopes wiring", () => {
  test("updateWhatsappConfiguration requires WHATSAPP_CONFIG_MANAGE and blocks impersonating sessions", () => {
    expectAllWrapped(readAuthScopes("updateWhatsappConfiguration"), {
      permission: AppPermission.WHATSAPP_CONFIG_MANAGE,
      notImpersonating: true,
    });
  });

  test("upsertEnvConfigEntry requires SETTINGS_EDIT_ENV and blocks impersonating sessions", () => {
    expectAllWrapped(readAuthScopes("upsertEnvConfigEntry"), {
      permission: AppPermission.SETTINGS_EDIT_ENV,
      notImpersonating: true,
    });
  });

  test("deleteEnvConfigEntry requires SETTINGS_EDIT_ENV and blocks impersonating sessions", () => {
    expectAllWrapped(readAuthScopes("deleteEnvConfigEntry"), {
      permission: AppPermission.SETTINGS_EDIT_ENV,
      notImpersonating: true,
    });
  });
});

// ─── Semantic coverage — the REAL schema refuses hostile contexts ──────────────

/**
 * Minimal `BaseContext` for scope evaluation. The scope functions only read
 * `user`, `permissions`, `isSuperAdmin`, `isImpersonating`, `realUserId`, and
 * `t` (for the unauthorized-error copy) — no request or database surface is
 * touched, and the FORBIDDEN paths below never reach a resolver.
 */
function makeContext(overrides: Partial<BaseContext> = {}): BaseContext {
  const base: BaseContext = {
    user: { id: "user-1", displayCurrency: null },
    safeUser: undefined,
    permissions: [],
    permissionGroups: [],
    isSuperAdmin: false,
    actorUserId: undefined,
    isImpersonating: false,
    realUserId: undefined,
    isSimulatingGroup: false,
    simulatedGroupSlug: undefined,
    refreshToken: undefined,
    sessionId: undefined,
    role: UserRole.USER,
    locale: "en",
    t: () => getServerTranslations("en"),
  };
  return { ...base, ...overrides };
}

/** Zero-permission, non-impersonating session — the pentest PoC context. */
const ZERO_PERMISSION_CTX = (): BaseContext => makeContext({ permissions: [], isSuperAdmin: false });

/** Impersonating super-admin session — privileged actor, hijacked identity. */
const IMPERSONATING_SUPER_ADMIN_CTX = (): BaseContext =>
  makeContext({
    user: { id: "impersonated-user", displayCurrency: null },
    permissions: [],
    isSuperAdmin: true,
    isImpersonating: true,
    realUserId: "real-admin-actor",
    role: UserRole.SUPER_ADMIN,
  });

async function executeForContext(source: string, contextValue: BaseContext, variableValues?: Record<string, unknown>) {
  return graphql({ schema: graphQLSchema, source, contextValue, variableValues });
}

/** Asserts the operation was refused by scope auth with the FORBIDDEN code. */
async function expectForbidden(
  fieldName: string,
  source: string,
  contextValue: BaseContext,
  variableValues?: Record<string, unknown>
) {
  const result = await executeForContext(source, contextValue, variableValues);
  const codes = (result.errors ?? []).map(error => error.extensions?.code);
  expect(codes).toContain("FORBIDDEN");
  // The field was nullified by the scope failure — nothing was resolved.
  expect(result.data?.[fieldName] ?? null).toBeNull();
  return result;
}

describe("updateWhatsappConfiguration — semantic auth semantics (executed schema)", () => {
  const MUTATION = `
    mutation Update($input: WhatsappConfigUpdateInput!) {
      updateWhatsappConfiguration(input: $input) { source }
    }
  `;
  const VARIABLES = { input: { appId: "app-forbidden-probe" } };

  test("zero-permission non-impersonating context → FORBIDDEN (permission scope is live)", async () => {
    await expectForbidden("updateWhatsappConfiguration", MUTATION, ZERO_PERMISSION_CTX(), VARIABLES);
  });

  test("impersonating super-admin context → FORBIDDEN (notImpersonating scope is live)", async () => {
    await expectForbidden("updateWhatsappConfiguration", MUTATION, IMPERSONATING_SUPER_ADMIN_CTX(), VARIABLES);
  });
});

describe("upsertEnvConfigEntry — semantic auth semantics (executed schema)", () => {
  const MUTATION = `
    mutation Upsert($input: EnvConfigUpsertInput!) {
      upsertEnvConfigEntry(input: $input) { key }
    }
  `;
  const VARIABLES = { input: { key: "STORAGE_PROVIDER", value: "forbidden-probe" } };

  test("zero-permission non-impersonating context → FORBIDDEN (permission scope is live)", async () => {
    await expectForbidden("upsertEnvConfigEntry", MUTATION, ZERO_PERMISSION_CTX(), VARIABLES);
  });
});
