// NEW FOR PLAN v5: lifted makeHandleJoin + resolve* helpers (+ JoinContext type) from
//   frontend/common/components/ui/display/meetingConfig/utils/meetingJoinAction.utils.ts
//   to frontend/common/lib/meetingJoinAction.ts so tier importers use a §2.4-allowlisted path.
//   `makeHandleJoin` now delegates window opening to safeOpenWindow (§3 N19 fix).

import type {
  MeetingJoinActionProps,
  MeetingJoinEmptyRole,
} from "@/frontend/common/components/ui/display/meetingConfig/types/meetingJoinAction.types";
import type { EffectiveMeetingFieldsFragment } from "@/frontend/common/graphql/types/meeting-class-config.operations";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import { safeOpenWindow } from "@/frontend/common/lib/safeOpenWindow";
import { EffectiveMeetingSource } from "@/frontend/common/types/meeting-class-config.graphql.types";
import type { MeetingConfigDisplayLabels, MeetingConfigJoinLabels } from "@/shared/locale";

// Re-export the canonical props types so common-side importers can resolve them from the lib path.
export type { MeetingJoinActionProps, MeetingJoinEmptyRole };

export function resolveJoinUrl(props: MeetingJoinActionProps): string | null {
  const url = props.meeting?.joinUrl ?? props.joinUrl;
  return url?.trim() ? url.trim() : null;
}

export function resolveEmptyMessage(t: MeetingConfigJoinLabels, emptyRole?: MeetingJoinEmptyRole): string {
  if (emptyRole === "teacher") return t.emptyTeacher;
  if (emptyRole === "class") return t.emptyClass;
  if (emptyRole === "parent") return t.emptyParent;
  return t.joinUnavailable;
}

export function resolveSourceLabel(
  source: EffectiveMeetingSource | string | null | undefined,
  t: MeetingConfigDisplayLabels
): string {
  const normalized = (source ?? "").toLowerCase();
  if (normalized === String(EffectiveMeetingSource.Class)) return t.sourceClass;
  if (normalized === String(EffectiveMeetingSource.Recurring)) return t.sourceRecurring;
  if (normalized === String(EffectiveMeetingSource.Teacher)) return t.sourceTeacher;
  return t.sourceNone;
}

export type ResolveTooltipInput = {
  readonly hasUrl: boolean;
  readonly meeting?: EffectiveMeetingFieldsFragment | null;
  readonly locale: string;
  readonly t: MeetingConfigJoinLabels;
  readonly tDisplay: MeetingConfigDisplayLabels;
  readonly emptyRole?: MeetingJoinEmptyRole;
};

export function resolveTooltip({ hasUrl, meeting, locale, t, tDisplay, emptyRole }: ResolveTooltipInput): string {
  if (!hasUrl) {
    return resolveEmptyMessage(t, emptyRole);
  }

  const providerName = meeting?.providerName
    ? resolveLocalizedString(meeting.providerName, locale)
    : (meeting?.providerSlug ?? "");
  const sourceLabel = meeting?.source ? resolveSourceLabel(meeting.source, tDisplay) : "";

  if (providerName && sourceLabel) {
    return t.providerTooltip(providerName, sourceLabel);
  }
  if (providerName) return providerName;
  return t.openInNewTab;
}

export type JoinContext = {
  readonly t: MeetingConfigJoinLabels;
  readonly tDisplay: MeetingConfigDisplayLabels;
  readonly hasUrl: boolean;
  readonly supportsAutoGeneration: boolean;
  readonly resolvedUrl: string | null;
  readonly buttonLabel: string;
  readonly tooltip: string;
  readonly id?: string;
  readonly providerLogo: string | null;
  readonly onJoinAction?: () => void;
};

export function makeHandleJoin(resolvedUrl: string | null, onJoinAction?: () => void): () => void {
  return () => {
    if (onJoinAction) {
      onJoinAction();
      return;
    }
    if (resolvedUrl) {
      safeOpenWindow(resolvedUrl);
    }
  };
}
