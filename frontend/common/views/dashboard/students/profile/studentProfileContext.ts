import { createContext, useContext } from "react";
import type { StudentProfileContextValue } from "@/frontend/common/views/dashboard/students/profile/studentProfileContext.types";

export const StudentProfileContext = createContext<StudentProfileContextValue | null>(null);

export function useStudentProfileContext(): StudentProfileContextValue | null {
  return useContext(StudentProfileContext);
}
