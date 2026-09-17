"use client";

import { SaveOutlined, SyncOutlined } from "@mui/icons-material";
import { Box, Button, CircularProgress, Stack } from "@mui/material";
import { useRouter } from "next/navigation";
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
import { MOBILE_PACKAGE_PLAN_FORM_STYLES } from "@/frontend/common/views/dashboard/accounting/components/__shared__/packagePlanFormFieldsShared.options";
import type { UsePackagePlanFormViewModel } from "@/frontend/common/views/dashboard/accounting/usePackagePlanFormViewModel";
import {
  MobileContentInset,
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";

const styles = MOBILE_PACKAGE_PLAN_FORM_STYLES;

export function PackagePlanFormMobile(props: Readonly<UsePackagePlanFormViewModel>) {
  const {
    t,
    control,
    errors,
    handleSubmit,
    isSubmitting,
    isEditing,
    loadingExisting,
    showSuccess,
    existing,
    onSubmit,
    onArchive,
    archiveDialogOpen,
    setArchiveDialogOpen,
    archiving,
    onDismissSuccess,
  } = props;
  const router = useRouter();

  if (isEditing && loadingExisting) {
    return (
      <MobilePageContainer>
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress size={32} />
        </Box>
      </MobilePageContainer>
    );
  }

  const title = isEditing ? t.editTitle : t.createTitle;

  return (
    <MobilePageContainer>
      <MobilePageHeader title={title} subtitle={t.pageSubtitle} />

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <MobileContentInset>
          <MobileContentStack gap={2.5} paddingBottom={6}>
            <PackagePlanCodenameField control={control} errors={errors} labels={t.form} isEditing={isEditing} />

            <PackagePlanDisplayNameField control={control} errors={errors} labels={t.form} />

            <PackagePlanDescriptionField control={control} labels={t.form} />

            <Stack direction="row" spacing={1.5}>
              <PackagePlanCreditHoursField control={control} errors={errors} labels={t.form} sx={styles.numericField} />
              <PackagePlanPriceAmountField control={control} errors={errors} labels={t.form} sx={styles.numericField} />
            </Stack>

            <Stack direction="row" spacing={1.5}>
              <PackagePlanCurrencyField control={control} labels={t.form} sx={styles.currencyField} />
              <PackagePlanSortOrderField control={control} errors={errors} labels={t.form} sx={styles.sortOrderField} />
            </Stack>

            <PackagePlanValidityMonthsField
              control={control}
              errors={errors}
              labels={t.form}
              sx={styles.validityStack}
            />

            <PackagePlanActiveField control={control} labels={t.form} />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <SyncOutlined /> : <SaveOutlined />}
            >
              {isSubmitting ? t.form.saving : t.form.submit}
            </Button>

            {isEditing ? (
              <PackagePlanArchiveTriggerButton
                archiving={archiving}
                planActive={existing?.active ?? true}
                onOpen={() => setArchiveDialogOpen(true)}
                label={t.archiveConfirm}
              />
            ) : null}

            <Button variant="text" onClick={() => router.push("/accounting/packages")} disabled={isSubmitting}>
              {t.form.cancel}
            </Button>
          </MobileContentStack>
        </MobileContentInset>
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
    </MobilePageContainer>
  );
}
