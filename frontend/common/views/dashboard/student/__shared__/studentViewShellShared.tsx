"use client";

import { Typography } from "@mui/material";
import type { ReactNode } from "react";
import {
  MonthNavigator,
  type MonthNavigatorLabels,
} from "@/frontend/common/views/dashboard/student/__shared__/MonthNavigator";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { MobileContentStack, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

export interface StudentViewShellSharedProps {
  readonly variant: "desktop" | "mobile";
  readonly pageTitle: string;
  readonly loading: boolean;
  readonly loadingMessage: string;
  readonly monthLabel: string;
  readonly canGoNext: boolean;
  readonly monthNavigatorLabels: MonthNavigatorLabels;
  readonly onPrevMonth: () => void;
  readonly onNextMonth: () => void;
  readonly children: ReactNode;
}

export function StudentViewShellShared({
  variant,
  pageTitle,
  loading,
  loadingMessage,
  monthLabel,
  canGoNext,
  monthNavigatorLabels,
  onPrevMonth,
  onNextMonth,
  children,
}: Readonly<StudentViewShellSharedProps>) {
  if (loading) {
    const LoadingContainer = variant === "desktop" ? DesktopPageContainer : MobilePageContainer;
    return (
      <LoadingContainer>
        <Typography variant="bodyMd" sx={{ p: 3 }}>
          {loadingMessage}
        </Typography>
      </LoadingContainer>
    );
  }

  if (variant === "desktop") {
    return (
      <DesktopPageContainer>
        <DesktopPageHeader title={pageTitle} />
        <MonthNavigator
          monthLabel={monthLabel}
          canGoNext={canGoNext}
          labels={monthNavigatorLabels}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
          outerSx={{ mb: 2, gap: 2 }}
          innerGap={1}
          iconFontSize={20}
        />
        {children}
      </DesktopPageContainer>
    );
  }

  return (
    <MobilePageContainer>
      <MobileContentStack>
        <MobilePageHeader title={pageTitle} titleVariant="headlineMd" />
        <MonthNavigator
          monthLabel={monthLabel}
          canGoNext={canGoNext}
          labels={monthNavigatorLabels}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
        />
        {children}
      </MobileContentStack>
    </MobilePageContainer>
  );
}
