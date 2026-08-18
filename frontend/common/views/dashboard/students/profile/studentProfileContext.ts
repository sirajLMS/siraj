import { createContext } from "react";
import type { StudentProfileContextValue } from "@/frontend/common/views/dashboard/students/profile/studentProfileContext.types";

export const StudentProfileContext = createContext<StudentProfileContextValue | null>(null);
