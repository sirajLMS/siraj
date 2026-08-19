import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { AppPermission, UserRole } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { NotificationAlertsService } from "@/backend/services/notification/notification-alerts.service";
import type { UserPermissionContext } from "@/backend/types";

/**
 * Unit tests for the context-aware overloads added in Phase A2.
 *
 * These tests verify that passing a pre-populated {@link UserPermissionContext}
 * avoids calling `PermissionsService.getUserContext(userId)` (which triggers
 * 3 DB queries) and instead gates the alert feed using the context's
 * `permissions` array and `isSuperAdmin` flag.
 *
 * The "no permission" / "empty context" cases return early without touching
 * the database, so we verify those purely. For the "has permission" cases we
 * spy on `PermissionsService.getUserContext` to assert it is NOT invoked —
 * that is the core performance guarantee of the context-aware overload.
 */

const TEST_USER_ID = "test-user-0001";
const TEST_DELIVERY_ID = "nd-0030";

function makeContext(overrides: Partial<UserPermissionContext> = {}): UserPermissionContext {
  return {
    permissions: overrides.permissions ?? [],
    permissionGroups: overrides.permissionGroups ?? [],
    isSuperAdmin: overrides.isSuperAdmin ?? false,
    role: overrides.role ?? UserRole.USER,
  };
}

const superAdminContext = (): UserPermissionContext =>
  makeContext({ isSuperAdmin: true, permissions: [], role: UserRole.SUPER_ADMIN });

const viewAlertsContext = (): UserPermissionContext =>
  makeContext({ permissions: [AppPermission.NOTIFICATION_VIEW_ALERTS] });

/**
 * Run `fn` and swallow any error — used when the function is expected to proceed
 * past the permission gate and throw on the un-mocked db. Returns the spy
 * assertion closure so the caller can verify `getUserContext` was not called.
 */
async function expectNoGetUserContextCall(spy: ReturnType<typeof spyOn>, fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
  } catch {
    // Expected — db is not mocked in this unit test
  }
  expect(spy).not.toHaveBeenCalled();
}

/**
 * Run `fn` and assert it throws (capturing the error for type assertion).
 */
async function expectThrows(spy: ReturnType<typeof spyOn>, fn: () => Promise<unknown>): Promise<void> {
  let caught: unknown;
  try {
    await fn();
  } catch (e) {
    caught = e;
  }
  expect(caught).toBeInstanceOf(Error);
  expect(spy).not.toHaveBeenCalled();
}

/**
 * Run `fn` via the legacy overload and assert `getUserContext` was called
 * exactly once with `TEST_USER_ID`.
 */
async function expectLegacyCallsGetUserContext(
  spy: ReturnType<typeof spyOn>,
  fn: () => Promise<unknown>
): Promise<void> {
  spy.mockResolvedValue(viewAlertsContext());
  try {
    await fn();
  } catch {
    // Expected — db is not mocked in this unit test
  }
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(TEST_USER_ID);
}

describe("NotificationAlertsService.getAlerts (UserPermissionContext overload)", () => {
  let spy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    spy = spyOn(PermissionsService, "getUserContext");
  });

  afterEach(() => {
    spy.mockRestore();
  });

  test("returns empty alerts when context lacks NOTIFICATION_VIEW_ALERTS", async () => {
    const result = await NotificationAlertsService.getAlerts(TEST_USER_ID, makeContext(), "en");

    expect(result.alerts).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.unreadCount).toBe(0);
    expect(result.id).toBe(`notification-alerts-${TEST_USER_ID}`);
  });

  test("returns empty alerts when permissions array is non-empty but lacks NOTIFICATION_VIEW_ALERTS", async () => {
    const context = makeContext({ permissions: [AppPermission.DASHBOARD_VIEW] });
    const result = await NotificationAlertsService.getAlerts(TEST_USER_ID, context, "en");

    expect(result.alerts).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  test("does NOT call getUserContext when context is passed (no-permission path)", async () => {
    await NotificationAlertsService.getAlerts(TEST_USER_ID, makeContext(), "en");
    expect(spy).not.toHaveBeenCalled();
  });

  test("context with NOTIFICATION_VIEW_ALERTS does not call getUserContext", async () => {
    await expectNoGetUserContextCall(spy, () =>
      NotificationAlertsService.getAlerts(TEST_USER_ID, viewAlertsContext(), "en")
    );
  });

  test("superadmin does not call getUserContext", async () => {
    await expectNoGetUserContextCall(spy, () =>
      NotificationAlertsService.getAlerts(TEST_USER_ID, superAdminContext(), "en")
    );
  });
});

describe("NotificationAlertsService.markAlertsRead (UserPermissionContext overload)", () => {
  let spy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    spy = spyOn(PermissionsService, "getUserContext");
  });

  afterEach(() => {
    spy.mockRestore();
  });

  test("throws when context lacks NOTIFICATION_VIEW_ALERTS", async () => {
    await expectThrows(spy, () => NotificationAlertsService.markAlertsRead(TEST_USER_ID, makeContext(), "en"));
  });

  test("does NOT call getUserContext when context is passed", async () => {
    await expectNoGetUserContextCall(spy, () =>
      NotificationAlertsService.markAlertsRead(TEST_USER_ID, viewAlertsContext(), "en")
    );
  });

  test("superadmin fast-path does not call getUserContext", async () => {
    await expectNoGetUserContextCall(spy, () =>
      NotificationAlertsService.markAlertsRead(TEST_USER_ID, superAdminContext(), "en")
    );
  });
});

describe("NotificationAlertsService.markOneAlertRead (UserPermissionContext overload)", () => {
  let spy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    spy = spyOn(PermissionsService, "getUserContext");
  });

  afterEach(() => {
    spy.mockRestore();
  });

  test("throws when context lacks NOTIFICATION_VIEW_ALERTS", async () => {
    await expectThrows(spy, () =>
      NotificationAlertsService.markOneAlertRead(TEST_USER_ID, makeContext(), TEST_DELIVERY_ID, "en")
    );
  });

  test("does NOT call getUserContext when context is passed", async () => {
    await expectNoGetUserContextCall(spy, () =>
      NotificationAlertsService.markOneAlertRead(TEST_USER_ID, viewAlertsContext(), TEST_DELIVERY_ID, "en")
    );
  });

  test("superadmin fast-path does not call getUserContext", async () => {
    await expectNoGetUserContextCall(spy, () =>
      NotificationAlertsService.markOneAlertRead(TEST_USER_ID, superAdminContext(), TEST_DELIVERY_ID, "en")
    );
  });
});

describe("NotificationAlertsService — legacy overload (backward compatibility)", () => {
  let spy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    spy = spyOn(PermissionsService, "getUserContext");
  });

  afterEach(() => {
    spy.mockRestore();
  });

  test("getAlerts(userId, locale) DOES call getUserContext", async () => {
    await expectLegacyCallsGetUserContext(spy, () => NotificationAlertsService.getAlerts(TEST_USER_ID, "en"));
  });

  test("markAlertsRead(userId, locale) DOES call getUserContext", async () => {
    await expectLegacyCallsGetUserContext(spy, () => NotificationAlertsService.markAlertsRead(TEST_USER_ID, "en"));
  });

  test("markOneAlertRead(userId, deliveryId, locale) DOES call getUserContext", async () => {
    await expectLegacyCallsGetUserContext(spy, () =>
      NotificationAlertsService.markOneAlertRead(TEST_USER_ID, TEST_DELIVERY_ID, "en")
    );
  });
});
