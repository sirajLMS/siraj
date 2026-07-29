import { NotificationPreferencesRepository } from "@/backend/db/repo/notifications/notification-preferences.repository";
import { AppPermission, NotificationChannel, NotificationEventType, UserRole } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  NotificationPreferenceReturnType,
  NotificationPreferenceUpdateInput,
} from "@/backend/types/notifications/notification-preferences.types";
import type { UserNotificationPreferenceSelectType } from "@/backend/types/users/userNotificationPreferences.types";
import {
  type NotificationPreferenceRole,
  resolveNotificationEventAllowlist,
} from "@/shared/constants/notification-event-allowlists";
import { getServerTranslations } from "@/shared/locale";

const ALL_CHANNELS = Object.values(NotificationChannel);
const ALL_EVENT_TYPES = Object.values(NotificationEventType);

function preferenceKey(channel: NotificationChannel, eventType: NotificationEventType): string {
  return `${channel}:${eventType}`;
}

function resolvePreferenceRole(userRole: UserRole): NotificationPreferenceRole {
  switch (userRole) {
    case UserRole.STUDENT:
      return "student";
    case UserRole.SUPERVISOR:
      return "supervisor";
    case UserRole.PARENT:
      return "parent";
    case UserRole.TEACHER:
      return "teacher";
    case UserRole.STAFF:
      return "staff";
    case UserRole.SUPER_ADMIN:
    case UserRole.ACADEMY_ADMIN:
      return "admin";
    default:
      // USER / GUEST — preserve full staff-style matrix (no regression)
      return "staff";
  }
}

function eventTypesForRole(role: NotificationPreferenceRole): NotificationEventType[] {
  const allowlist = resolveNotificationEventAllowlist(role);
  if (allowlist === "ALL") {
    return ALL_EVENT_TYPES;
  }

  const allowed = new Set<string>(allowlist);
  return ALL_EVENT_TYPES.filter(eventType => allowed.has(eventType));
}

function mergeWithDefaults(
  stored: UserNotificationPreferenceSelectType[],
  eventTypes: readonly NotificationEventType[]
): NotificationPreferenceReturnType[] {
  const storedMap = new Map(
    stored.map(row => [preferenceKey(row.channel as NotificationChannel, row.eventType as NotificationEventType), row])
  );

  return ALL_CHANNELS.flatMap(channel =>
    eventTypes.map(eventType => {
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

function filterUpdatesToAllowlist(
  input: NotificationPreferenceUpdateInput[],
  eventTypes: readonly NotificationEventType[]
): NotificationPreferenceUpdateInput[] {
  const allowed = new Set<NotificationEventType>(eventTypes);
  return input.filter(row => allowed.has(row.eventType));
}

async function assertOwnProfileAccess(actorUserId: string, locale?: string): Promise<void> {
  const canView = await PermissionsService.hasAnyPermission(actorUserId, [
    AppPermission.PROFILE_CORE_IDENTITY_VIEW_OWN,
    AppPermission.STUDENT_IDENTITY_VIEW_OWN,
  ]);
  if (!canView) {
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new Error(tErrors.unauthorizedAction);
  }
}

async function resolveEventTypesForUser(userId: string): Promise<NotificationEventType[]> {
  const context = await PermissionsService.getUserContext(userId);
  return eventTypesForRole(resolvePreferenceRole(context.role));
}

export namespace NotificationPreferencesService {
  export async function getPreferences(
    actorUserId: string,
    locale?: string
  ): Promise<NotificationPreferenceReturnType[]> {
    await assertOwnProfileAccess(actorUserId, locale);

    const eventTypes = await resolveEventTypesForUser(actorUserId);
    const stored = await NotificationPreferencesRepository.getByUserId(actorUserId);
    return mergeWithDefaults(stored, eventTypes);
  }

  export async function updatePreferences(
    actorUserId: string,
    input: NotificationPreferenceUpdateInput[],
    locale?: string
  ): Promise<NotificationPreferenceReturnType[]> {
    await assertOwnProfileAccess(actorUserId, locale);

    const eventTypes = await resolveEventTypesForUser(actorUserId);
    const allowedInput = filterUpdatesToAllowlist(input, eventTypes);

    if (allowedInput.length > 0) {
      await NotificationPreferencesRepository.batchUpsert(actorUserId, allowedInput);
    }

    const stored = await NotificationPreferencesRepository.getByUserId(actorUserId);
    return mergeWithDefaults(stored, eventTypes);
  }

  // ─── Bootstrap / Seeder Operations (no auth) ──────────────────────────────

  export async function upsertManyPreferences(
    userId: string,
    inputs: NotificationPreferenceUpdateInput[]
  ): Promise<UserNotificationPreferenceSelectType[]> {
    return NotificationPreferencesRepository.batchUpsert(userId, inputs);
  }
}
