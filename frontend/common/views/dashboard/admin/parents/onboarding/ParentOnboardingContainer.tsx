"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Box, Button } from "@mui/material";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui";
import { AppPermission, CurrencyCode, IanaTimezone } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useCreateParentOnboarding } from "@/frontend/common/hooks/useCreateParentOnboarding";
import { useParentOnboardingStore } from "@/frontend/common/stores/parentOnboardingStore";
import { logger } from "@/frontend/common/utils/logger";
import { profileHrefForParent } from "@/frontend/common/utils/profileHref";
import { ParentOnboardingView } from "@/frontend/common/views/dashboard/admin/parents/onboarding/ParentOnboardingView";
import {
  type ParentOnboardingFormData,
  parentOnboardingSchema,
} from "@/frontend/common/views/dashboard/admin/parents/onboarding/schemas/parentOnboardingSchema";
import { InvoiceType, PaymentMethodType } from "@/frontend/common/views/dashboard/admin/parents/onboarding/types";
import { useRouter } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale";

const defaultValues: ParentOnboardingFormData = {
  name: "",
  email: "",
  phone: "",
  nationality: "",
  address: "",
  whatsapp: "",
  facebook: "",
  twitter: "",
  invoiceType: InvoiceType.Monthly,
  feeAmount: "",
  payinMethod: {
    type: PaymentMethodType.BankTransfer,
    label: "",
    details: {},
  },
  currency: CurrencyCode.Usd,
  timezone: IanaTimezone.AfricaCairo,
  meetingProvider: null,
  meetingUrl: "",
  meetingLabel: "",
};

export function ParentOnboardingContainer() {
  const t = useAppTranslation().dashboardTranslations.parentOnboarding;
  const tMeeting = useAppTranslation().uiTranslations.meetingConfig.manager;
  const tJoin = useAppTranslation().uiTranslations.meetingConfig.join;
  const { execute, loading, meetingConfigWarning, clearMeetingConfigWarning } = useCreateParentOnboarding();
  const createdParent = useParentOnboardingStore(state => state.result);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  const meetingSetupHref = createdParent
    ? `${profileHrefForParent({ userId: createdParent.userId, parentId: createdParent.parentId })}?tab=meeting`
    : undefined;

  const form = useForm<ParentOnboardingFormData>({
    resolver: zodResolver(parentOnboardingSchema),
    defaultValues,
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = form;

  const onSubmit = async (formData: ParentOnboardingFormData) => {
    try {
      logger.info("Submitting parent onboarding form", { formData });
      await execute(formData);
      logger.info("Parent onboarding form submitted successfully");
      setShowSuccess(true);
      resetForm(defaultValues);
    } catch (error) {
      logger.error("Failed to submit parent onboarding form", { error });
    }
  };

  return (
    <RequirePermission permissions={[AppPermission.ParentsCreate]}>
      {meetingConfigWarning ? (
        <Box sx={{ px: { xs: 2, md: 3 }, pt: 2 }}>
          <Alert
            severity="warning"
            onClose={() => clearMeetingConfigWarning()}
            action={
              meetingSetupHref ? (
                <Button color="inherit" size="small" onClick={() => router.push(meetingSetupHref)}>
                  {tJoin.setupLink}
                </Button>
              ) : undefined
            }
          >
            {tMeeting.postCreateFailure}
          </Alert>
        </Box>
      ) : null}
      <FormProvider {...form}>
        <ParentOnboardingView
          register={register}
          control={control}
          errors={errors}
          handleSubmit={handleSubmit}
          isSubmitting={loading}
          onSubmit={onSubmit}
        />
      </FormProvider>
      <FormSuccessSnackbar
        open={showSuccess}
        message={t.actions.successMessage}
        onClose={() => setShowSuccess(false)}
      />
    </RequirePermission>
  );
}
