"use client";

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import type { Control, FieldErrors, UseFormHandleSubmit, UseFormRegister } from "react-hook-form";
import { FormSuccessSnackbar, PageContainer, PageHeader, PrimaryPageAction } from "@/frontend/common/components/ui";
import { OnboardingMetricsOverview } from "@/frontend/common/views/dashboard/managers/onboarding/OnboardingMetricsOverview";
import { StaffInfoSection } from "@/frontend/common/views/dashboard/managers/onboarding/StaffInfoSection";
import { SystemAccessSection } from "@/frontend/common/views/dashboard/managers/onboarding/SystemAccessSection";
import type { ManagerOnboardingFormData } from "@/frontend/common/views/dashboard/managers/onboarding/schemas/managerOnboardingSchema";

/* ────────────────────────────────────────────────────────────────────────────
 * Styled Components — Extracted inline sx styles for reusability & consistency
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Form wrapper with vertical flex layout and spacing between sections.
 */
const StyledFormWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

/**
 * Form action buttons container with top border separator.
 * Responsive: column on mobile, row on larger screens.
 */
const StyledFormActions = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexDirection: "column-reverse",
  gap: theme.spacing(2),
  paddingTop: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.outlineVariant}`,
  [theme.breakpoints.up("sm")]: {
    flexDirection: "row",
  },
}));

/* ────────────────────────────────────────────────────────────────────────────
 * Component Interface
 * ──────────────────────────────────────────────────────────────────────────── */

interface Props {
  readonly register: UseFormRegister<ManagerOnboardingFormData>;
  readonly control: Control<ManagerOnboardingFormData>;
  readonly errors: FieldErrors<ManagerOnboardingFormData>;
  readonly handleSubmit: UseFormHandleSubmit<ManagerOnboardingFormData>;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly onSubmit: (data: ManagerOnboardingFormData) => void | Promise<void>;
  readonly onCancel: () => void;
  readonly onDismissSuccess: () => void;
}

/* ────────────────────────────────────────────────────────────────────────────
 * ManagerOnboardingView Component
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Main view for the Manager Onboarding page.
 *
 * Structure:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ PageContainer                                               │
 * │  ├── PageHeader (title, subtitle)                           │
 * │  ├── Box (form element)                                     │
 * │  │    └── StyledFormWrapper                                 │
 * │  │         ├── StaffInfoSection (name, email fields) │
 * │  │         ├── SystemAccessSection (account type, dept)     │
 * │  │         └── StyledFormActions                            │
 * │  │              ├── StyledSubmitButton (primary)            │
 * │  │              └── StyledCancelButton (text)               │
 * │  ├── OnboardingMetricsOverview (3 metric cards)             │
 * │  └── FormSuccessSnackbar (shown on successful submit)       │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Components:
 * - PageContainer: Main content wrapper with section spacing
 * - PageHeader: Page title and subtitle
 * - Box (form): HTML form element for React Hook Form submission
 * - StyledFormWrapper: Flex container for form sections
 * - StaffInfoSection: Personal info fields (name, email)
 * - SystemAccessSection: Account type toggle and department select
 * - StyledFormActions: Container for submit/cancel buttons
 * - OnboardingMetricsOverview: Key metrics displayed below form
 * - FormSuccessSnackbar: Success notification after submission
 *
 * @param register - React Hook Form register function
 * @param control - React Hook Form control object
 * @param errors - Form validation errors
 * @param handleSubmit - Form submit handler
 * @param isSubmitting - Loading state during submission
 * @param showSuccess - Whether to show success snackbar
 * @param onSubmit - Callback when form is submitted
 * @param onCancel - Callback when cancel button is clicked
 * @param onDismissSuccess - Callback to dismiss success snackbar
 */
export function ManagerOnboardingView({
  register,
  control,
  errors,
  handleSubmit,
  isSubmitting,
  showSuccess,
  onSubmit,
  onCancel,
  onDismissSuccess,
}: Readonly<Props>) {
  const t = useTranslations("dashboard.managerOnboarding");

  return (
    <PageContainer>
      <PageHeader title={t("pageTitle")} subtitle={t("pageSubtitle")} />

      <Box
        component="form"
        onSubmit={e => {
          handleSubmit(onSubmit)(e);
        }}
      >
        <StyledFormWrapper>
          {/* Staff personal information fields */}
          <StaffInfoSection register={register} control={control} errors={errors} />

          {/* System access configuration (account type + department) */}
          <SystemAccessSection register={register} control={control} errors={errors} />

          {/* Form action buttons */}
          <StyledFormActions>
            <PrimaryPageAction
              type="submit"
              disabled={isSubmitting}
              sx={theme => ({
                maxWidth: 280,
                px: 6,
                py: 2,
                borderRadius: Number(theme.shape.borderRadius) * 2,
              })}
            >
              {isSubmitting ? t("actions.processing") : t("actions.signup")}
            </PrimaryPageAction>
            <PrimaryPageAction
              type="button"
              variant="text"
              onClick={onCancel}
              sx={theme => ({
                maxWidth: 200,
                color: theme.palette.text.secondary,
              })}
            >
              {t("actions.cancel")}
            </PrimaryPageAction>
          </StyledFormActions>
        </StyledFormWrapper>
      </Box>

      {/* Onboarding metrics overview section */}
      <OnboardingMetricsOverview />

      {/* Success notification snackbar */}
      <FormSuccessSnackbar open={showSuccess} message={t("actions.successMessage")} onClose={onDismissSuccess} />
    </PageContainer>
  );
}
