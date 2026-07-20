import { createContext, useContext } from "react";

export interface ManualClassEntryStudentFieldContextValue {
  readonly studentId: string;
  readonly setStudentId: (value: string) => void;
  readonly disabled: boolean;
}

export const ManualClassEntryStudentFieldContext = createContext<ManualClassEntryStudentFieldContextValue | null>(null);

export function useManualClassEntryStudentField(): ManualClassEntryStudentFieldContextValue {
  const context = useContext(ManualClassEntryStudentFieldContext);
  if (!context) {
    throw new Error("useManualClassEntryStudentField must be used within ManualClassEntryDialog");
  }
  return context;
}
