"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { MobileCardList, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

export interface BillingMobileListShellSharedProps<T> {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly actions?: ReactNode;
  readonly rows: readonly T[];
  readonly loading?: boolean;
  readonly emptyMessage: string;
  readonly getKey: (row: T) => string;
  readonly renderItem: (row: T, index: number) => ReactNode;
  readonly footer?: ReactNode;
  readonly children?: ReactNode;
}

export function BillingMobileListShellShared<T>({
  pageTitle,
  pageSubtitle,
  actions,
  rows,
  loading,
  emptyMessage,
  getKey,
  renderItem,
  footer,
  children,
}: Readonly<BillingMobileListShellSharedProps<T>>) {
  return (
    <MobilePageContainer>
      <MobilePageHeader title={pageTitle} subtitle={pageSubtitle} edgeToEdge={false} actions={actions} />
      <Box sx={{ px: { xs: 2, md: 0 }, pb: 2 }}>
        <MobileCardList
          rows={rows}
          loading={loading}
          emptyMessage={emptyMessage}
          getKey={getKey}
          paginationOptions={{ mode: "client" }}
          layout="edge-to-edge"
          renderItem={renderItem}
        />
        {children}
        {footer}
      </Box>
    </MobilePageContainer>
  );
}
