"use client";

import { DateNavigatorDesktop } from "@/frontend/common/components/ui/filter/dateNavigator.desktop";
import { DateNavigatorMobile } from "@/frontend/common/components/ui/filter/dateNavigator.mobile";
import { useViewport } from "@/frontend/common/hooks/useViewport";

export interface DateNavigatorProps {
  readonly dateValue: string;
  readonly todayLabel: string;
  readonly previousDayLabel: string;
  readonly nextDayLabel: string;
  readonly dateLabel?: string;
  readonly onDateChange: (date: string) => void;
}

export function DateNavigator(props: Readonly<DateNavigatorProps>) {
  const { isMobile } = useViewport();
  if (isMobile) {
    return <DateNavigatorMobile {...props} />;
  }
  return <DateNavigatorDesktop {...props} />;
}
