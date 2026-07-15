"use client";

import PhoneOutlined from "@mui/icons-material/PhoneOutlined";
import { Stack, TextField } from "@mui/material";
import type { Control, FieldPath, UseFormRegister } from "react-hook-form";
import { PhoneFormField, SectionPanel } from "@/frontend/common/components/ui";
import { PhoneDisplay } from "@/frontend/common/components/ui/display/phoneDisplay/PhoneDisplay";
import type { ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ProfileFieldRow } from "@/frontend/common/views/dashboard/profile/shared/ProfileFieldRow";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import { useAppTranslation } from "@/shared/locale/client";

type CoreContactFormFields = {
  phone?: string;
};

type CoreContactViewProps = {
  readonly mode: "view";
  readonly scope?: ProfileScope;
  readonly phone: string | null | undefined;
  readonly sectionTitle: string;
  readonly phoneLabel: string;
};

type CoreContactEditWithRegisterProps = {
  readonly mode: "edit";
  readonly scope?: ProfileScope;
  readonly sectionTitle: string;
  readonly phoneLabel: string;
  readonly register: UseFormRegister<CoreContactFormFields>;
};

type CoreContactEditWithControlProps<T extends CoreContactFormFields = CoreContactFormFields> = {
  readonly mode: "edit";
  readonly scope?: ProfileScope;
  readonly sectionTitle: string;
  readonly phoneLabel: string;
  readonly control: Control<T>;
};

type CoreContactSectionProps<T extends CoreContactFormFields = CoreContactFormFields> =
  | CoreContactViewProps
  | CoreContactEditWithRegisterProps
  | CoreContactEditWithControlProps<T>;

export function CoreContactSection<T extends CoreContactFormFields = CoreContactFormFields>(
  props: CoreContactSectionProps<T>
) {
  const t = useAppTranslation("profile");
  const { canView, showField } = useProfileFieldAccess({ scope: props.scope });

  if (!canView("core_contact")) {
    return null;
  }

  if (props.mode === "edit") {
    return (
      <SectionPanel title={props.sectionTitle}>
        {"control" in props ? (
          <PhoneFormField name={"phone" as FieldPath<T>} control={props.control} label={props.phoneLabel} />
        ) : (
          <TextField label={props.phoneLabel} fullWidth size="small" {...props.register("phone")} />
        )}
      </SectionPanel>
    );
  }

  if (!showField(props.phone, "core_contact")) {
    return <ProfileRestrictedSection title={props.sectionTitle} />;
  }

  return (
    <SectionPanel title={props.sectionTitle}>
      <Stack spacing={1}>
        <ProfileFieldRow
          icon={PhoneOutlined}
          label={props.phoneLabel}
          value={<PhoneDisplay phone={props.phone} fallback={t.notSet} />}
        />
      </Stack>
    </SectionPanel>
  );
}
