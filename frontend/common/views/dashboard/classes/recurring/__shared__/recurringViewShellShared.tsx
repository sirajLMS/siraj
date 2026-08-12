"use client";

import type { ReactNode } from "react";
import { ErrorState, LoadingState } from "@/frontend/common/components/ui";
import {
  DesktopPageContainer,
  DesktopPageHeader,
  type PageHeaderBreadcrumb,
} from "@/frontend/desktop/components/ui/container/page";
import { MobilePageContainer } from "@/frontend/mobile/components/ui/container/page/MobilePageContainer";
import {
  MobilePageHeader,
  type MobilePageHeaderBreadcrumb,
} from "@/frontend/mobile/components/ui/container/page/MobilePageHeader";

export interface RecurringViewShellSharedProps {
  readonly loading: boolean;
  readonly error: string | null;
  readonly invalidIdMessage: string | null;
  readonly onRetry: () => void;
  readonly pageTitle: string;
  readonly subtitle: string;
  readonly children: ReactNode;
  readonly variant: "desktop" | "mobile";
  readonly desktopBreadcrumbs?: readonly PageHeaderBreadcrumb[];
  readonly mobileBreadcrumbs?: readonly MobilePageHeaderBreadcrumb[];
}

export function RecurringViewShellShared({
  loading,
  error,
  invalidIdMessage,
  onRetry,
  pageTitle,
  subtitle,
  desktopBreadcrumbs,
  mobileBreadcrumbs,
  children,
  variant,
}: Readonly<RecurringViewShellSharedProps>) {
  if (variant === "desktop") {
    if (invalidIdMessage) {
      return (
        <DesktopPageContainer>
          <ErrorState embedded message={invalidIdMessage} retryLabel="" onRetry={onRetry} />
        </DesktopPageContainer>
      );
    }
    if (loading) {
      return <LoadingState />;
    }
    if (error) {
      return (
        <DesktopPageContainer>
          <ErrorState embedded message={error} retryLabel="Retry" onRetry={onRetry} />
        </DesktopPageContainer>
      );
    }
    return (
      <DesktopPageContainer>
        <DesktopPageHeader title={pageTitle} subtitle={subtitle} breadcrumbs={desktopBreadcrumbs} />
        {children}
      </DesktopPageContainer>
    );
  }

  if (invalidIdMessage) {
    return (
      <MobilePageContainer>
        <MobilePageHeader title={pageTitle} edgeToEdge={false} />
        <ErrorState embedded message={invalidIdMessage} retryLabel="" onRetry={onRetry} />
      </MobilePageContainer>
    );
  }
  if (loading) {
    return <LoadingState />;
  }
  if (error) {
    return (
      <MobilePageContainer>
        <MobilePageHeader title={pageTitle} edgeToEdge={false} />
        <ErrorState embedded message={error} retryLabel="Retry" onRetry={onRetry} />
      </MobilePageContainer>
    );
  }
  return (
    <MobilePageContainer>
      <MobilePageHeader title={pageTitle} subtitle={subtitle} breadcrumbs={mobileBreadcrumbs} edgeToEdge={false} />
      {children}
    </MobilePageContainer>
  );
}
