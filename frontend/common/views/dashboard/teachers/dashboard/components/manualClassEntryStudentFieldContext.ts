import { createContext } from "react";

export interface ManualClassEntryStudentFieldContextValue {
  readonly studentId: string;
  readonly setStudentId: (value: string) => void;
  readonly disabled: boolean;
}

export const ManualClassEntryStudentFieldContext = createContext<ManualClassEntryStudentFieldContextValue | null>(null);
