"use client";

import { SyncOutlined } from "@mui/icons-material";
import { Box, Fade, Stack } from "@mui/material";
import { FormProvider } from "react-hook-form";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import { useQuotaFormShell } from "@/frontend/common/views/dashboard/billing/quota/useQuotaFormShell";
import type { UseQuotaFormViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaFormViewModel";
import { DesktopFormErrorSnackbar } from "@/frontend/desktop/components/ui";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { QuotaFormSectionDesktop } from "@/frontend/desktop/views/dashboard/billing/quota/components/QuotaFormSectionDesktop";

export function QuotaFormDesktopView(props: Readonly<UseQuotaFormViewModel>) {
  const {
    form,
    labels,
    isEditing,
    handleSubmit,
    onSubmit,
    isSubmitting,
    showSuccess,
    submitError,
    onDismissSuccess,
    onDismissError,
    control,
    errors,
  } = props;

  const { pageTitle, breadcrumbs, periodType, kind, canManage } = useQuotaFormShell(props);

  return (
    <Fade in timeout={300}>
      <div>
        <DesktopPageContainer>
          <DesktopPageHeader title={pageTitle} breadcrumbs={breadcrumbs} />
          <FormProvider {...form}>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ maxWidth: 600 }}>
              <Stack spacing={3}>
                <QuotaFormSectionDesktop
                  control={control}
                  errors={errors}
                  labels={labels}
                  isEditing={isEditing}
                  watchPeriodType={periodType}
                  watchKind={kind}
                />

                <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", pt: 1 }}>
                  {canManage && (
                    <DesktopPrimaryPageAction
                      type="submit"
                      disabled={isSubmitting}
                      startIcon={
                        isSubmitting ? (
                          <SyncOutlined
                            sx={{
                              animation: "spin 1s linear infinite",
                              "@keyframes spin": { to: { transform: "rotate(360deg)" } },
                            }}
                          />
                        ) : undefined
                      }
                    >
                      {isEditing ? labels.actions.save : labels.actions.create}
                    </DesktopPrimaryPageAction>
                  )}
                </Stack>
              </Stack>
            </Box>
          </FormProvider>

          <FormSuccessSnackbar
            open={showSuccess}
            message={isEditing ? labels.actions.save : labels.actions.create}
            onClose={onDismissSuccess}
          />
          <DesktopFormErrorSnackbar open={Boolean(submitError)} message={submitError ?? ""} onClose={onDismissError} />
        </DesktopPageContainer>
      </div>
    </Fade>
  );
}
