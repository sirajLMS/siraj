import type { PothosInputFieldBuilder } from "@/backend/graphql/pothos/shared/builder-types";
import { CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";

/**
 * Shared input field definitions for the carryover create/update inputs.
 * @param fieldBuilder - Pothos input field builder
 * @param required - Which fields are mandatory (all required for Create, none beyond `id` for Update)
 */
export function carryoverInputFields(
  fieldBuilder: PothosInputFieldBuilder,
  required: { payable: boolean; teacherCurrency: boolean }
) {
  return {
    fromDate: fieldBuilder.string({ required: false, directives: { constraint: { format: "date" } } }),
    toDate: fieldBuilder.string({ required: false, directives: { constraint: { format: "date" } } }),
    payable: fieldBuilder.string({ required: required.payable }),
    teacherCurrency: fieldBuilder.field({ type: CurrencyCodePothosObject, required: required.teacherCurrency }),
    studentsCount: fieldBuilder.int({ required: false }),
    studentsText: fieldBuilder.string({ required: false, directives: { constraint: { maxLength: 500 } } }),
    note: fieldBuilder.string({ required: false, directives: { constraint: { maxLength: 2000 } } }),
  };
}
