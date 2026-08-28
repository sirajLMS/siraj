"use client";

import type * as React from "react";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { MeetingConfigListProps } from "@/frontend/common/components/ui/display/meetingConfig/types";

export type {
  MeetingConfigListItem,
  MeetingConfigListProps,
} from "@/frontend/common/components/ui/display/meetingConfig/types";

const lazyViews = createLazyView<MeetingConfigListProps>(
  () =>
    import("@/frontend/mobile/components/ui/display/meetingConfig/MeetingConfigList.mobile").then(m => ({
      default: m.MobileMeetingConfigList,
    })),
  () =>
    import("@/frontend/desktop/components/ui/display/meetingConfig/MeetingConfigList.desktop").then(m => ({
      default: m.DesktopMeetingConfigList,
    }))
);

/**
 * Viewport-tier switcher for the meeting config list. Delegates to
 * {@link MobileMeetingConfigList} (compact card options) or
 * {@link DesktopMeetingConfigList} (default card options); both tier variants
 * render the shared scaffold with their tier-locked options.
 */
export function MeetingConfigList(props: MeetingConfigListProps): React.ReactNode {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
