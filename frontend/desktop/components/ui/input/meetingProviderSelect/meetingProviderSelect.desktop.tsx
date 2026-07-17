"use client";

import { useQuery } from "@apollo/client/react";
import { Alert, Autocomplete, Button, Stack, TextField } from "@mui/material";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { meetingProvidersQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { Link } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale";

export type MeetingProviderFieldsFragment = {
  readonly id: string | null;
  readonly slug: string | null;
  readonly name: Partial<Record<"ar" | "en", string>> | null;
  readonly description: Partial<Record<"ar" | "en", string>> | null;
  readonly instructions: Partial<Record<"ar" | "en", string>> | null;
  readonly urlAllowlist: readonly string[] | null;
  readonly urlExample: string | null;
  readonly logoUrl: string | null;
  readonly isActive: boolean | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
  readonly fieldSchema: {
    readonly requiresMeetingUrl: boolean | null;
    readonly supportsUsername: boolean | null;
    readonly supportsPassword: boolean | null;
    readonly supportsTenantId: boolean | null;
  } | null;
};

export type MeetingProviderSelectProps = {
  readonly value: MeetingProviderFieldsFragment | null;
  readonly onChangeAction: (provider: MeetingProviderFieldsFragment | null) => void;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly error?: boolean;
  readonly helperText?: string;
};

export function MeetingProviderSelectDesktop({
  value,
  onChangeAction,
  disabled,
  label,
  error,
  helperText,
}: MeetingProviderSelectProps) {
  const locale = useAppLocale();
  const t = useAppTranslation().uiTranslations.meetingConfig.providerSelect;
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
            <Stack sx={{ typography: "titleSm" }}>{t.emptyCatalogTitle}</Stack>
            <Stack sx={{ typography: "bodySm" }}>
              {canManageCatalog ? t.emptyCatalogBody : t.emptyCatalogContactAdmin}
            </Stack>
            {canManageCatalog ? (
              <Button component={Link} href="/meeting-providers" size="small" variant="outlined">
                {t.emptyCatalogAdminLink}
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
