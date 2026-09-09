import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import type { OperationVariables, TypedDocumentNode } from "@apollo/client";
import type { WhatsappConfigUpdateInput } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  assignPermissionGroupToUserMutationDocument,
  createPermissionGroupMutationDocument,
  deletePermissionGroupMutationDocument,
  permissionsQueryDocument,
  revokePermissionGroupFromUserMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/permissions/permission-management.documents";
import {
  generateWhatsappVerifyTokenQueryDocument,
  testWhatsappConnectionQueryDocument,
  updateWhatsappConfigurationMutationDocument,
  whatsappConfigurationQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/whatsapp/whatsapp-config.documents";
import {
  assertOperationDenied,
  authenticatedRequest,
  extractGqlErrorCode,
  loginAndProvision,
  setupTestServerLifecycle,
  testClient,
} from "@/test/helpers";

/**
 * GraphQL integration coverage for the WhatsApp configuration surface:
 * permission gating (read via either WhatsApp permission, manage via
 * WHATSAPP_CONFIG_MANAGE only), secret masking at the API boundary, the
 * per-field merge semantics of the update mutation (omit keeps, null
 * clears), the verify-token candidate generator, and the connection check
 * while credentials are unconfigured (which must fail fast without any
 * live Meta Graph API call).
 */

const PLAIN_USER_DENIAL_GROUP = "teacher_default";
const WEBHOOK_PATH_SUFFIX = "/api/webhooks/whatsapp";

/**
 * Builds an update input for all seven fields. When `preserve` is false,
 * unset optional fields are passed as explicit nulls (the clear action);
 * when true, they stay `undefined` so the transport drops them and the
 * resolver treats them as omitted keys (the preserve action).
 */
function buildConfigInput(
  overrides: Partial<WhatsappConfigUpdateInput> & { appId: string },
  preserve = false
): WhatsappConfigUpdateInput {
  const fallback = preserve ? undefined : null;
  return {
    appId: overrides.appId,
    appSecret: overrides.appSecret ?? fallback,
    verifyToken: overrides.verifyToken ?? fallback,
    phoneNumberId: overrides.phoneNumberId ?? fallback,
    wabaId: overrides.wabaId ?? fallback,
    accessToken: overrides.accessToken ?? fallback,
    esConfigId: overrides.esConfigId ?? fallback,
  };
}

async function readConfiguration(token: string) {
  const data = await authenticatedRequest(token, "query", whatsappConfigurationQueryDocument);
  const config = data.whatsappConfiguration;
  if (!config) throw new Error("whatsappConfiguration returned null");
  return config;
}

/** Runs a privileged operation and asserts the FORBIDDEN scope denial. */
async function expectForbidden<TData, TVars extends OperationVariables>(
  token: string,
  operation: "query" | "mutate",
  document: TypedDocumentNode<TData, TVars>,
  variables?: TVars
): Promise<void> {
  const context = { headers: { Authorization: `Bearer ${token}` } };

  // The options object is assembled via Object.assign (same technique as the
  // shared `authenticatedRequest` helper) so the generic TypedDocumentNode
  // satisfies Apollo Client's strict call overloads; errorPolicy already
  // defaults to "all" in the shared test client.
  if (operation === "query") {
    const options = Object.assign({ query: document, context }, variables !== undefined ? { variables } : undefined);
    const result = await testClient.query(options);
    expect(result.error).toBeDefined();
    expect(extractGqlErrorCode(result.error)).toBe("FORBIDDEN");
    return;
  }

  const options = Object.assign({ mutation: document, context }, variables !== undefined ? { variables } : undefined);
  const result = await testClient.mutate(options);
  expect(result.error).toBeDefined();
  expect(extractGqlErrorCode(result.error)).toBe("FORBIDDEN");
}

describe("WhatsApp configuration GraphQL integration tests", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  let viewerToken = "";
  let viewerUserId = "";
  let viewerGroupId = "";

  test("provisions a super admin and an isolated WHATSAPP_VIEW-only user", async () => {
    const provisioned = await loginAndProvision("WhatsappCfg");
    superAdminToken = provisioned.superAdminToken;
    viewerToken = provisioned.teacherToken;
    viewerUserId = provisioned.teacherUserId;
    expect(superAdminToken).not.toBe("");
    expect(viewerToken).not.toBe("");

    const permsData = await authenticatedRequest(superAdminToken, "query", permissionsQueryDocument);
    const viewPermission = (permsData.permissions ?? []).find(permission => permission?.key === "whatsapp.view");
    if (typeof viewPermission?.id !== "string") throw new Error("whatsapp.view permission not found");

    const groupData = await authenticatedRequest(superAdminToken, "mutate", createPermissionGroupMutationDocument, {
      input: {
        name: { en: `Whatsapp Config Viewer ${Date.now()}` },
        description: { en: "Temporary viewer-only group for WhatsApp configuration tests" },
        permissionIds: [viewPermission.id],
      },
    });
    viewerGroupId = groupData.createPermissionGroup?.id ?? "";
    if (!viewerGroupId) throw new Error("temporary viewer group was not created");

    await authenticatedRequest(superAdminToken, "mutate", assignPermissionGroupToUserMutationDocument, {
      input: { groupId: viewerGroupId, userId: viewerUserId },
    });
  });

  test("exposes the masked configuration view to the super admin", async () => {
    const config = await readConfiguration(superAdminToken);
    expect(config.id).toBeTruthy();
    expect(config.source === "db" || config.source === "env").toBeTrue();
    expect(config.webhookUrl?.endsWith(WEBHOOK_PATH_SUFFIX)).toBeTrue();
  });

  test("generates distinct 48-character hex verify token candidates", async () => {
    const first = await authenticatedRequest(superAdminToken, "query", generateWhatsappVerifyTokenQueryDocument);
    const second = await authenticatedRequest(superAdminToken, "query", generateWhatsappVerifyTokenQueryDocument);
    expect(first.generateWhatsappVerifyToken).toMatch(/^[0-9a-f]{48}$/);
    expect(second.generateWhatsappVerifyToken).toMatch(/^[0-9a-f]{48}$/);
    expect(first.generateWhatsappVerifyToken).not.toBe(second.generateWhatsappVerifyToken);
  });

  test("reports a failed connection test while credentials are unconfigured", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", testWhatsappConnectionQueryDocument);
    const result = data.testWhatsappConnection;
    if (!result) throw new Error("testWhatsappConnection returned null");
    expect(result.id).toBeTruthy();
    expect(result.success).toBeFalse();
    expect(result.message?.length).toBeGreaterThan(0);
    expect(result.phoneNumber).toBeNull();
  });

  test("denies the configuration read for users without a WhatsApp permission", async () => {
    const denied = await assertOperationDenied(
      PLAIN_USER_DENIAL_GROUP,
      "query",
      whatsappConfigurationQueryDocument,
      {}
    );
    expect(denied).toBeTrue();
  });

  test("denies every configuration operation for users without WHATSAPP_CONFIG_MANAGE", async () => {
    const deniedRead = await assertOperationDenied(
      PLAIN_USER_DENIAL_GROUP,
      "query",
      generateWhatsappVerifyTokenQueryDocument,
      {}
    );
    expect(deniedRead).toBeTrue();

    const deniedTest = await assertOperationDenied(
      PLAIN_USER_DENIAL_GROUP,
      "query",
      testWhatsappConnectionQueryDocument,
      {}
    );
    expect(deniedTest).toBeTrue();

    const deniedUpdate = await assertOperationDenied(
      PLAIN_USER_DENIAL_GROUP,
      "mutate",
      updateWhatsappConfigurationMutationDocument,
      { input: buildConfigInput({ appId: "denied-app-id" }) }
    );
    expect(deniedUpdate).toBeTrue();
  });

  test("lets a WHATSAPP_VIEW-only user read but not manage, then cleans up the grant", async () => {
    const config = await readConfiguration(viewerToken);
    expect(config.id).toBeTruthy();

    try {
      await expectForbidden(viewerToken, "query", generateWhatsappVerifyTokenQueryDocument);
      await expectForbidden(viewerToken, "query", testWhatsappConnectionQueryDocument);
      await expectForbidden(viewerToken, "mutate", updateWhatsappConfigurationMutationDocument, {
        input: buildConfigInput({ appId: "viewer-denied-app-id" }),
      });
    } finally {
      await authenticatedRequest(superAdminToken, "mutate", revokePermissionGroupFromUserMutationDocument, {
        input: { groupId: viewerGroupId, userId: viewerUserId },
      });
      await authenticatedRequest(superAdminToken, "mutate", deletePermissionGroupMutationDocument, {
        groupId: viewerGroupId,
      });
    }
  });

  test("persists a full configuration without echoing plaintext secrets", async () => {
    const appSecret = `plain-secret-${randomUUID()}`;
    const accessToken = `plain-token-${randomUUID()}`;

    const savedData = await authenticatedRequest(
      superAdminToken,
      "mutate",
      updateWhatsappConfigurationMutationDocument,
      {
        input: buildConfigInput({
          appId: "cfg-app-1",
          appSecret,
          verifyToken: "cfg-verify-token-1",
          phoneNumberId: "cfg-pn-1",
          wabaId: "cfg-waba-1",
          accessToken,
          esConfigId: "cfg-es-1",
        }),
      }
    );
    const saved = savedData.updateWhatsappConfiguration;
    if (!saved) throw new Error("updateWhatsappConfiguration returned null");

    expect(saved.source).toBe("db");
    expect(saved.appId).toBe("cfg-app-1");
    expect(saved.verifyToken).toBe("cfg-verify-token-1");
    expect(saved.phoneNumberId).toBe("cfg-pn-1");
    expect(saved.wabaId).toBe("cfg-waba-1");
    expect(saved.esConfigId).toBe("cfg-es-1");
    // Masked tail only — the stored plaintext never crosses the API boundary.
    expect(saved.appSecret).toBe(`••••••••${appSecret.slice(-4)}`);
    expect(saved.accessToken).toBe(`••••••••${accessToken.slice(-4)}`);
    expect(JSON.stringify(savedData)).not.toContain(appSecret);
    expect(JSON.stringify(savedData)).not.toContain(accessToken);

    // Persistence read-back through the same API.
    const config = await readConfiguration(superAdminToken);
    expect(config.source).toBe("db");
    expect(config.appId).toBe("cfg-app-1");
    expect(config.phoneNumberId).toBe("cfg-pn-1");
    expect(config.wabaId).toBe("cfg-waba-1");
    expect(config.esConfigId).toBe("cfg-es-1");
    expect(config.appSecret).toBe(`••••••••${appSecret.slice(-4)}`);
    expect(config.accessToken).toBe(`••••••••${accessToken.slice(-4)}`);
    expect(JSON.stringify(config)).not.toContain(appSecret);
    expect(JSON.stringify(config)).not.toContain(accessToken);
  });

  test("keeps stored values for fields omitted from the input", async () => {
    // Field omission is the exact behavior under test: the unlisted fields
    // stay `undefined` on the wire (preserve) while explicit nulls would
    // clear, so this call site intentionally passes a partial input.
    await authenticatedRequest(superAdminToken, "mutate", updateWhatsappConfigurationMutationDocument, {
      input: buildConfigInput({ appId: "cfg-app-omitted" }, true),
    });

    const config = await readConfiguration(superAdminToken);
    expect(config.appId).toBe("cfg-app-omitted");
    expect(config.verifyToken).toBe("cfg-verify-token-1");
    expect(config.phoneNumberId).toBe("cfg-pn-1");
    expect(config.wabaId).toBe("cfg-waba-1");
    expect(config.esConfigId).toBe("cfg-es-1");
    expect(config.appSecret).not.toBeNull();
    expect(config.accessToken).not.toBeNull();
  });

  test("clears stored fields when the input passes explicit nulls", async () => {
    await authenticatedRequest(superAdminToken, "mutate", updateWhatsappConfigurationMutationDocument, {
      input: buildConfigInput({ appId: "cfg-app-final" }),
    });

    const config = await readConfiguration(superAdminToken);
    expect(config.source).toBe("db");
    expect(config.appId).toBe("cfg-app-final");
    expect(config.appSecret).toBeNull();
    expect(config.verifyToken).toBeNull();
    expect(config.phoneNumberId).toBeNull();
    expect(config.wabaId).toBeNull();
    expect(config.accessToken).toBeNull();
    expect(config.esConfigId).toBeNull();
  });
});
