// NEW FOR PLAN v5 (lifted from inline tier declarations in paymentMethodTypeFields.{mobile,desktop}.tsx
// and PaymentMethodTypeFields.tsx so both tiers and the common wrapper share one pure-data helper
// per the one-per-contract rule (specs.md §5 / §5 byte-identical twin modules).

import type { FieldPath, FieldValues } from "react-hook-form";

export function resolveFieldName<T extends FieldValues>(prefix: string | undefined, field: string): FieldPath<T> {
  return (prefix ? `${prefix}.${field}` : field) as FieldPath<T>;
}
