"use client";

import { BaseCard } from "@/frontend/common/components/ui";
import { SupportContactShared } from "@/frontend/common/views/dashboard/teachers/futureSchedule/components/__shared__/supportContactShared";
import type { SupportContactProps } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";
import { DesktopUserAvatar } from "@/frontend/desktop/components/ui/avatar/DesktopUserAvatar";
import { DesktopPhoneDisplay } from "@/frontend/desktop/components/ui/display";

export function SupportContactDesktop(props: Readonly<SupportContactProps>) {
  return (
    <SupportContactShared
      {...props}
      options={{
        CardComponent: BaseCard,
        AvatarComponent: DesktopUserAvatar,
        PhoneDisplayComponent: DesktopPhoneDisplay,
        cardPadding: 3,
        titleVariant: "bodyMd",
        titleMarginBottom: 2,
        stackSpacing: 2,
        avatarSize: 40,
        phoneTypographyVariant: "bodyMd",
        buttonMarginTop: 3,
        buttonBorderRadius: 2,
        buttonPaddingY: 1,
      }}
    />
  );
}
