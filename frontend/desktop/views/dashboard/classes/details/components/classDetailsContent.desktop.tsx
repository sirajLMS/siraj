"use client";

import { ClassDetailsContentShared } from "@/frontend/common/views/dashboard/classes/details/components/classDetailsContentShared";
import type { ClassDetailsContentProps } from "@/frontend/common/views/dashboard/classes/details/types";
import { ClassDetailsHeaderDesktop } from "@/frontend/desktop/views/dashboard/classes/details/components/classDetailsHeader.desktop";

export function ClassDetailsContentDesktop(props: Readonly<ClassDetailsContentProps>) {
  return <ClassDetailsContentShared props={props} slots={{ Header: ClassDetailsHeaderDesktop }} />;
}
