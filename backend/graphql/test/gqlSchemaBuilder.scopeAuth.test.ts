import { describe, expect, type Mock, mock, test } from "bun:test";
import { AppPermission, UserRole } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { buildAuthScopes } from "@/backend/graphql/gqlSchemaBuilder";
import { getServerTranslations } from "@/shared/locale";

const TEST_PERMISSION = AppPermission.PERMISSION_GROUPS_MANAGE;
const OTHER_PERMISSION = AppPermission.STAFF_LIST;

type GetUserContextFn = (userId: string) => Promise<{ isSuperAdmin: boolean }>;

function makeBaseCtx(overrides: Partial<BaseContext> & { userId?: string } = {}): BaseContext {
  const { userId, ...rest } = overrides;
  const base: BaseContext = {
    user: userId ? { id: userId, displayCurrency: null } : { id: "user-1", displayCurrency: null },
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
  return { ...base, ...rest };
}

/** Creates a default no-op mock that resolves with `isSuperAdmin: false`. */
function noopGetUserContext(): Mock<GetUserContextFn> {
  return mock((_userId: string) => Promise.resolve({ isSuperAdmin: false }));
}

/** Creates a mock that resolves with the given `isSuperAdmin` value. */
function fakeGetUserContext(isSuperAdmin: boolean): Mock<GetUserContextFn> {
  return mock((_userId: string) => Promise.resolve({ isSuperAdmin }));
}

/** Builds scopes from overrides + a default no-op getUserContext mock. */
function makeScopes(overrides: Parameters<typeof makeBaseCtx>[0] = {}) {
  const getUserContext = noopGetUserContext();
  return { getUserContext, scopes: buildAuthScopes(makeBaseCtx(overrides), getUserContext) };
}

/** Builds scopes from overrides + a custom getUserContext mock. */
function makeScopesWithFake(overrides: Parameters<typeof makeBaseCtx>[0], isSuperAdmin: boolean) {
  const getUserContext = fakeGetUserContext(isSuperAdmin);
  return { getUserContext, scopes: buildAuthScopes(makeBaseCtx(overrides), getUserContext) };
}

describe("buildAuthScopes — permission scope", () => {
  test("superadmin short-circuit: true, no getUserContext", () => {
    const { getUserContext, scopes } = makeScopes({
      isSuperAdmin: true,
      permissions: [],
      role: UserRole.SUPER_ADMIN,
    });
    expect(scopes.permission(TEST_PERMISSION)).toBe(true);
    expect(getUserContext).toHaveBeenCalledTimes(0);
  });

  test("permission in ctx.permissions: true, no getUserContext", () => {
    const { getUserContext, scopes } = makeScopes({ permissions: [TEST_PERMISSION] });
    expect(scopes.permission(TEST_PERMISSION)).toBe(true);
    expect(getUserContext).toHaveBeenCalledTimes(0);
  });

  test("permission NOT in ctx.permissions: false, no getUserContext", () => {
    const { getUserContext, scopes } = makeScopes({ permissions: [OTHER_PERMISSION] });
    expect(scopes.permission(TEST_PERMISSION)).toBe(false);
    expect(getUserContext).toHaveBeenCalledTimes(0);
  });

  test("empty permissions, not superadmin: false", () => {
    const { getUserContext, scopes } = makeScopes({ permissions: [], isSuperAdmin: false });
    expect(scopes.permission(TEST_PERMISSION)).toBe(false);
    expect(getUserContext).toHaveBeenCalledTimes(0);
  });
});

describe("buildAuthScopes — loggedIn scope", () => {
  test("ctx.user defined: true, no getUserContext", () => {
    const { getUserContext, scopes } = makeScopes();
    expect(scopes.loggedIn).toBe(true);
    expect(getUserContext).toHaveBeenCalledTimes(0);
  });

  test("ctx.user undefined: false, no getUserContext", () => {
    const { getUserContext, scopes } = makeScopes({
      user: undefined,
      permissions: [],
      isSuperAdmin: false,
      role: UserRole.GUEST,
    });
    expect(scopes.loggedIn).toBe(false);
    expect(getUserContext).toHaveBeenCalledTimes(0);
  });
});

describe("buildAuthScopes — superAdmin scope (lazy)", () => {
  test("actor is same user, ctx.isSuperAdmin true: no getUserContext", async () => {
    const { getUserContext, scopes } = makeScopes({ isSuperAdmin: true, realUserId: undefined });
    expect(await scopes.superAdmin()).toBe(true);
    expect(getUserContext).toHaveBeenCalledTimes(0);
  });

  test("actor is same user, ctx.isSuperAdmin false: no getUserContext", async () => {
    const { getUserContext, scopes } = makeScopes({ isSuperAdmin: false, realUserId: "user-1" });
    expect(await scopes.superAdmin()).toBe(false);
    expect(getUserContext).toHaveBeenCalledTimes(0);
  });

  test("impersonating (realUserId differs): calls getUserContext with actor id", async () => {
    const { getUserContext, scopes } = makeScopesWithFake(
      { userId: "impersonated-user", isSuperAdmin: false, isImpersonating: true, realUserId: "admin-actor" },
      true
    );
    expect(await scopes.superAdmin()).toBe(true);
    expect(getUserContext).toHaveBeenCalledTimes(1);
    expect(getUserContext.mock.calls[0][0]).toBe("admin-actor");
  });

  test("impersonating, actor not superadmin: false", async () => {
    const { getUserContext, scopes } = makeScopesWithFake(
      { userId: "impersonated-user", isSuperAdmin: true, isImpersonating: true, realUserId: "staff-actor" },
      false
    );
    expect(await scopes.superAdmin()).toBe(false);
    expect(getUserContext).toHaveBeenCalledTimes(1);
    expect(getUserContext.mock.calls[0][0]).toBe("staff-actor");
  });

  test("actorUserId fallback: calls getUserContext with actorUserId", async () => {
    const { getUserContext, scopes } = makeScopesWithFake(
      { userId: "user-1", isSuperAdmin: false, actorUserId: "actor-user", realUserId: undefined },
      true
    );
    expect(await scopes.superAdmin()).toBe(true);
    expect(getUserContext).toHaveBeenCalledTimes(1);
    expect(getUserContext.mock.calls[0][0]).toBe("actor-user");
  });

  test("anonymous (no user, no actor): false, no getUserContext", async () => {
    const { getUserContext, scopes } = makeScopes({
      user: undefined,
      isSuperAdmin: false,
      realUserId: undefined,
      actorUserId: undefined,
      role: UserRole.GUEST,
    });
    expect(await scopes.superAdmin()).toBe(false);
    expect(getUserContext).toHaveBeenCalledTimes(0);
  });
});

describe("buildAuthScopes — notImpersonating scope", () => {
  test("not impersonating: true", () => {
    const { getUserContext, scopes } = makeScopes({ isImpersonating: false });
    expect(scopes.notImpersonating).toBe(true);
    expect(getUserContext).toHaveBeenCalledTimes(0);
  });

  test("impersonating: false", () => {
    const { getUserContext, scopes } = makeScopes({ isImpersonating: true });
    expect(scopes.notImpersonating).toBe(false);
    expect(getUserContext).toHaveBeenCalledTimes(0);
  });
});

describe("buildAuthScopes — notSimulatingGroup scope", () => {
  test("not simulating: true", () => {
    const { getUserContext, scopes } = makeScopes({ isSimulatingGroup: false });
    expect(scopes.notSimulatingGroup).toBe(true);
    expect(getUserContext).toHaveBeenCalledTimes(0);
  });

  test("simulating: false", () => {
    const { getUserContext, scopes } = makeScopes({
      isSimulatingGroup: true,
      simulatedGroupSlug: "SUPERVISOR_DEFAULT",
    });
    expect(scopes.notSimulatingGroup).toBe(false);
    expect(getUserContext).toHaveBeenCalledTimes(0);
  });
});
