"use client";

import PhoneOutlined from "@mui/icons-material/PhoneOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import { Stack, TextField } from "@mui/material";
import { type Control, Controller, type FieldPath, type FieldValues, type UseFormRegister } from "react-hook-form";
import { PhoneFormField, SectionPanel } from "@/frontend/common/components/ui";
import { PhoneDisplay } from "@/frontend/common/components/ui/display/phoneDisplay/PhoneDisplay";
import { TimezoneDisplay } from "@/frontend/common/components/ui/display/timezoneDisplay/TimezoneDisplay";
import { TimezoneSelect } from "@/frontend/common/components/ui/input/timezoneSelect/TimezoneSelect";
import type { ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import { ProfileFieldRow } from "@/frontend/common/views/dashboard/profile/shared/ProfileFieldRow";
import type { ProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import { useProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/useProfileSharedBaseLabels";

type CoreContactFormFields = {
  phone?: string;
  timezone?: string;
};

type CoreContactViewProps = {
  readonly mode: "view";
  readonly scope?: ProfileScope;
  readonly phone: string | null | undefined;
  readonly timezone?: string | null;
  readonly sectionTitle: string;
  readonly phoneLabel: string;
  readonly timezoneLabel?: string;
  readonly baseLabels?: ProfileSharedBaseLabels;
};

type CoreContactEditWithRegisterProps = {
  readonly mode: "edit";
  readonly scope?: ProfileScope;
  readonly sectionTitle: string;
  readonly phoneLabel: string;
  readonly timezoneLabel?: string;
  readonly baseLabels?: ProfileSharedBaseLabels;
  readonly register: UseFormRegister<CoreContactFormFields>;
};

type CoreContactEditWithControlProps<
  T extends CoreContactFormFields & FieldValues = CoreContactFormFields & FieldValues,
> = {
  readonly mode: "edit";
  readonly scope?: ProfileScope;
  readonly sectionTitle: string;
  readonly phoneLabel: string;
  readonly timezoneLabel?: string;
  readonly baseLabels?: ProfileSharedBaseLabels;
  readonly control: Control<T>;
};

type CoreContactSectionProps<T extends CoreContactFormFields & FieldValues = CoreContactFormFields & FieldValues> =
  | CoreContactViewProps
  | CoreContactEditWithRegisterProps
  | CoreContactEditWithControlProps<T>;

function isCoreContactFieldPath<T extends CoreContactFormFields & FieldValues>(value: string): value is FieldPath<T> {
  return typeof value === "string";
}

function coreContactFieldPath<T extends CoreContactFormFields & FieldValues>(name: string): FieldPath<T> {
  if (!isCoreContactFieldPath<T>(name)) {
    throw new Error(`Invalid core contact field path: ${name}`);
  }
  return name;
}

function CoreContactEditSection<T extends CoreContactFormFields & FieldValues>({
  props,
  contactEditable,
}: {
  readonly props: CoreContactEditWithControlProps<T> | CoreContactEditWithRegisterProps;
  readonly contactEditable: boolean;
}) {
  const showTimezone = Boolean(props.timezoneLabel);

  return (
    <SectionPanel title={props.sectionTitle}>
      <Stack spacing={2}>
        {"control" in props ? (
          <PhoneFormField
            name={coreContactFieldPath<T>("phone")}
            control={props.control}
            label={props.phoneLabel}
            disabled={!contactEditable}
          />
        ) : (
          <TextField
            label={props.phoneLabel}
            fullWidth
            size="small"
            disabled={!contactEditable}
            {...props.register("phone")}
          />
        )}
        {showTimezone && "control" in props ? (
          <Controller
            name={coreContactFieldPath<T>("timezone")}
            control={props.control}
            render={({ field, fieldState }) => (
              <TimezoneSelect
                value={field.value ? toGraphqlIanaTimezone(field.value) : null}
                onChangeAction={value => {
                  field.onChange(value ? fromGraphqlIanaTimezone(value) : "");
                }}
                onBlurAction={field.onBlur}
                label={props.timezoneLabel}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                fullWidth
                disabled={!contactEditable}
              />
            )}
          />
        ) : null}
        {showTimezone && "register" in props ? (
          <TextField
            label={props.timezoneLabel}
            fullWidth
            size="small"
            disabled={!contactEditable}
            {...props.register("timezone")}
          />
        ) : null}
      </Stack>
    </SectionPanel>
  );
}

export function CoreContactSection<T extends CoreContactFormFields & FieldValues = CoreContactFormFields & FieldValues>(
  props: CoreContactSectionProps<T>
) {
  const fallbackBaseLabels = useProfileSharedBaseLabels();
  const t = props.baseLabels ?? fallbackBaseLabels;
  const { canView, canEdit, canViewField } = useProfileFieldAccess({ scope: props.scope });
  const showTimezone = Boolean(props.timezoneLabel);

  if (!canView("core_contact")) {
    return null;
  }

  if (props.mode === "edit") {
    return <CoreContactEditSection props={props} contactEditable={canEdit("core_contact")} />;
  }

  const showPhone = canViewField("core_contact");
  const showTimezoneValue = showTimezone && canViewField("core_contact");

  return (
    <SectionPanel title={props.sectionTitle}>
      <Stack spacing={1}>
        {showPhone ? (
          <ProfileFieldRow
            icon={PhoneOutlined}
            label={props.phoneLabel}
            value={<PhoneDisplay phone={props.phone} fallback={t.notSet} />}
          />
        ) : null}
        {showTimezoneValue ? (
          <ProfileFieldRow
            icon={ScheduleOutlined}
            label={props.timezoneLabel ?? ""}
            value={<TimezoneDisplay timezone={props.timezone} fallback={t.notSet} />}
          />
        ) : null}
      </Stack>
    </SectionPanel>
  );
}
