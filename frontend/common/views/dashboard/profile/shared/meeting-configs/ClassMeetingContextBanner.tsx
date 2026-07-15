"use client";

import { Alert, Chip, Stack } from "@mui/material";
import type { EffectiveMeetingFieldsFragment } from "@/frontend/common/graphql/types/meeting-class-config.operations";
import { EffectiveMeetingSource } from "@/frontend/common/types/meeting-class-config.graphql.types";
import { useAppTranslation } from "@/shared/locale/client";

export type ClassMeetingContextBannerProps = {
  readonly effectiveMeeting?: EffectiveMeetingFieldsFragment | null;
  readonly hasScopeConfigs: boolean;
};

function resolveSourceKey(source: EffectiveMeetingSource | string | null | undefined): string {
  const normalized = String(source ?? "").toLowerCase();
  if (normalized === EffectiveMeetingSource.Class) return "sourceClass";
  if (normalized === EffectiveMeetingSource.Recurring) return "sourceRecurring";
  if (normalized === EffectiveMeetingSource.Teacher) return "sourceTeacher";
  return "sourceNone";
}

export function ClassMeetingContextBanner({ effectiveMeeting, hasScopeConfigs }: ClassMeetingContextBannerProps) {
  const t = useAppTranslation("ui.meetingConfig.classScope");
  const tDisplay = useAppTranslation("ui.meetingConfig.display");

  if (!effectiveMeeting && !hasScopeConfigs) return null;

  const sourceKey = resolveSourceKey(effectiveMeeting?.source);
  const sourceLabel = tDisplay[sourceKey as "sourceClass" | "sourceRecurring" | "sourceTeacher" | "sourceNone"];
  const isClassOverride = effectiveMeeting?.source === EffectiveMeetingSource.Class;
  const isInherited = effectiveMeeting?.source === EffectiveMeetingSource.Teacher && !hasScopeConfigs;

  return (
    <Stack spacing={1}>
      {effectiveMeeting ? (
        <Alert severity="info" sx={{ typography: "bodySm" }}>
          {t.effectiveSourceBanner(sourceLabel)}
        </Alert>
      ) : null}
      {isClassOverride || (hasScopeConfigs && effectiveMeeting?.source === EffectiveMeetingSource.Class) ? (
        <Chip size="small" color="warning" label={t.overrideActive} />
      ) : null}
      {isInherited ? <Chip size="small" variant="outlined" label={t.inheritedFromTeacher} /> : null}
    </Stack>
  );
}
