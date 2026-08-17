"use client";

import { SyncOutlined } from "@mui/icons-material";
import { Box, Fade, Stack } from "@mui/material";
import { FormProvider } from "react-hook-form";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import { useQuotaFormShell } from "@/frontend/common/views/dashboard/billing/quota/useQuotaFormShell";
import type { UseQuotaFormViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaFormViewModel";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui/container/page";
import { MobileFormErrorSnackbar } from "@/frontend/mobile/components/ui/form/snackbar";
import { QuotaFormSectionMobile } from "@/frontend/mobile/views/dashboard/billing/quota/components/QuotaFormSectionMobile";

export function QuotaFormMobileView(props: Readonly<UseQuotaFormViewModel>) {
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
        <MobilePageContainer>
          <MobilePageHeader title={pageTitle} breadcrumbs={breadcrumbs} />
          <FormProvider {...form}>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ px: { xs: 2, md: 3 } }}>
              <Stack spacing={3}>
                <QuotaFormSectionMobile
                  control={control}
                  errors={errors}
                  labels={labels}
                  isEditing={isEditing}
                  watchPeriodType={periodType}
                  watchKind={kind}
                />

                {canManage && (
                  <MobilePrimaryPageAction
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
                  </MobilePrimaryPageAction>
                )}
              </Stack>
            </Box>
          </FormProvider>

          <FormSuccessSnackbar
            open={showSuccess}
            message={isEditing ? labels.actions.save : labels.actions.create}
            onClose={onDismissSuccess}
          />
          <MobileFormErrorSnackbar open={Boolean(submitError)} message={submitError ?? ""} onClose={onDismissError} />
        </MobilePageContainer>
      </div>
    </Fade>
  );
}
