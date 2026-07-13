"use client";

import { useQuery } from "@apollo/client/react";
import { Alert, Button, Stack } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { useLocale, useTranslations } from "next-intl";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import { meetingProvidersQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { Link } from "@/shared/i18n/routing";

export type MeetingProviderSelectProps = {
  readonly value: MeetingProviderFieldsFragment | null;
  readonly onChangeAction: (provider: MeetingProviderFieldsFragment | null) => void;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly error?: boolean;
  readonly helperText?: string;
};

export function MeetingProviderSelect({
  value,
  onChangeAction,
  disabled,
  label,
  error,
  helperText,
}: MeetingProviderSelectProps) {
  const locale = useLocale();
  const t = useTranslations("ui.meetingConfig.providerSelect");
  const { hasPermission } = useUserStore();
  const canManageCatalog = hasPermission(AppPermission.MeetingProvidersManageCatalog);
  const { data, loading } = useQuery(meetingProvidersQueryDocument, {
    variables: { activeOnly: true },
  });

  const options = data?.meetingProviders ?? [];
  const showEmptyCatalog = !loading && options.length === 0;

  return (
    <Stack spacing={1.5}>
      {showEmptyCatalog ? (
        <Alert severity="info">
          <Stack spacing={1}>
            <Stack sx={{ typography: "titleSm" }}>{t("emptyCatalogTitle")}</Stack>
            <Stack sx={{ typography: "bodySm" }}>
              {canManageCatalog ? t("emptyCatalogBody") : t("emptyCatalogContactAdmin")}
            </Stack>
            {canManageCatalog ? (
              <Button component={Link} href="/meeting-providers" size="small" variant="outlined">
                {t("emptyCatalogAdminLink")}
              </Button>
            ) : null}
          </Stack>
        </Alert>
      ) : null}
      <Autocomplete
        options={options}
        loading={loading}
        disabled={disabled || showEmptyCatalog}
        value={value}
        onChange={(_event, next) => onChangeAction(next)}
        getOptionLabel={option => resolveLocalizedString(option.name, locale)}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        renderInput={params => <TextField {...params} label={label} error={error} helperText={helperText} fullWidth />}
      />
    </Stack>
  );
}
