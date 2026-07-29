"use client";

import EmailOutlined from "@mui/icons-material/EmailOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import { Stack, TextField } from "@mui/material";
import type { Control, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui";
import { CurrencyDisplay } from "@/frontend/common/components/ui/display/currencyDisplay";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import type { CurrencyCode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/common/lib/currency";
import { ProfileFieldRow } from "@/frontend/common/views/dashboard/profile/shared/ProfileFieldRow";
import type { ProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import { useProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/useProfileSharedBaseLabels";

type CoreIdentityFormFields = {
  name: string;
  email: string;
  avatarUrl?: string | null;
  displayCurrency?: CurrencyCode | null;
};

type CoreIdentityViewProps = {
  readonly mode: "view";
  readonly scope?: ProfileScope;
  readonly name: string | null | undefined;
  readonly email: string | null | undefined;
  readonly avatarUrl?: string | null;
  readonly displayCurrency: CurrencyCode | null | undefined;
  readonly sectionTitle: string;
  readonly nameLabel: string;
  readonly emailLabel: string;
  readonly currencyLabel: string;
  readonly baseLabels?: ProfileSharedBaseLabels;
  readonly additionalViewContent?: React.ReactNode;
};

type CoreIdentityEditProps = {
  readonly mode: "edit";
  readonly scope?: ProfileScope;
  readonly name: string | null | undefined;
  readonly sectionTitle: string;
  readonly nameLabel: string;
  readonly emailLabel: string;
  readonly currencyLabel: string;
  readonly baseLabels?: ProfileSharedBaseLabels;
  readonly register: UseFormRegister<CoreIdentityFormFields>;
  readonly control: Control<CoreIdentityFormFields>;
};

type CoreIdentitySectionProps = CoreIdentityViewProps | CoreIdentityEditProps;

export function CoreIdentitySection(props: CoreIdentitySectionProps) {
  const fallbackBaseLabels = useProfileSharedBaseLabels();
  const t = props.baseLabels ?? fallbackBaseLabels;
  const { canView, canViewField } = useProfileFieldAccess({ scope: props.scope });

  if (!canView("core_identity")) {
    return null;
  }

  if (props.mode === "edit") {
    return (
      <SectionPanel title={props.sectionTitle}>
        <Stack spacing={2}>
          <TextField label={props.nameLabel} fullWidth size="small" {...props.register("name")} />
          <TextField label={props.emailLabel} fullWidth size="small" type="email" {...props.register("email")} />
          <Controller
            name="displayCurrency"
            control={props.control}
            render={({ field, fieldState }) => {
              const option: CurrencyOption | null = field.value ? (getCurrencyByCode(field.value) ?? null) : null;
              return (
                <CurrencySelect
                  currency={option}
                  setCurrencyAction={selected => {
                    field.onChange(selected.code);
                  }}
                  onBlurAction={field.onBlur}
                  label={props.currencyLabel}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  fullWidth
                />
              );
            }}
          />
        </Stack>
      </SectionPanel>
    );
  }

  const hasIdentityFields =
    canViewField("core_identity") || props.additionalViewContent != null;

  if (!hasIdentityFields) {
    return null;
  }

  return (
    <SectionPanel title={props.sectionTitle}>
      <Stack spacing={1}>
        {canViewField("core_identity") ? (
          <ProfileFieldRow icon={PersonOutlined} label={props.nameLabel} value={props.name ?? t.notSet} />
        ) : null}
        {canViewField("core_identity") ? (
          <ProfileFieldRow icon={EmailOutlined} label={props.emailLabel} value={props.email ?? t.notSet} />
        ) : null}
        {canViewField("core_identity") ? (
          <ProfileFieldRow
            icon={PersonOutlined}
            label={props.currencyLabel}
            value={<CurrencyDisplay code={props.displayCurrency} fallback={t.notSet} />}
          />
        ) : null}
        {props.additionalViewContent}
      </Stack>
    </SectionPanel>
  );
}
