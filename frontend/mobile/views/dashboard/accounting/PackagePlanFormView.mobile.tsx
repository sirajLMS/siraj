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
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { Controller } from "react-hook-form";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import type { UsePackagePlanFormViewModel } from "@/frontend/common/views/dashboard/accounting/usePackagePlanFormViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

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

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5} sx={{ px: 2, pb: 6 }}>
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
              />
            )}
          />

          <Stack direction="row" spacing={1.5}>
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
                  sx={{ flex: 1 }}
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
                  sx={{ flex: 1 }}
                />
              )}
            />
          </Stack>

          <Stack direction="row" spacing={1.5}>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <FormControl size="small" sx={{ flex: 1 }}>
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
                  sx={{ flex: 1 }}
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
                  sx={{ flex: 1 }}
                />
              )}
            />
          </Stack>

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
            <Button
              color="error"
              variant="outlined"
              startIcon={<ArchiveOutlined />}
              onClick={() => setArchiveDialogOpen(true)}
              disabled={archiving || !(existing?.active ?? true)}
            >
              {t.archived}
            </Button>
          ) : null}

          <Button variant="text" onClick={() => router.push("/accounting/packages")} disabled={isSubmitting}>
            {t.form.cancel}
          </Button>
        </Stack>
      </Box>

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
    </MobilePageContainer>
  );
}
