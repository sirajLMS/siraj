import { describe, expect, test } from "bun:test";
import { NotificationChannel, NotificationEventType } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  notificationPreferencesQueryDocument,
  updateNotificationPreferencesMutationDocument,
} from "@/frontend/graphql/sharedDocuments";
import { authenticatedRequest, loginDemoUser } from "@/frontend/graphql/test/helpers";
import { setupTestServerLifecycle } from "@/frontend/graphql/test/lifecycle";
import { clearCookies, testClient } from "@/frontend/graphql/test/testClient";

describe("GraphQL Notification Preferences Integration Tests", () => {
  setupTestServerLifecycle();

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

  test("notificationPreferences — returns defaults for own user", async () => {
    // Re-enable the preference that was disabled in the previous test
    const token = await loginDemoUser("teacher_default");
    await authenticatedRequest(token, "mutate", updateNotificationPreferencesMutationDocument, {
      input: [
        {
          channel: NotificationChannel.Email,
          eventType: NotificationEventType.ClassReminder,
          enabled: true,
        },
      ],
    });

    const data = await authenticatedRequest(token, "query", notificationPreferencesQueryDocument);

    expect(Array.isArray(data.notificationPreferences)).toBe(true);
    expect(data.notificationPreferences?.length).toBe(32);
    expect(data.notificationPreferences?.[0]?.id).toBeDefined();
    expect(data.notificationPreferences?.every(pref => pref?.enabled)).toBe(true);
  });

  test("notificationPreferences — denied when unauthenticated", async () => {
    clearCookies();
    const result = await testClient.query({
      query: notificationPreferencesQueryDocument,
    });

    expect(result.error).toBeDefined();
  });
});
