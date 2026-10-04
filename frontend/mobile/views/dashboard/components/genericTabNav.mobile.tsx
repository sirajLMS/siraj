"use client";

import {
  type GenericTabNavVariantProps,
  isDateTabNavProps,
} from "@/frontend/common/views/dashboard/components/genericTabNav.types";
import { DateTabNavMobile } from "@/frontend/mobile/views/dashboard/components/dateTabNav.mobile.parts";
import { DefaultTabNavMobile } from "@/frontend/mobile/views/dashboard/components/genericTabNav.mobile.parts";

export type GenericTabNavMobileViewProps = GenericTabNavVariantProps<string>;

export function GenericTabNavMobileView(props: Readonly<GenericTabNavMobileViewProps>) {
  if (props.tabs.length === 0) {
    return null;
  }

  if (isDateTabNavProps(props)) {
    return <DateTabNavMobile {...props} />;
  }

  return <DefaultTabNavMobile {...props} />;
}
