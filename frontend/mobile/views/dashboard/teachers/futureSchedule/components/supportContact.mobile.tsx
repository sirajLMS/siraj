"use client";

import { SupportContactShared } from "@/frontend/common/views/dashboard/teachers/futureSchedule/components/__shared__/supportContactShared";
import type { SupportContactProps } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";
import { MobileUserAvatar } from "@/frontend/mobile/components/ui/avatar";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";
import { MobilePhoneDisplay } from "@/frontend/mobile/components/ui/display/phoneDisplay";

export function SupportContactMobile(props: Readonly<SupportContactProps>) {
  return (
    <SupportContactShared
      {...props}
      options={{
        CardComponent: MobileBaseCard,
        AvatarComponent: MobileUserAvatar,
        PhoneDisplayComponent: MobilePhoneDisplay,
        cardPadding: 2,
        titleVariant: "labelMd",
        titleMarginBottom: 1.5,
        stackSpacing: 1.5,
        avatarSize: 36,
        phoneTypographyVariant: "labelMd",
        buttonMarginTop: 2,
        buttonBorderRadius: 1.5,
        buttonPaddingY: 0.75,
      }}
    />
  );
}
