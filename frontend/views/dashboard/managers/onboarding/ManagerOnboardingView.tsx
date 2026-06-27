"use client";

import { Box, Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import type { Control, FieldErrors, UseFormHandleSubmit, UseFormRegister } from "react-hook-form";
import { FormSuccessSnackbar, PageContainer, PageHeader } from "@/frontend/components/ui";
import { OnboardingMetricsOverview } from "./OnboardingMetricsOverview";
import { StaffInfoSection } from "./StaffInfoSection";
import { SystemAccessSection } from "./SystemAccessSection";
import type { ManagerOnboardingFormData } from "./schemas/managerOnboardingSchema";

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

/**
 * Primary submit button with bold styling and primary color.
 */
const StyledSubmitButton = styled(Button)(({ theme }) => ({
  maxWidth: 280,
  paddingLeft: theme.spacing(6),
  paddingRight: theme.spacing(6),
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  borderRadius: Number(theme.shape.borderRadius) * 2,
  fontWeight: 700,
  letterSpacing: "0.1em",
  backgroundColor: theme.palette.primary.main,
  "&:hover": { backgroundColor: theme.palette.primary.dark },
}));

/**
 * Secondary cancel button with text styling.
 */
const StyledCancelButton = styled(Button)(({ theme }) => ({
  maxWidth: 200,
  color: theme.palette.text.secondary,
  fontWeight: 700,
  letterSpacing: "0.1em",
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
 * │  │         ├── StaffInfoSection (name, email, skype fields) │
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
 * - StaffInfoSection: Personal info fields (name, email, skype)
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
          <StaffInfoSection register={register} errors={errors} />

          {/* System access configuration (account type + department) */}
          <SystemAccessSection register={register} control={control} errors={errors} />

          {/* Form action buttons */}
          <StyledFormActions>
            <StyledSubmitButton type="submit" variant="contained" disabled={isSubmitting} fullWidth>
              {isSubmitting ? t("actions.processing") : t("actions.signup")}
            </StyledSubmitButton>
            <StyledCancelButton type="button" variant="text" onClick={onCancel} fullWidth>
              {t("actions.cancel")}
            </StyledCancelButton>
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
