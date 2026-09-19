"use client";

import { Alert, Button, Stack } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { AppPermission, type MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { Link } from "@/shared/i18n";
import { resolveLocalizedString } from "@/shared/lib/localized-string";
import { Translation, useAppTranslation } from "@/shared/locale";

export type MeetingProviderSelectProps = {
  /** Active meeting providers to offer; supplied by the caller (e.g. {@link MeetingProviderSelectContainer}). */
  readonly options: readonly MeetingProviderFieldsFragment[];
  readonly loading?: boolean;
  readonly value: MeetingProviderFieldsFragment | null;
  readonly onChangeAction: (provider: MeetingProviderFieldsFragment | null) => void;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly error?: boolean;
  readonly helperText?: string;
};

export function MeetingProviderSelect({
  options,
  loading = false,
  value,
  onChangeAction,
  disabled,
  label,
  error,
  helperText,
}: MeetingProviderSelectProps) {
  const locale = useAppLocale();
  const t = useAppTranslation(Translation.Ui.MeetingConfig).providerSelect;
  const { hasPermission } = useUserStore();
  const canManageCatalog = hasPermission(AppPermission.MeetingProvidersManageCatalog);

  const showEmptyCatalog = !loading && options.length === 0;

  return (
    <Stack spacing={1.5}>
      {showEmptyCatalog ? (
        <Alert severity="info">
          <Stack spacing={1}>
            <Stack sx={{ typography: "labelSm" }}>{t.emptyCatalogTitle}</Stack>
            <Stack sx={{ typography: "bodyMd" }}>
              {canManageCatalog ? t.emptyCatalogBody : t.emptyCatalogContactAdmin}
            </Stack>
            {canManageCatalog ? (
              <Link href="/meeting-providers" style={{ textDecoration: "none" }}>
                <Button size="small" variant="outlined">
                  {t.emptyCatalogAdminLink}
                </Button>
              </Link>
            ) : null}
          </Stack>
        </Alert>
      ) : null}
      <Autocomplete
        options={[...options]}
        loading={loading}
        disabled={disabled ?? showEmptyCatalog}
        value={value}
        onChange={(_event, next) => onChangeAction(next)}
        getOptionLabel={option => resolveLocalizedString(option.name, locale)}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        renderInput={params => <TextField {...params} label={label} error={error} helperText={helperText} fullWidth />}
      />
    </Stack>
  );
}
