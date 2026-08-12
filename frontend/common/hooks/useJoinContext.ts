import type { MeetingJoinActionProps } from "@/frontend/common/components/ui/display/meetingConfig/types";
import { type JoinContext, resolveJoinUrl, resolveTooltip } from "@/frontend/common/lib/meetingJoinAction";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { Translation, useAppTranslation } from "@/shared/locale";

export function useJoinContext(props: MeetingJoinActionProps): JoinContext {
  const meetingConfig = useAppTranslation(Translation.Ui.MeetingConfig);
  const t = meetingConfig.join;
  const tDisplay = meetingConfig.display;
  const locale = useAppLocale();
  const resolvedUrl = resolveJoinUrl(props);
  const hasUrl = Boolean(resolvedUrl) && !props.disabled;
  const buttonLabel = props.label ?? t.joinMeeting;
  const tooltip = resolveTooltip({ hasUrl, meeting: props.meeting, locale, t, tDisplay, emptyRole: props.emptyRole });
  const providerLogo = props.meeting?.logoUrl?.trim() || null;
  const supportsAutoGeneration = props.meeting?.supportsAutoGeneration === true;
  return {
    t,
    tDisplay,
    hasUrl,
    supportsAutoGeneration,
    resolvedUrl,
    buttonLabel,
    tooltip,
    id: props.id,
    providerLogo,
    onJoinAction: props.onJoinAction,
  };
}
