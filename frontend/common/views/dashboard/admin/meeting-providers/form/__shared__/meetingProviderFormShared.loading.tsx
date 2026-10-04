"use client";

import { Skeleton, Stack } from "@mui/material";
import type {
  MeetingProviderFormSharedSlots,
  MeetingProviderFormSharedStyleProps,
} from "@/frontend/common/views/dashboard/admin/meeting-providers/form/__shared__/meetingProviderFormShared.types";

const LOADING_ROWS = [
  { id: "loading-row-one", height: 56 },
  { id: "loading-row-two", height: 56 },
] as const;

interface FormLoadingStateProps {
  readonly title: string;
  readonly pageSubtitle: string;
  readonly slots: MeetingProviderFormSharedSlots;
  readonly styles: MeetingProviderFormSharedStyleProps;
}

export function FormLoadingState({ title, pageSubtitle, slots, styles }: Readonly<FormLoadingStateProps>) {
  const { PageContainer, PageHeader } = slots;
  const { LoadingWrapper, loadingFirstHeight, loadingWrapperSx } = styles;

  return (
    <PageContainer>
      <PageHeader title={title} subtitle={pageSubtitle} />
      <LoadingWrapper>
        <Stack spacing={2} sx={loadingWrapperSx ?? {}}>
          <Skeleton variant="rectangular" height={loadingFirstHeight} />
          {LOADING_ROWS.map(row => (
            <Skeleton key={row.id} variant="rectangular" height={row.height} />
          ))}
        </Stack>
      </LoadingWrapper>
    </PageContainer>
  );
}
