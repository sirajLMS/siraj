import { useContext } from "react";
import { StudentProfileContext } from "@/frontend/common/views/dashboard/students/profile/studentProfileContext";
import type { StudentProfileContextValue } from "@/frontend/common/views/dashboard/students/profile/studentProfileContext.types";

export function useStudentProfileContext(): StudentProfileContextValue | null {
  return useContext(StudentProfileContext);
}
