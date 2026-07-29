import { AppPermission, NotificationEventType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { classHref, ownProfileHref, studentProfileTabHref } from "@/frontend/common/utils/profileHref";
import type { NotificationMetadata } from "@/frontend/common/views/dashboard/components/navbar/notifications/types/notificationDrawer.types";

function isParentViewer(permissions: readonly AppPermission[]): boolean {
  return (
    permissions.includes(AppPermission.ScheduleViewFamily) && !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}

function isAdminViewer(permissions: readonly AppPermission[]): boolean {
  // Supervisors get complaints.list for triage but are not admin portal users.
  return permissions.includes(AppPermission.DashboardViewMetrics);
}

/** Match student portal detection in navigationConfig — students may hold session/history perms. */
function isStudentViewer(permissions: readonly AppPermission[]): boolean {
  return (
    permissions.includes(AppPermission.StudentViewOwnDashboard) &&
    !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}

function canManageComplaints(permissions: readonly AppPermission[]): boolean {
  return (
    isAdminViewer(permissions) ||
    permissions.includes(AppPermission.ComplaintsRespond) ||
    permissions.includes(AppPermission.ComplaintsList)
  );
}

/**
 * Resolves the drawer "View" deep-link for a notification entity.
 * Student class notifications must not use admin-only `/classes/{id}` paths.
 */
export function resolveNotificationDeepLink(
  metadata: NotificationMetadata,
  permissions: readonly AppPermission[],
  eventType?: NotificationEventType | null
): string {
  switch (metadata.entityKind) {
    case "invoice": {
      return isParentViewer(permissions) ? "/billing/invoices" : "/billing";
    }
    case "class": {
      if (isStudentViewer(permissions)) {
        return "/students/sessions";
      }
      return classHref(metadata.classInstanceId ?? metadata.entityId);
    }
    case "student": {
      const tab = eventType === NotificationEventType.StudentQuotaOverridden ? "quota" : "status";
      return studentProfileTabHref(metadata.entityId, tab);
    }
    case "complaint": {
      return canManageComplaints(permissions) ? "/complaints/manage" : "/complaints";
    }
    case "suggestion": {
      return "/suggestions";
    }
    case "paymentMethod": {
      return ownProfileHref();
    }
    case "schedule": {
      return "/schedule";
    }
    case "lessonReport": {
      return "/lesson-reports";
    }
    default: {
      return "/";
    }
  }
}
