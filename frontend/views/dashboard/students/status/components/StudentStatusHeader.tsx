"use client";

import { useViewport } from "@/frontend/hooks/useViewport";
import { StudentStatusHeaderDesktop } from "@/frontend/views/dashboard/students/status/components/studentStatusHeader.desktop";
import { StudentStatusHeaderMobile } from "@/frontend/views/dashboard/students/status/components/studentStatusHeader.mobile";
import type { StudentStatusHeaderProps } from "@/frontend/views/dashboard/students/status/types";

export function StudentStatusHeader({ student, embedded = false }: Readonly<StudentStatusHeaderProps>) {
  const { isMobile } = useViewport();

  if (isMobile) {
    return <StudentStatusHeaderMobile student={student} embedded={embedded} />;
  }

  return <StudentStatusHeaderDesktop student={student} embedded={embedded} />;
}
