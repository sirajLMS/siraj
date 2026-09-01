import type { SxProps, Theme } from "@mui/material";
import type { ClassAuditViewProps } from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";

/** Breadcrumb entry shape shared by the desktop and mobile page-header components. */
export interface ClassAuditHeaderBreadcrumb {
  readonly label: string;
  readonly href?: string;
  readonly current?: boolean;
}

/** Builds the static breadcrumb trail shown on the class audit page in both tiers. */
export function buildClassAuditBreadcrumbs(
  labels: ClassAuditViewProps["labels"]
): readonly ClassAuditHeaderBreadcrumb[] {
  return [
    { label: labels.breadcrumbs.dashboard, href: "/dashboard" },
    { label: labels.breadcrumbs.schedules, href: "/schedule-search" },
    { label: labels.breadcrumbs.current, current: true },
  ];
}

/** Paper-background treatment for the outlined "generate report" filter button. */
export const classAuditGenerateReportButtonSx: SxProps<Theme> = theme => ({
  backgroundColor: theme.palette.background.paper,
  "&:hover": {
    backgroundColor: theme.palette.action.selected,
    borderColor: theme.palette.primary.dark,
  },
});
