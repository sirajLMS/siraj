"use client";

import { ClassDetailsContentShared } from "@/frontend/common/views/dashboard/classes/details/components/classDetailsContentShared";
import type { ClassDetailsContentProps } from "@/frontend/common/views/dashboard/classes/details/types";
import { ClassDetailsHeaderMobile } from "@/frontend/mobile/views/dashboard/classes/details/components/classDetailsHeader.mobile";

export function ClassDetailsContentMobile(props: Readonly<ClassDetailsContentProps>) {
  return <ClassDetailsContentShared props={props} slots={{ Header: ClassDetailsHeaderMobile }} />;
}
