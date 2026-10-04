"use client";

import { FormBody } from "@/frontend/common/views/dashboard/admin/meeting-providers/form/__shared__/meetingProviderFormShared.body";
import { FormLoadingState } from "@/frontend/common/views/dashboard/admin/meeting-providers/form/__shared__/meetingProviderFormShared.loading";
import type { MeetingProviderFormSharedProps } from "@/frontend/common/views/dashboard/admin/meeting-providers/form/__shared__/meetingProviderFormShared.types";

export type { MeetingProviderFormSharedProps } from "@/frontend/common/views/dashboard/admin/meeting-providers/form/__shared__/meetingProviderFormShared.types";

export function MeetingProviderFormShared({
  mode,
  t,
  control,
  errors,
  watch,
  isSaving,
  isLoadingProvider,
  errorMsg,
  isUrlExampleValid,
  onSubmit,
  onCancel,
  slots,
  styles,
  BackAction,
}: Readonly<MeetingProviderFormSharedProps>) {
  const isEdit = mode === "edit";
  const title = isEdit ? t.editTitle : t.createTitle;
  const slugValue = watch("slug");
  const isActiveValue = watch("isActive");
  const urlAllowlistValue = watch("urlAllowlist") ?? [];

  if (isLoadingProvider) {
    return <FormLoadingState title={title} pageSubtitle={t.pageSubtitle} slots={slots} styles={styles} />;
  }

  const { PageContainer, PageHeader } = slots;

  return (
    <PageContainer>
      <PageHeader title={title} subtitle={t.pageSubtitle} actions={BackAction} />
      <FormBody
        t={t}
        control={control}
        errors={errors}
        watch={watch}
        isSaving={isSaving}
        errorMsg={errorMsg}
        isUrlExampleValid={isUrlExampleValid}
        onSubmit={onSubmit}
        onCancel={onCancel}
        slots={slots}
        styles={styles}
        isEdit={isEdit}
        slugValue={slugValue}
        isActiveValue={isActiveValue}
        urlAllowlistValue={urlAllowlistValue}
      />
    </PageContainer>
  );
}
