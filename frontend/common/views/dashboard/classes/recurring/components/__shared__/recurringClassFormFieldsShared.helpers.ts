import type { RecurringClassFormFieldsSharedOptions } from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/recurringClassFormFieldsShared.types";
import { CLASS_TYPE_OPTIONS, type ClassType } from "@/frontend/common/views/dashboard/classes/recurring/types";

const VALID_CLASS_TYPES: ReadonlySet<string> = new Set(CLASS_TYPE_OPTIONS);

export function isClassType(value: string): value is ClassType {
  return VALID_CLASS_TYPES.has(value);
}

export function makeFieldBoxSx() {
  return { flex: 1, minWidth: 0 };
}

export function makeSectionSx(options: RecurringClassFormFieldsSharedOptions) {
  return {
    display: "flex",
    gap: options.sectionGap,
    flexDirection: options.sectionDirection,
  };
}

export function makeAlignedSectionSx(options: RecurringClassFormFieldsSharedOptions) {
  const base = makeSectionSx(options);
  return options.sectionAlignItems ? { ...base, alignItems: options.sectionAlignItems } : base;
}
