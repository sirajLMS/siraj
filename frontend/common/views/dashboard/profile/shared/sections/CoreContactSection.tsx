"use client";

import PhoneOutlined from "@mui/icons-material/PhoneOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import { Stack } from "@mui/material";
import type { FieldValues } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui";
import { PhoneDisplay } from "@/frontend/common/components/ui/display/phoneDisplay/PhoneDisplay";
import { TimezoneDisplay } from "@/frontend/common/components/ui/display/timezoneDisplay/TimezoneDisplay";
import { ProfileFieldRow } from "@/frontend/common/views/dashboard/profile/shared/ProfileFieldRow";
import { CoreContactEditSection } from "@/frontend/common/views/dashboard/profile/shared/sections/CoreContactSection.parts";
import type {
  CoreContactFormFields,
  CoreContactSectionProps,
} from "@/frontend/common/views/dashboard/profile/shared/sections/CoreContactSection.types";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import { useProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/useProfileSharedBaseLabels";

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
