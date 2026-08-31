import { describe, expect, test } from "bun:test";
import { notificationAlertsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/notifications/notification-alerts.documents";
import {
  authenticatedRequest,
  clearCookies,
  loginDemoUser,
  loginSuperAdmin,
  setupTestServerLifecycle,
  testClient,
} from "@/test/helpers";

/**
 * Integration tests for the `notificationAlerts` GraphQL query.
 *
 * Phase A3: The resolver now constructs a `UserPermissionContext` from `ctx`
 * fields and passes it to `NotificationAlertsService.getAlerts`, bypassing the
 * 3-DB-query `PermissionsService.getUserContext(userId)` call. The unit test
 * in `backend/services/notification/test/notification-alerts.service.test.ts`
 * verifies that `getUserContext` is not called; this integration test verifies
 * the end-to-end query works correctly through the GraphQL API.
 */
describe("GraphQL notificationAlerts Integration Tests", () => {
  setupTestServerLifecycle();

  test("returns alert feed for authenticated user with permissions", async () => {
    const token = await loginSuperAdmin();

    const data = await authenticatedRequest(token, "query", notificationAlertsQueryDocument);
    const alerts = data.notificationAlerts;

    if (!alerts) throw new Error("Expected notificationAlerts to be defined");
    expect(alerts.id).toBeDefined();
    expect(typeof alerts.totalCount).toBe("number");
    expect(typeof alerts.unreadCount).toBe("number");
    expect(Array.isArray(alerts.alerts)).toBe(true);
  });

  test("returns alert feed for teacher role", async () => {
    const token = await loginDemoUser("teacher_default");

    const data = await authenticatedRequest(token, "query", notificationAlertsQueryDocument);
    const alerts = data.notificationAlerts;

    if (!alerts) throw new Error("Expected notificationAlerts to be defined");
    expect(alerts.id).toBeDefined();
    expect(typeof alerts.totalCount).toBe("number");
    expect(typeof alerts.unreadCount).toBe("number");
    expect(Array.isArray(alerts.alerts)).toBe(true);
  });

  test("denied when unauthenticated", async () => {
    clearCookies();
    const result = await testClient.query({
      query: notificationAlertsQueryDocument,
    });

    expect(result.error).toBeDefined();
    expect(result.data?.notificationAlerts).toBeFalsy();
  });

  test("returns alert feed for parent role", async () => {
    const token = await loginDemoUser("parent_default");

    const data = await authenticatedRequest(token, "query", notificationAlertsQueryDocument);
    const alerts = data.notificationAlerts;

    if (!alerts) throw new Error("Expected notificationAlerts to be defined");
    expect(alerts.id).toBeDefined();
    // parent_default holds notification.view_alerts (migration 20260829192949),
    // so the feed is served; exact rows depend on demo data.
    const rows = alerts.alerts ?? [];
    expect(Array.isArray(rows)).toBe(true);
    expect(alerts.totalCount).toBeGreaterThanOrEqual(rows.length);
  });
});
