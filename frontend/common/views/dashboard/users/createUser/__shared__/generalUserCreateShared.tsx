"use client";

import { useQuery } from "@apollo/client/react";
import { Autocomplete, Box, Grid, MenuItem, type SxProps, TextField, type Theme } from "@mui/material";
import type { ComponentType, ReactNode } from "react";
import { type Control, Controller, type FieldErrors, FormProvider } from "react-hook-form";
import { outlinedInputSx } from "@/frontend/common/components/ui/form/field";
import { PhoneFormField } from "@/frontend/common/components/ui/input";
import { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { permissionGroupsQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { GeneralUserCreateFormData } from "@/frontend/common/views/dashboard/users/createUser/schemas/generalUserCreateSchema";
import type { UseGeneralUserCreateViewModel } from "@/frontend/common/views/dashboard/users/createUser/useGeneralUserCreateViewModel";
import { SPECIALIZED_GROUP_SLUG_SET } from "@/shared/constants/specialized-groups.constants";
import { useRouter } from "@/shared/i18n/navigation";
import { resolveLocalizedString } from "@/shared/lib/localized-string";

/* ------------------------------------------------------------------ */
/* Slot type signatures (tier-specific components injected by caller) */
/* ------------------------------------------------------------------ */

interface SectionPanelProps {
  readonly title: string;
  readonly children: ReactNode;
}

interface PrimaryPageActionProps {
  readonly type?: "submit" | "reset" | "button";
  readonly variant?: "text" | "outlined" | "contained";
  readonly disabled?: boolean;
  readonly fullWidth?: boolean;
  readonly sx?: SxProps<Theme>;
  readonly children: ReactNode;
  readonly onClick?: () => void;
}

interface SnackbarProps {
  readonly open: boolean;
  readonly message: string;
  readonly onClose: () => void;
}

export interface GeneralUserCreateSharedOptions {
  readonly SectionPanel: ComponentType<SectionPanelProps>;
  readonly PrimaryPageAction: ComponentType<PrimaryPageActionProps>;
  readonly FormSuccessSnackbar: ComponentType<SnackbarProps>;
  readonly FormErrorSnackbar?: ComponentType<SnackbarProps>;
  readonly footerPadding: number;
  readonly buttonFullWidth?: boolean;
  readonly buttonSx: SxProps<Theme>;
  readonly formGap: number;
}

type Vm = UseGeneralUserCreateViewModel;
type VmLabels = Vm["labels"];

/* ------------------------------------------------------------------ */
/* Validation message helper                                          */
/* ------------------------------------------------------------------ */

function getErrorMessage(error: unknown): string | undefined {
  if (error && typeof error === "object" && "message" in error) {
    const msg = error.message;
    return typeof msg === "string" ? msg : undefined;
  }
  return undefined;
}

function validationMessage(labels: VmLabels, error: unknown): string | undefined {
  const msg = getErrorMessage(error);
  if (!msg) return undefined;
  if (msg === "nameRequired") return labels.nameRequired;
  if (msg === "emailRequired") return labels.emailRequired;
  if (msg === "emailInvalid") return labels.emailInvalid;
  if (msg === "emailExists") return labels.emailExists;
  if (msg === "passwordRequired") return labels.passwordRequired;
  if (msg === "passwordWeak") return labels.passwordWeak;
  if (msg === "permissionGroupRequired") return labels.permissionGroupRequired;
  if (msg === "specializedGroupNotAllowed") return labels.specializedGroupNotAllowed;
  if (msg === "permissionGroupNotFound") return labels.permissionGroupNotFound;
  return msg;
}

/* ------------------------------------------------------------------ */
/* Permission group option type                                        */
/* ------------------------------------------------------------------ */

interface PermissionGroupOption {
  readonly slug: string;
  readonly name: string;
}

/* ------------------------------------------------------------------ */
/* Form field components                                               */
/* ------------------------------------------------------------------ */

function NameField({
  control,
  errors,
  labels,
}: Readonly<{
  control: Control<GeneralUserCreateFormData>;
  errors: FieldErrors<GeneralUserCreateFormData>;
  labels: VmLabels;
}>) {
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={labels.name}
            required
            fullWidth
            sx={outlinedInputSx}
            error={!!errors.name}
            helperText={validationMessage(labels, errors.name)}
          />
        )}
      />
    </Grid>
  );
}

