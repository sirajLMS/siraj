import { useContext } from "react";
import {
  ManualClassEntryStudentFieldContext,
  type ManualClassEntryStudentFieldContextValue,
} from "@/frontend/common/views/dashboard/teachers/dashboard/components/manualClassEntryStudentFieldContext";

export function useManualClassEntryStudentField(): ManualClassEntryStudentFieldContextValue {
  const context = useContext(ManualClassEntryStudentFieldContext);
  if (!context) {
    throw new Error("useManualClassEntryStudentField must be used within ManualClassEntryDialog");
  }
  return context;
}
