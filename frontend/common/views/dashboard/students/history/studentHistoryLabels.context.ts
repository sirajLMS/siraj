import { createContext } from "react";
import type { StudentHistoryLabels } from "@/shared/locale/types/dashboard/students/history";

export const StudentHistoryLabelsContext = createContext<StudentHistoryLabels | null>(null);
