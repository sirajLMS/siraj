import type { InputFieldBuilder } from "@pothos/core";
import type { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";

type BuilderTypes = typeof gqlSchemaBuilder extends { $inferSchemaTypes: infer T } ? T : never;
type PothosInputFieldBuilder = InputFieldBuilder<BuilderTypes, "InputObject">;

/**
 * Shared input field definitions for ClassSubject create/update inputs.
 * @param fieldBuilder - Pothos input field builder
 * @param required - Specifies which fields are required (true for Create, false for Update)
 */
export function classSubjectInputFields(
  fieldBuilder: PothosInputFieldBuilder,
  required: { name: boolean; slug: boolean; categoryId: boolean }
) {
  return {
    name: fieldBuilder.string({ required: required.name }),
    slug: fieldBuilder.string({ required: required.slug }),
    categoryId: fieldBuilder.string({ required: required.categoryId }),
    description: fieldBuilder.string({ required: false }),
    avatarUrl: fieldBuilder.string({ required: false }),
    isActive: fieldBuilder.boolean({ required: false }),
    sortOrder: fieldBuilder.int({ required: false }),
    hourlyRate: fieldBuilder.string({ required: false }),
    rateCurrency: fieldBuilder.field({ type: CurrencyCodePothosObject, required: false }),
  };
}
