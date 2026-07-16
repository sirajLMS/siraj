"use client";

import type { TypographyProps } from "@mui/material/Typography";
import type { ReactNode } from "react";
import {
  type PageHeaderBreadcrumb,
  PageHeaderCore,
  type PageHeaderCoreProps,
} from "@/frontend/common/components/ui/container/page/pageHeaderCore.base";

export type { PageHeaderBreadcrumb };

export interface DesktopPageHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly titleVariant?: TypographyProps["variant"];
  readonly breadcrumbs?: readonly PageHeaderBreadcrumb[];
  readonly actions?: ReactNode;
}

export function DesktopPageHeader({
  title,
  subtitle,
  titleVariant = "headlineLg",
  breadcrumbs,
  actions,
}: DesktopPageHeaderProps) {
  return (
    <PageHeaderCore
      title={title}
      subtitle={subtitle}
      titleVariant={titleVariant}
      breadcrumbs={breadcrumbs}
      actions={actions}
    />
  );
}

// Ensure tier-paired core props type stays linked for future desktop-specific differentiation.
export type DesktopPageHeaderCoreProps = PageHeaderCoreProps;
