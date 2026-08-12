import type { ReactNode } from "react";
import { MissedClassAlertBannerContent } from "@/frontend/common/views/dashboard/teachers/dashboard/components/__shared__/missedClassAlertBannerShared";

/**
 * Server-rendered static content of the missed-class alert banner.
 *
 * Delegates the Alert/Box/Typography rendering to the shared
 * {@link MissedClassAlertBannerContent} presentational component.
 *
 * Pure presentational Server Component (no `"use client"`): receives
 * pre-resolved `title`/`description` strings. The interactive dismiss
 * action is isolated in a tiny client island (`DismissAlertButtonDesktop`)
 * which the parent passes in via the `dismissButton` prop as a `ReactNode`.
 */

interface MissedClassAlertBannerContentDesktopProps {
  readonly title: string;
  readonly description: string;
  readonly fixed?: boolean;
  readonly dismissButton?: ReactNode;
}

export function MissedClassAlertBannerContentDesktop({
  title,
  description,
  fixed = false,
  dismissButton,
}: Readonly<MissedClassAlertBannerContentDesktopProps>) {
  return <MissedClassAlertBannerContent title={title} description={description} fixed={fixed} action={dismissButton} />;
}
