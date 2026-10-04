"use client";

import {
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
} from "@mui/material";
import { Controller } from "react-hook-form";
import type {
  ActionsBarProps,
  CapabilitiesSectionProps,
} from "@/frontend/common/views/dashboard/admin/meeting-providers/form/__shared__/meetingProviderFormShared.types";
import type { MeetingProviderFormData } from "@/frontend/common/views/dashboard/admin/meeting-providers/schemas/meetingProviderFormSchema";

const PROVIDER_KIND_OPTIONS = [
  { value: "manual", labelKey: "providerKindManual" },
  { value: "zoom_oauth", labelKey: "providerKindZoom" },
  { value: "google_meet_oauth", labelKey: "providerKindGoogleMeet" },
  { value: "microsoft_teams_oauth", labelKey: "providerKindTeams" },
] as const;

export function CapabilitiesSection({
  t,
  control,
  isSaving,
  isActiveValue,
  slots,
  styles,
}: Readonly<CapabilitiesSectionProps>) {
  const { SectionPanel } = slots;

  return (
    <SectionPanel title={t.fields.capabilities}>
      <Stack spacing={styles.capabilitiesStackSpacing}>
        <Controller<MeetingProviderFormData, "providerKind">
          name="providerKind"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth disabled={isSaving}>
              <InputLabel>{t.fields.providerKind}</InputLabel>
              <Select {...field} label={t.fields.providerKind}>
                {PROVIDER_KIND_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {t.fields[option.labelKey]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
        <Controller<MeetingProviderFormData, "supportsUsername">
          name="supportsUsername"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              sx={{ gap: 1, ml: -0.5 }}
              control={
                <Checkbox checked={field.value} onChange={e => field.onChange(e.target.checked)} disabled={isSaving} />
              }
              label={t.fields.supportsUsername}
            />
          )}
        />
        <Controller<MeetingProviderFormData, "supportsPassword">
          name="supportsPassword"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              sx={{ gap: 1, ml: -0.5 }}
              control={
                <Checkbox checked={field.value} onChange={e => field.onChange(e.target.checked)} disabled={isSaving} />
              }
              label={t.fields.supportsPassword}
            />
          )}
        />
        <Controller<MeetingProviderFormData, "supportsTenantId">
          name="supportsTenantId"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              sx={{ gap: 1, ml: -0.5 }}
              control={
                <Checkbox checked={field.value} onChange={e => field.onChange(e.target.checked)} disabled={isSaving} />
              }
              label={t.fields.supportsTenantId}
            />
          )}
        />
        <Controller<MeetingProviderFormData, "isActive">
          name="isActive"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              sx={{ gap: 1.5, ml: 0 }}
              control={
                <Switch checked={field.value} onChange={e => field.onChange(e.target.checked)} disabled={isSaving} />
              }
              label={`${t.fields.isActive}: ${isActiveValue ? t.active : t.inactive}`}
            />
          )}
        />
      </Stack>
    </SectionPanel>
  );
}

export function ActionsBar({ t, isSaving, slugValue, urlAllowlistValue, onCancel, styles }: Readonly<ActionsBarProps>) {
  return (
    <Stack
      direction="row"
      spacing={styles.actionsStackSpacing}
      sx={{ pt: 1, ...(styles.actionsJustifyEnd ? { justifyContent: "flex-end" } : {}) }}
    >
      <Button variant="outlined" onClick={onCancel} disabled={isSaving} fullWidth={styles.actionsFullWidth}>
        {t.cancel}
      </Button>
      <Button
        type="submit"
        variant="contained"
        fullWidth={styles.actionsFullWidth}
        disabled={isSaving || !slugValue.trim() || urlAllowlistValue.length === 0}
        startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : null}
      >
        {isSaving ? t.saving : t.save}
      </Button>
    </Stack>
  );
}
