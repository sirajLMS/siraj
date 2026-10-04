"use client";

import { Stack } from "@mui/material";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import {
  PackagePlanArchiveSectionShared,
  PackagePlanArchiveTriggerButton,
} from "@/frontend/common/views/dashboard/accounting/components/__shared__/packagePlanArchiveDialogShared";
import type { UsePackagePlanFormViewModel } from "@/frontend/common/views/dashboard/accounting/usePackagePlanFormViewModel";
import { DesktopFormErrorSnackbar } from "@/frontend/desktop/components/ui";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import {
  PackagePlanFormActions,
  PackagePlanFormLoadingState,
  PackagePlanIdentitySection,
  PackagePlanPricingSection,
} from "@/frontend/desktop/views/dashboard/accounting/PackagePlanFormView.desktop.parts";

export function PackagePlanFormDesktop(props: Readonly<UsePackagePlanFormViewModel>) {
  const {
    t,
    control,
    errors,
    handleSubmit,
    isSubmitting,
    isEditing,
    loadingExisting,
    showSuccess,
    submitError,
    existing,
    onSubmit,
    onArchive,
    archiveDialogOpen,
    setArchiveDialogOpen,
    archiving,
    onDismissSuccess,
    onDismissError,
  } = props;

  if (isEditing && loadingExisting) {
    return <PackagePlanFormLoadingState />;
  }

  const title = isEditing ? t.editTitle : t.createTitle;

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={title}
        subtitle={t.pageSubtitle}
        breadcrumbs={[
          { label: t.pageTitle, href: "/accounting/packages" },
          { label: title, current: true },
        ]}
        actions={
          isEditing ? (
            <PackagePlanArchiveTriggerButton
              archiving={archiving}
              planActive={existing?.active ?? true}
              onOpen={() => setArchiveDialogOpen(true)}
              label={t.archiveConfirm}
            />
          ) : undefined
        }
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        style={{ maxWidth: 1140, width: "100%", marginInline: "auto" }}
      >
        <Stack spacing={3}>
          <PackagePlanIdentitySection t={t} control={control} errors={errors} isEditing={isEditing} />
          <PackagePlanPricingSection t={t} control={control} errors={errors} />
          <PackagePlanFormActions t={t} isSubmitting={isSubmitting} />
        </Stack>
      </form>

      <PackagePlanArchiveSectionShared
        t={t}
        existing={existing}
        archiveDialogOpen={archiveDialogOpen}
        setArchiveDialogOpen={setArchiveDialogOpen}
        onArchive={onArchive}
        archiving={archiving}
      />

      <FormSuccessSnackbar open={showSuccess} message={t.saveSuccess} onClose={onDismissSuccess} />
      <DesktopFormErrorSnackbar open={Boolean(submitError)} message={submitError ?? ""} onClose={onDismissError} />
    </DesktopPageContainer>
  );
}
