import { describe, expect, test } from "bun:test";
import { NotificationChannel, NotificationEventType } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  notificationPreferencesQueryDocument,
  updateNotificationPreferencesMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import {
  authenticatedRequest,
  clearCookies,
  loginDemoUser,
  setupTestServerLifecycle,
  testClient,
} from "@/test/helpers";

/** Full matrix: every channel × every event type (teacher allowlist is ALL). */
const EXPECTED_DEFAULT_PREF_COUNT =
  Object.values(NotificationChannel).length * Object.values(NotificationEventType).length;

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
    const prefs = data.notificationPreferences;

    expect(Array.isArray(prefs)).toBe(true);
    expect(prefs?.length).toBe(EXPECTED_DEFAULT_PREF_COUNT);
    expect(prefs?.[0]?.id).toBeDefined();

    // Non-WhatsApp channels default enabled; WhatsApp is opt-in (REQ-10.1).
    expect(prefs?.filter(pref => pref?.channel !== NotificationChannel.Whatsapp).every(pref => pref?.enabled)).toBe(
      true
    );
    expect(
      prefs?.filter(pref => pref?.channel === NotificationChannel.Whatsapp).every(pref => pref?.enabled === false)
    ).toBe(true);
  });

  test("notificationPreferences — denied when unauthenticated", async () => {
    clearCookies();
    const result = await testClient.query({
      query: notificationPreferencesQueryDocument,
    });

    expect(result.error).toBeDefined();
  });
});