function EmailField({
  control,
  errors,
  labels,
}: Readonly<{
  control: Control<GeneralUserCreateFormData>;
  errors: FieldErrors<GeneralUserCreateFormData>;
  labels: VmLabels;
}>) {
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={labels.email}
            type="email"
            required
            fullWidth
            sx={outlinedInputSx}
            error={!!errors.email}
            helperText={validationMessage(labels, errors.email)}
          />
        )}
      />
    </Grid>
  );
}

function PasswordField({
  control,
  errors,
  labels,
}: Readonly<{
  control: Control<GeneralUserCreateFormData>;
  errors: FieldErrors<GeneralUserCreateFormData>;
  labels: VmLabels;
}>) {
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={labels.password}
            type="password"
            required
            fullWidth
            sx={outlinedInputSx}
            error={!!errors.password}
            helperText={validationMessage(labels, errors.password)}
          />
        )}
      />
    </Grid>
  );
}

function PhoneField({
  control,
  errors,
  labels,
}: Readonly<{
  control: Control<GeneralUserCreateFormData>;
  errors: FieldErrors<GeneralUserCreateFormData>;
  labels: VmLabels;
}>) {
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <PhoneFormField<GeneralUserCreateFormData>
        name="phone"
        control={control}
        label={labels.phone}
        error={!!errors.phone}
        helperText={validationMessage(labels, errors.phone)}
      />
    </Grid>
  );
}

/* ------------------------------------------------------------------ */
/* Permission group autocomplete field                                 */
/* ------------------------------------------------------------------ */

function PermissionGroupField({
  control,
  errors,
  labels,
  options,
  loading,
}: Readonly<{
  control: Control<GeneralUserCreateFormData>;
  errors: FieldErrors<GeneralUserCreateFormData>;
  labels: VmLabels;
  options: readonly PermissionGroupOption[];
  loading: boolean;
}>) {
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Controller
        name="groupSlug"
        control={control}
        render={({ field }) => {
          const selected = options.find(opt => opt.slug === field.value) ?? null;
          return (
            <Autocomplete
              options={options}
              loading={loading}
              value={selected}
              getOptionLabel={opt => opt.name}
              isOptionEqualToValue={(opt, val) => opt.slug === val.slug}
              onChange={(_, val) => {
                field.onChange(val?.slug ?? "");
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  label={labels.permissionGroup}
                  required
                  fullWidth
                  sx={outlinedInputSx}
                  error={!!errors.groupSlug}
                  helperText={validationMessage(labels, errors.groupSlug)}
                />
              )}
            />
          );
        }}
      />
    </Grid>
  );
}

/* ------------------------------------------------------------------ */
/* Account status select field                                         */
/* ------------------------------------------------------------------ */

function AccountStatusField({
  control,
  errors,
  labels,
}: Readonly<{
  control: Control<GeneralUserCreateFormData>;
  errors: FieldErrors<GeneralUserCreateFormData>;
  labels: VmLabels;
}>) {
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Controller
        name="status"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            select
            label={labels.accountStatus}
            required
            fullWidth
            sx={outlinedInputSx}
            error={!!errors.status}
            helperText={validationMessage(labels, errors.status)}
          >
            <MenuItem value={AccountStatus.Activated}>{labels.statusActivated}</MenuItem>
            <MenuItem value={AccountStatus.Deactivated}>{labels.statusDeactivated}</MenuItem>
          </TextField>
        )}
      />
    </Grid>
  );
}

