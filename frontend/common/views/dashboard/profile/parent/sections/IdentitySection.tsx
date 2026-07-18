"use client";

import { Stack, TextField } from "@mui/material";
import type { Control, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui";
import { CountryDisplay } from "@/frontend/common/components/ui/display";
import { CountrySelect } from "@/frontend/common/components/ui/input/countrySelect/CountrySelect";
import { getCountryByCode } from "@/frontend/common/lib/locale";
import type { ParentAdminEditFormData } from "@/frontend/common/views/dashboard/profile/parent/parentProfileFormTypes";
import { InfoField } from "@/frontend/common/views/dashboard/profile/parent/sections/InfoField";
import {
  type ParentAdminData,
  toDisplayValue,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { useAppTranslation } from "@/shared/locale";

type IdentitySectionProps =
  | {
      readonly mode: "view";
      readonly adminData: ParentAdminData;
    }
  | {
      readonly mode: "edit";
      readonly register: UseFormRegister<ParentAdminEditFormData>;
      readonly control: Control<ParentAdminEditFormData>;
    };

export function IdentitySection(props: IdentitySectionProps) {
  const t = useAppTranslation().profileTranslations.parent;

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t.sections.identity}>
        <Stack spacing={2}>
          <Controller
            name="nationality"
            control={props.control}
            render={({ field, fieldState }) => {
              const selectedCountry = field.value ? getCountryByCode(field.value) : undefined;

              return (
                <CountrySelect
                  country={selectedCountry}
                  setCountryAction={country => {
                    if (country) {
                      field.onChange(country.code);
                    }
                  }}
                  label={t.fields.nationality}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  onBlurAction={field.onBlur}
                  fullWidth
                />
              );
            }}
          />
          <TextField label={t.fields.address} fullWidth size="small" {...props.register("address")} />
        </Stack>
      </SectionPanel>
    );
  }

  return (
    <SectionPanel title={t.sections.identity}>
      <Stack spacing={2}>
        <InfoField
          label={t.fields.nationality}
          value={
            props.adminData.nationality ? (
              <CountryDisplay code={props.adminData.nationality} fallback={t.notSet} />
            ) : (
              t.notSet
            )
          }
        />
        <InfoField label={t.fields.address} value={toDisplayValue(props.adminData.address, t.notSet)} />
      </Stack>
    </SectionPanel>
  );
}
