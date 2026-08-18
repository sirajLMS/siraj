"use client";

import { Alert, Stack } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { EffectiveMeetingSource } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { EffectiveMeetingFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import type { MeetingConfigClassScopeLabels, MeetingConfigDisplayLabels } from "@/shared/locale/types/ui";

export type ClassMeetingContextBannerProps = {
  readonly effectiveMeeting?: EffectiveMeetingFieldsFragment | null;
  readonly hasScopeConfigs: boolean;
  readonly labels: {
    readonly classScope: MeetingConfigClassScopeLabels;
    readonly display: MeetingConfigDisplayLabels;
  };
};

type MeetingSourceKey = "sourceClass" | "sourceNone" | "sourceRecurring" | "sourceTeacher";

function resolveSourceKey(source: EffectiveMeetingSource | string | null | undefined): MeetingSourceKey {
  const normalized = (source ?? "").toLowerCase();
  if (normalized === (EffectiveMeetingSource.Class as string)) return "sourceClass";
  if (normalized === (EffectiveMeetingSource.Recurring as string)) return "sourceRecurring";
  if (normalized === (EffectiveMeetingSource.Teacher as string)) return "sourceTeacher";
  return "sourceNone";
}

export function ClassMeetingContextBanner({
  effectiveMeeting,
  hasScopeConfigs,
  labels,
}: ClassMeetingContextBannerProps) {
  const t = labels.classScope;
  const tDisplay = labels.display;

  if (!effectiveMeeting && !hasScopeConfigs) return null;

  const sourceKey = resolveSourceKey(effectiveMeeting?.source);
  const sourceLabel = tDisplay[sourceKey];
  const isClassOverride = effectiveMeeting?.source === EffectiveMeetingSource.Class;
  const isInherited = effectiveMeeting?.source === EffectiveMeetingSource.Teacher && !hasScopeConfigs;
  const isUrlPending = effectiveMeeting?.supportsAutoGeneration === true && !effectiveMeeting?.joinUrl;

  return (
    <Stack spacing={1}>
      {effectiveMeeting ? (
        <Alert severity="info" sx={{ typography: "bodyMd" }}>
          {t.effectiveSourceBanner(sourceLabel)}
        </Alert>
      ) : null}
      {isClassOverride || (hasScopeConfigs && effectiveMeeting?.source === EffectiveMeetingSource.Class) ? (
        <StatusBadge category="syncStatus" status="override" label={t.overrideActive} />
      ) : null}
      {isInherited ? <StatusBadge category="syncStatus" status="inherited" label={t.inheritedFromTeacher} /> : null}
      {isUrlPending ? <StatusBadge category="syncStatus" status="pending" label={tDisplay.urlPending} /> : null}
    </Stack>
  );
}
