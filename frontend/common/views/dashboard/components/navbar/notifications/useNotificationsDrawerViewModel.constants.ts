import { meQueryDocument } from "@/frontend/common/graphql/sharedDocuments/auth/auth.documents";
import { notificationAlertsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/notifications/notification-alerts.documents";

/** Queries refetched after every drawer mutation so alerts and unread badges stay in sync. */
export const REFETCH_QUERIES = [{ query: notificationAlertsQueryDocument }, { query: meQueryDocument }] as const;
