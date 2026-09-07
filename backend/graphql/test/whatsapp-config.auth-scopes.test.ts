import { describe, expect, test } from "bun:test";

import { AppPermission } from "@/backend/enum";
// The production schema module registers every Pothos type/query/mutation
// (gqlSchema.definitions), declares the root types, and builds the executable
// schema — the build is what materializes the name-keyed field configs the
// authScopes assertion below reads back.
import "@/backend/graphql/gqlSchema";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";

/**
 * Structural auth-scope coverage for the WhatsApp configuration mutation.
 * The `notImpersonating` scope mirrors the sibling env-config mutations:
 * credential rotation must never be attributable to an impersonating session.
 * The scope semantics themselves (`!ctx.isImpersonating`) are covered by
 * `gqlSchemaBuilder.scopeAuth.test.ts`; this pins the wiring on the field.
 */
describe("updateWhatsappConfiguration — authScopes", () => {
  test("requires WHATSAPP_CONFIG_MANAGE and blocks impersonating sessions", () => {
    const fields = gqlSchemaBuilder.configStore.getFields("Mutation");
    const field = fields.get("updateWhatsappConfiguration");
    if (!field) {
      throw new Error("updateWhatsappConfiguration was not registered on the Mutation type");
    }

    // `authScopes` only exists on some members of the field-options union, so
    // the access is guarded with an `in` check (no type assertion) — an
    // authScopes-less field fails loudly below instead of asserting wrongly.
    const { pothosOptions } = field;
    if (typeof pothosOptions !== "object" || pothosOptions === null || !("authScopes" in pothosOptions)) {
      throw new Error("updateWhatsappConfiguration does not declare authScopes");
    }
    const authScopes = pothosOptions.authScopes;
    // `$all` is load-bearing: the builder's scopeAuth defaultStrategy is
    // "any", so a bare `{ permission, notImpersonating }` map would grant on
    // the first truthy scope and skip the permission check entirely.
    expect(authScopes).toEqual({
      $all: { permission: AppPermission.WHATSAPP_CONFIG_MANAGE, notImpersonating: true },
    });
  });
});
