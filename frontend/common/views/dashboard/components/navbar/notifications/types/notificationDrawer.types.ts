import type { NotificationChannel, NotificationEventType } from "@/frontend/common/graphql/generated/gql/graphql";
import type { NotificationsLabels } from "@/shared/locale/types/notifications";
import type { NotificationMetadata } from "@/shared/types/notification-alerts.types";

/** Alert row shape for the drawer (mirrors SystemAlert selection). */
export interface NotificationDrawerAlert {
  readonly id: string | null;
  readonly deliveryId: string | null;
  readonly type: string | null;
  readonly eventType: NotificationEventType | null;
  readonly channel: NotificationChannel | null;
  readonly metadata: NotificationMetadata | null;
  readonly title: string | null;
  readonly body: string | null;
  readonly createdAt: string | null;
  readonly severity: string | null;
  readonly readAt: string | null;
}

export interface NotificationsDrawerViewModel {
  readonly labels: NotificationsLabels;
  /** Dashboard core-notifications copy — migrated in Phase 2. */
  readonly errorLoadingMessage: string;
  readonly alerts: readonly NotificationDrawerAlert[];
  readonly unreadCount: number;
  readonly totalCount: number;
  readonly loading: boolean;
  readonly error: Error | undefined;
  readonly drawerOpen: boolean;
  readonly openDrawer: () => void;
  readonly closeDrawer: () => void;
  readonly markOneRead: (deliveryId: string) => Promise<void>;
  readonly markAllRead: () => Promise<void>;
  readonly handleViewEntity: (metadata: NotificationMetadata, eventType?: NotificationEventType | null) => void;
  readonly handleReschedule: (classInstanceId: string) => void;
  readonly handleApproveInvoice: (deliveryId: string, invoiceId: string) => Promise<void>;
  readonly handleRejectInvoice: (deliveryId: string, invoiceId: string) => Promise<void>;
  readonly handleManagePreferences: () => void;
}

export interface NotificationDrawerProps {
  readonly vm: NotificationsDrawerViewModel;
}
