// NEW FOR PLAN v5: lifted useJoinContext from
//   frontend/common/components/ui/display/meetingConfig/hooks/meetingConfigDisplay.hooks.ts
//   to frontend/common/hooks/useJoinContext.ts so tier importers use a §2.4-allowlisted path.

import type { MeetingJoinActionProps } from "@/frontend/common/components/ui/display/meetingConfig/types";
import { type JoinContext, resolveJoinUrl, resolveTooltip } from "@/frontend/common/lib/meetingJoinAction";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useAppTranslation } from "@/shared/locale";

export function useJoinContext(props: MeetingJoinActionProps): JoinContext {
  const meetingConfig = useAppTranslation().uiTranslations.meetingConfig;
  const t = meetingConfig.join;
  const tDisplay = meetingConfig.display;
  const locale = useAppLocale();
  const resolvedUrl = resolveJoinUrl(props);
  const hasUrl = Boolean(resolvedUrl) && !props.disabled;
  const buttonLabel = props.label ?? t.joinMeeting;
  const tooltip = resolveTooltip({ hasUrl, meeting: props.meeting, locale, t, tDisplay, emptyRole: props.emptyRole });
  const providerLogo = props.meeting?.logoUrl?.trim() || null;
  return {
    t,
    tDisplay,
    hasUrl,
    resolvedUrl,
    buttonLabel,
    tooltip,
    id: props.id,
    providerLogo,
    onJoinAction: props.onJoinAction,
  };
}
