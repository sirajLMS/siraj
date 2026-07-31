import type { NotificationChannel, NotificationEventType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import type { ProfileNotificationsLabels } from "@/shared/locale/types/profile";

export type NotificationPrefRow = NonNullable<
  Operations.NotificationPreferencesQuery["notificationPreferences"]
>[number];

export interface PreferenceMatrixRow {
  readonly id: string;
  readonly eventType: NotificationEventType;
  readonly enabledMap: Record<string, boolean>;
}

export interface NotificationPreferencesTabVariantProps {
  readonly labels: ProfileNotificationsLabels;
  readonly preferences: readonly NotificationPrefRow[];
  readonly onToggle: (channel: NotificationChannel, eventType: NotificationEventType, enabled: boolean) => void;
  readonly disabled: boolean;
  readonly loading: boolean;
  readonly snackbarOpen: boolean;
  readonly snackbarMessage: string;
  readonly snackbarSeverity: "success" | "error";
  readonly onSnackbarClose: () => void;
  readonly errorLoading: boolean;
  readonly activeChannel?: NotificationChannel;
  readonly slideDirection?: "left" | "right";
  readonly onChannelChange?: (channel: NotificationChannel, slideDirection: "left" | "right") => void;
  readonly preferenceMap?: ReadonlyMap<string, NotificationPrefRow>;
  readonly matrixRows?: readonly PreferenceMatrixRow[];
  readonly eventTypes?: readonly NotificationEventType[];
}
