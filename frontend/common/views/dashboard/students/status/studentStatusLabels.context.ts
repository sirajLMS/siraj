import { createContext } from "react";
import type { StudentStatusLabels } from "@/shared/locale/types/dashboard/students/status";

export const StudentStatusLabelsContext = createContext<StudentStatusLabels | null>(null);