/* ------------------------------------------------------------------ */
/* Form actions (footer)                                               */
/* ------------------------------------------------------------------ */

function FormActions({
  labels,
  isSubmitting,
  options,
  onCancel,
}: Readonly<{
  labels: VmLabels;
  isSubmitting: boolean;
  options: GeneralUserCreateSharedOptions;
  onCancel: () => void;
}>) {
  const { PrimaryPageAction, footerPadding, buttonFullWidth, buttonSx } = options;
  return (
    <Box
      sx={theme => ({
        p: footerPadding,
        backgroundColor: theme.palette.surfaceContainerLow,
        borderRadius: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 2,
      })}
    >
      <PrimaryPageAction type="button" variant="text" onClick={onCancel} fullWidth={buttonFullWidth} sx={buttonSx}>
        {labels.cancelButton}
      </PrimaryPageAction>
      <PrimaryPageAction type="submit" disabled={isSubmitting} fullWidth={buttonFullWidth} sx={buttonSx}>
        {labels.createButton}
      </PrimaryPageAction>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Main shared component                                               */
/* ------------------------------------------------------------------ */

export function GeneralUserCreateShared({
  form,
  control,
  errors,
  handleSubmit,
  isSubmitting,
  showSuccess,
  submitError,
  labels,
  onSubmit,
  onDismissSuccess,
  onDismissError,
  options,
}: Readonly<
  Pick<
    UseGeneralUserCreateViewModel,
    | "form"
    | "control"
    | "errors"
    | "handleSubmit"
    | "isSubmitting"
    | "showSuccess"
    | "submitError"
    | "labels"
    | "onSubmit"
    | "onDismissSuccess"
    | "onDismissError"
  > & {
    readonly options: GeneralUserCreateSharedOptions;
  }
>) {
  const router = useRouter();
  const locale = useAppLocale();

  const { data: groupsData, loading: groupsLoading } = useQuery(permissionGroupsQueryDocument);

  const permissionGroupOptions: PermissionGroupOption[] = (groupsData?.permissionGroups ?? []).flatMap(group => {
    const slug = group?.slug;
    if (!slug) return [];
    if (SPECIALIZED_GROUP_SLUG_SET.has(slug)) return [];
    return [{ slug, name: resolveLocalizedString(group.name, locale) }];
  });

  const handleCancel = () => {
    router.push("/users");
  };

  const { SectionPanel, FormSuccessSnackbar, FormErrorSnackbar, formGap } = options;

  return (
    <FormProvider {...form}>
      <Box
        component="form"
        onSubmit={e => {
          void handleSubmit(onSubmit)(e);
        }}
        sx={{ display: "flex", flexDirection: "column", gap: formGap }}
      >
        {/* Section 1: User Details */}
        <SectionPanel title={labels.sections.userDetails}>
          <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
            <NameField control={control} errors={errors} labels={labels} />
            <EmailField control={control} errors={errors} labels={labels} />
            <PhoneField control={control} errors={errors} labels={labels} />
            <PasswordField control={control} errors={errors} labels={labels} />
          </Grid>
        </SectionPanel>

        {/* Section 2: Permission Group & Account Status */}
        <SectionPanel title={labels.sections.permissions}>
          <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
            <PermissionGroupField
              control={control}
              errors={errors}
              labels={labels}
              options={permissionGroupOptions}
              loading={groupsLoading}
            />
            <AccountStatusField control={control} errors={errors} labels={labels} />
          </Grid>
        </SectionPanel>

        {/* Footer actions */}
        <FormActions labels={labels} isSubmitting={isSubmitting} options={options} onCancel={handleCancel} />

        {/* Snackbars */}
        <FormSuccessSnackbar open={showSuccess} message={labels.createSuccess} onClose={onDismissSuccess} />
        {FormErrorSnackbar ? (
          <FormErrorSnackbar open={Boolean(submitError)} message={submitError ?? ""} onClose={onDismissError} />
        ) : null}
      </Box>
    </FormProvider>
  );
}
