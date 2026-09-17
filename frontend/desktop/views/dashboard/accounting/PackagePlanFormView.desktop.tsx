"use client";

import { SaveOutlined, SyncOutlined } from "@mui/icons-material";
import { Box, CircularProgress, FormHelperText, Stack } from "@mui/material";
import Link from "next/link";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import {
  PackagePlanArchiveSectionShared,
  PackagePlanArchiveTriggerButton,
} from "@/frontend/common/views/dashboard/accounting/components/__shared__/packagePlanArchiveDialogShared";
import {
  PackagePlanActiveField,
  PackagePlanCodenameField,
  PackagePlanCreditHoursField,
  PackagePlanCurrencyField,
  PackagePlanDescriptionField,
  PackagePlanDisplayNameField,
  PackagePlanPriceAmountField,
  PackagePlanSortOrderField,
  PackagePlanValidityMonthsField,
} from "@/frontend/common/views/dashboard/accounting/components/__shared__/packagePlanFormFieldsShared";
import { DESKTOP_PACKAGE_PLAN_FORM_STYLES } from "@/frontend/common/views/dashboard/accounting/components/__shared__/packagePlanFormFieldsShared.options";
import type { UsePackagePlanFormViewModel } from "@/frontend/common/views/dashboard/accounting/usePackagePlanFormViewModel";
import { DesktopFormErrorSnackbar } from "@/frontend/desktop/components/ui";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container/DesktopSectionPanel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

const styles = DESKTOP_PACKAGE_PLAN_FORM_STYLES;

const spinIcon = (
  <SyncOutlined
    sx={{ animation: "spin 1s linear infinite", "@keyframes spin": { to: { transform: "rotate(360deg)" } } }}
  />
);

function PackagePlanFormLoadingState() {
  return (
    <DesktopPageContainer>
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress size={36} />
      </Box>
    </DesktopPageContainer>
  );
}

type IdentitySectionProps = Pick<UsePackagePlanFormViewModel, "t" | "control" | "errors" | "isEditing">;

function PackagePlanIdentitySection({ t, control, errors, isEditing }: Readonly<IdentitySectionProps>) {
  return (
    <DesktopSectionPanel title={t.form.displayName}>
      <Stack spacing={3}>
        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 2 }}>
          <PackagePlanCodenameField
            control={control}
            errors={errors}
            labels={t.form}
            isEditing={isEditing}
            sx={styles.codenameField}
            inputSx={styles.codenameInput}
          />
          <PackagePlanDisplayNameField control={control} errors={errors} labels={t.form} sx={styles.displayNameField} />
        </Stack>
        <PackagePlanDescriptionField control={control} labels={t.form} sx={styles.descriptionField} />
      </Stack>
    </DesktopSectionPanel>
  );
}

type PricingSectionProps = Pick<UsePackagePlanFormViewModel, "t" | "control" | "errors">;

function PackagePlanPricingSection({ t, control, errors }: Readonly<PricingSectionProps>) {
  return (
    <DesktopSectionPanel title={t.columns.price}>
      <Stack spacing={3}>
        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 2 }}>
          <PackagePlanCreditHoursField control={control} errors={errors} labels={t.form} sx={styles.numericField} />
          <PackagePlanPriceAmountField control={control} errors={errors} labels={t.form} sx={styles.numericField} />
          <PackagePlanCurrencyField control={control} labels={t.form} sx={styles.currencyField} />
        </Stack>

        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 2, alignItems: "center" }}>
          <PackagePlanSortOrderField control={control} errors={errors} labels={t.form} sx={styles.sortOrderField} />
          <PackagePlanValidityMonthsField control={control} errors={errors} labels={t.form} sx={styles.validityStack} />
          <Box sx={{ display: "flex", alignItems: "center", alignSelf: "stretch" }}>
            <PackagePlanActiveField control={control} labels={t.form} />
          </Box>
        </Stack>
        {errors.active ? <FormHelperText error>{errors.active.message}</FormHelperText> : null}
      </Stack>
    </DesktopSectionPanel>
  );
}

type FormActionsProps = Pick<UsePackagePlanFormViewModel, "t" | "isSubmitting">;

function PackagePlanFormActions({ t, isSubmitting }: Readonly<FormActionsProps>) {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
      <Link href="/accounting/packages" style={{ textDecoration: "none" }}>
        <DesktopPrimaryPageAction variant="text" color="inherit" disabled={isSubmitting}>
          {t.form.cancel}
        </DesktopPrimaryPageAction>
      </Link>
      <DesktopPrimaryPageAction
        type="submit"
        disabled={isSubmitting}
        startIcon={isSubmitting ? spinIcon : <SaveOutlined />}
      >
        {isSubmitting ? t.form.saving : t.form.submit}
      </DesktopPrimaryPageAction>
    </Stack>
  );
}

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
