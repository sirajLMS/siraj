import { describe, expect, test } from "bun:test";
import { graphql } from "graphql";

import { UserRole } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
// The production schema module registers every Pothos type/query/mutation
// (gqlSchema.definitions); building it materializes the field configs the
// structural assertions read back and the executable schema the semantic
// tests run against.
import { graphQLSchema } from "@/backend/graphql/gqlSchema";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { getServerTranslations } from "@/shared/locale";

/**
 * Auth-scope semantics for `startImpersonation`: the scope-auth plugin's
 * default strategy is "any", so a bare multi-key map
 * `{ superAdmin: true, notImpersonating: true, notSimulatingGroup: true }`
 * would grant on the first truthy scope (`notImpersonating` on any normal
 * session). The field MUST be wrapped in `$all` so all three scopes gate
 * together — pinned structurally and by executing the real schema with a
 * hostile context that must be FORBIDDEN before reaching the resolver.
 */

/** Reads a mutation field's declared `authScopes` back from the config store. */
function readAuthScopes(fieldName: string): unknown {
  const fields = gqlSchemaBuilder.configStore.getFields("Mutation");
  const field = fields.get(fieldName);
  if (!field) {
    throw new Error(`${fieldName} was not registered on the Mutation type`);
  }
  const { pothosOptions } = field;
  if (!("authScopes" in pothosOptions)) {
    throw new Error(`${fieldName} does not declare authScopes`);
  }
  return pothosOptions.authScopes;
}

/** Minimal `BaseContext` for scope evaluation — the FORBIDDEN path never reaches the resolver. */
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

describe("startImpersonation — authScopes wiring", () => {
  test("superAdmin + notImpersonating + notSimulatingGroup are wrapped in $all", () => {
    expect(readAuthScopes("startImpersonation")).toEqual({
      $all: { superAdmin: true, notImpersonating: true, notSimulatingGroup: true },
    });
  });

  test("non-superadmin logged-in context → FORBIDDEN (superAdmin scope is live, not OR-satisfied)", async () => {
    // Without $all, `notImpersonating: true` would satisfy the bare map and
    // this context would reach the resolver (which gates again in the service
    // layer). This test pins schema-level enforcement so the gate is not
    // service-layer-only.
    const result = await graphql({
      schema: graphQLSchema,
      source: `mutation { startImpersonation(targetUserId: "00000000-0000-0000-0000-000000000000") { token } }`,
      contextValue: makeContext({ user: { id: "regular-user", displayCurrency: null } }),
    });
    const codes = (result.errors ?? []).map(error => error.extensions?.code);
    expect(codes).toContain("FORBIDDEN");
    expect(result.data?.startImpersonation ?? null).toBeNull();
  });
});
