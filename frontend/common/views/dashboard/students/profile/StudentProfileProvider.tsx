"use client";

import type * as React from "react";
import { StudentProfileContext } from "@/frontend/common/views/dashboard/students/profile/studentProfileContext";
import type { StudentProfileContextValue } from "@/frontend/common/views/dashboard/students/profile/studentProfileContext.types";

export function StudentProfileProvider({
  value,
  children,
}: {
  readonly value: StudentProfileContextValue;
  readonly children: React.ReactNode;
}) {
  return <StudentProfileContext.Provider value={value}>{children}</StudentProfileContext.Provider>;
}
