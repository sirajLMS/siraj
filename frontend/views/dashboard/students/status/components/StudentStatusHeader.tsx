"use client";

import { useViewport } from "@/frontend/common/hooks/useViewport";
import { StudentStatusHeaderMobile } from "@/frontend/mobile/views/dashboard/students/status/components/studentStatusHeader.mobile";
import { StudentStatusHeaderDesktop } from "@/frontend/views/dashboard/students/status/components/studentStatusHeader.desktop";
import type { StudentStatusHeaderProps } from "@/frontend/views/dashboard/students/status/types";

export function StudentStatusHeader({ student, embedded = false }: Readonly<StudentStatusHeaderProps>) {
  const { isMobile } = useViewport();

  if (isMobile) {
    return <StudentStatusHeaderMobile student={student} embedded={embedded} />;
  }

  return <StudentStatusHeaderDesktop student={student} embedded={embedded} />;
}
