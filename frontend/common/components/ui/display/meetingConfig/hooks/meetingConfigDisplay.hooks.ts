// NEW FOR PLAN v5 (lifted from frontend/{mobile,desktop}/components/ui/display/meetingConfig/MeetingJoinAction.{mobile,desktop}.tsx)

import type { MeetingJoinActionProps } from "@/frontend/common/components/ui/display/meetingConfig/types";
import {
  type JoinContext,
  resolveJoinUrl,
  resolveTooltip,
} from "@/frontend/common/components/ui/display/meetingConfig/utils/meetingJoinAction.utils";
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
