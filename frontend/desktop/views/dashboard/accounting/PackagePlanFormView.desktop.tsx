"use client";

import { ArchiveOutlined, SaveOutlined, SyncOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import Link from "next/link";
import { Controller } from "react-hook-form";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import type { UsePackagePlanFormViewModel } from "@/frontend/common/views/dashboard/accounting/usePackagePlanFormViewModel";
import { DesktopFormErrorSnackbar } from "@/frontend/desktop/components/ui";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container/DesktopSectionPanel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

const CURRENCY_OPTIONS: readonly CurrencyCode[] = [
  CurrencyCode.Egp,
  CurrencyCode.Usd,
  CurrencyCode.Sar,
  CurrencyCode.Aed,
];

const CURRENCY_LABELS: Record<string, string> = {
  Egp: "EGP",
  Usd: "USD",
  Sar: "SAR",
  Aed: "AED",
};

const spinIcon = (
  <SyncOutlined
    sx={{ animation: "spin 1s linear infinite", "@keyframes spin": { to: { transform: "rotate(360deg)" } } }}
  />
);

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
    return (
      <DesktopPageContainer>
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress size={36} />
        </Box>
      </DesktopPageContainer>
    );
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
            <Button
              color="error"
              variant="outlined"
              startIcon={<ArchiveOutlined />}
              onClick={() => setArchiveDialogOpen(true)}
              disabled={archiving || !(existing?.active ?? true)}
            >
              {t.archiveConfirm}
            </Button>
          ) : undefined
        }
      />

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ maxWidth: 720 }}>
        <Stack spacing={3}>
          <DesktopSectionPanel title={t.form.displayName}>
            <Stack spacing={3}>
              <Controller
                name="codename"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    size="small"
                    label={t.form.codename}
                    placeholder={t.form.codenamePlaceholder}
                    helperText={errors.codename?.message ?? t.form.codenameHelp}
                    error={Boolean(errors.codename)}
                    disabled={isEditing}
                    slotProps={{ htmlInput: { sx: { fontFamily: "monospace" } } }}
                    sx={{ maxWidth: 340 }}
                  />
                )}
              />

              <Controller
                name="displayName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    size="small"
                    label={t.form.displayName}
                    error={Boolean(errors.displayName)}
                    helperText={errors.displayName?.message}
                    sx={{ maxWidth: 480 }}
                  />
                )}
              />

              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    size="small"
                    multiline
                    minRows={2}
                    label={t.form.description}
                    sx={{ maxWidth: 640 }}
                  />
                )}
              />
            </Stack>
          </DesktopSectionPanel>

          <DesktopSectionPanel title={t.columns.price}>
            <Stack spacing={3}>
              <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 2 }}>
                <Controller
                  name="creditHours"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      size="small"
                      type="number"
                      label={t.form.creditHours}
                      error={Boolean(errors.creditHours)}
                      helperText={errors.creditHours?.message}
                      slotProps={{ htmlInput: { step: 0.5, min: 0.5, inputMode: "decimal" } }}
                      sx={{ flex: 1, minWidth: 150 }}
                    />
                  )}
                />
                <Controller
                  name="priceAmount"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      size="small"
                      type="number"
                      label={t.form.priceAmount}
                      error={Boolean(errors.priceAmount)}
                      helperText={errors.priceAmount?.message}
                      slotProps={{ htmlInput: { step: 0.01, min: 0, inputMode: "decimal" } }}
                      sx={{ flex: 1, minWidth: 150 }}
                    />
                  )}
                />
                <Controller
                  name="currency"
                  control={control}
                  render={({ field }) => (
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                      <InputLabel>{t.form.currency}</InputLabel>
                      <Select<CurrencyCode>
                        value={field.value}
                        label={t.form.currency}
                        onChange={e => field.onChange(e.target.value)}
                      >
                        {CURRENCY_OPTIONS.map(code => (
                          <MenuItem key={code} value={code}>
                            {CURRENCY_LABELS[code] ?? code}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Stack>

              <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 2, alignItems: "center" }}>
                <Controller
                  name="sortOrder"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      size="small"
                      type="number"
                      label={t.form.sortOrder}
                      error={Boolean(errors.sortOrder)}
                      helperText={errors.sortOrder?.message}
                      slotProps={{ htmlInput: { step: 1, min: 0 } }}
                      sx={{ width: 150 }}
                    />
                  )}
                />
                <Controller
                  name="validityMonths"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      value={field.value ?? ""}
                      onChange={e => field.onChange(e.target.value === "" ? null : e.target.value)}
                      size="small"
                      type="number"
                      label={t.form.validityMonths}
                      error={Boolean(errors.validityMonths)}
                      helperText={errors.validityMonths?.message}
                      slotProps={{ htmlInput: { step: 1, min: 1, max: 120 } }}
                      sx={{ width: 170 }}
                    />
                  )}
                />
                <Controller
                  name="active"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
                      label={t.form.active}
                    />
                  )}
                />
              </Stack>
              {errors.active ? <FormHelperText error>{errors.active.message}</FormHelperText> : null}
            </Stack>
          </DesktopSectionPanel>

          <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
            <Link href="/accounting/packages" style={{ textDecoration: "none" }}>
              <DesktopPrimaryPageAction variant="outlined" disabled={isSubmitting}>
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
        </Stack>
      </Box>

      {/* Archive confirmation */}
      <Dialog open={archiveDialogOpen} onClose={() => setArchiveDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t.archiveTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>{existing ? t.archiveBody(existing.displayName ?? "") : ""}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveDialogOpen(false)} disabled={archiving}>
            {t.form.cancel}
          </Button>
          <Button color="error" variant="contained" onClick={() => void onArchive()} disabled={archiving}>
            {t.archiveConfirm}
          </Button>
        </DialogActions>
      </Dialog>

      <FormSuccessSnackbar open={showSuccess} message={t.saveSuccess} onClose={onDismissSuccess} />
      <DesktopFormErrorSnackbar open={Boolean(submitError)} message={submitError ?? ""} onClose={onDismissError} />
    </DesktopPageContainer>
  );
}
