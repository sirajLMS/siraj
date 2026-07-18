// NEW FOR PLAN v5 (lifted from frontend/{mobile,desktop}/components/ui/display/meetingConfig/MeetingJoinAction.{mobile,desktop}.tsx)

import type {
  MeetingJoinActionProps,
  MeetingJoinEmptyRole,
} from "@/frontend/common/components/ui/display/meetingConfig/types";
import type { EffectiveMeetingFieldsFragment } from "@/frontend/common/graphql/types/meeting-class-config.operations";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import { EffectiveMeetingSource } from "@/frontend/common/types/meeting-class-config.graphql.types";
import type { MeetingConfigDisplayLabels, MeetingConfigJoinLabels } from "@/shared/locale";

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
  const normalized = String(source ?? "").toLowerCase();
  if (normalized === EffectiveMeetingSource.Class) return t.sourceClass;
  if (normalized === EffectiveMeetingSource.Recurring) return t.sourceRecurring;
  if (normalized === EffectiveMeetingSource.Teacher) return t.sourceTeacher;
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
      globalThis.open(resolvedUrl, "_blank", "noopener,noreferrer");
    }
  };
}
