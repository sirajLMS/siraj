import { NotificationPreferencesRepository } from "@/backend/db/repo/notifications/notification-preferences.repository";
import { AppPermission, NotificationChannel, NotificationEventType } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  NotificationPreferenceReturnType,
  NotificationPreferenceUpdateInput,
} from "@/backend/types/notifications/notification-preferences.types";
import type { UserNotificationPreferenceSelectType } from "@/backend/types/users/userNotificationPreferences.types";

const ALL_CHANNELS = Object.values(NotificationChannel);
const ALL_EVENT_TYPES = Object.values(NotificationEventType);

function preferenceKey(channel: NotificationChannel, eventType: NotificationEventType): string {
  return `${channel}:${eventType}`;
}

function mergeWithDefaults(stored: UserNotificationPreferenceSelectType[]): NotificationPreferenceReturnType[] {
  const storedMap = new Map(
    stored.map(row => [preferenceKey(row.channel as NotificationChannel, row.eventType as NotificationEventType), row])
  );

  return ALL_CHANNELS.flatMap(channel =>
    ALL_EVENT_TYPES.map(eventType => {
      const existing = storedMap.get(preferenceKey(channel, eventType));

      if (existing) {
        return {
          id: existing.id,
          channel,
          eventType,
          enabled: existing.enabled,
        };
      }

      return {
        id: preferenceKey(channel, eventType),
        channel,
        eventType,
        enabled: true,
      };
    })
  );
}

async function assertOwnProfileAccess(actorUserId: string, locale?: string): Promise<void> {
  const canView = await PermissionsService.hasPermission(actorUserId, AppPermission.AUTH_VIEW_OWN_PROFILE);
  if (!canView) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("unauthorizedAction"));
  }
}

export namespace NotificationPreferencesService {
  export async function getPreferences(
    actorUserId: string,
    locale?: string
  ): Promise<NotificationPreferenceReturnType[]> {
    await assertOwnProfileAccess(actorUserId, locale);

    const stored = await NotificationPreferencesRepository.getByUserId(actorUserId);
    return mergeWithDefaults(stored);
  }

  export async function updatePreferences(
    actorUserId: string,
    input: NotificationPreferenceUpdateInput[],
    locale?: string
  ): Promise<NotificationPreferenceReturnType[]> {
    await assertOwnProfileAccess(actorUserId, locale);

    await NotificationPreferencesRepository.batchUpsert(actorUserId, input);

    const stored = await NotificationPreferencesRepository.getByUserId(actorUserId);
    return mergeWithDefaults(stored);
  }
}
