import { describe, expect, test } from "bun:test";
import { NotificationChannel, NotificationEventType } from "../generated/gql/graphql-types";
import {
  notificationPreferencesQueryDocument,
  updateNotificationPreferencesMutationDocument,
} from "../sharedDocuments/notification-preferences.documents";
import { authenticatedRequest, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

describe("GraphQL Notification Preferences Integration Tests", () => {
  setupTestServerLifecycle();

  test("notificationPreferences — returns defaults for own user", async () => {
    const token = await loginDemoUser("teacher_default");

    const data = await authenticatedRequest(token, "query", notificationPreferencesQueryDocument);

    expect(Array.isArray(data.notificationPreferences)).toBe(true);
    expect(data.notificationPreferences?.length).toBe(32);
    expect(data.notificationPreferences?.[0]?.id).toBeDefined();
    expect(data.notificationPreferences?.every(pref => pref?.enabled)).toBe(true);
  });

  test("updateNotificationPreferences — own user can update a preference", async () => {
    const token = await loginDemoUser("teacher_default");

    const data = await authenticatedRequest(token, "mutate", updateNotificationPreferencesMutationDocument, {
      input: [
        {
          channel: NotificationChannel.Email,
          eventType: NotificationEventType.ClassReminder,
          enabled: false,
        },
      ],
    });

    const updated = data.updateNotificationPreferences?.find(
      pref => pref?.channel === NotificationChannel.Email && pref?.eventType === NotificationEventType.ClassReminder
    );

    expect(updated?.enabled).toBe(false);
  });

  test("notificationPreferences — denied when unauthenticated", async () => {
    const result = await testClient.query({
      query: notificationPreferencesQueryDocument,
    });

    expect(result.error).toBeDefined();
  });
});
