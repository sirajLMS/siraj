import type { ReactNode } from "react";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";

// NEW FOR PLAN v5: shared PageHeaderBreadcrumb + BasePageHeaderProps lifted from Mobile/Desktop twins.
export interface PageHeaderBreadcrumb {
  readonly label: string;
  readonly href?: string;
  readonly current?: boolean;
}

export interface BasePageHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly titleVariant?: UiTypographyVariant;
  readonly breadcrumbs?: readonly PageHeaderBreadcrumb[];
  readonly actions?: ReactNode;
}
