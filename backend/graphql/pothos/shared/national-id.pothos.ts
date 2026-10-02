import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import type { NationalIdValue } from "@/shared/lib/national-id";

/**
 * GraphQL object type for a national ID — `{ countryCode, number }`.
 * `number` is masked (`****1234`) in admin/staff views and unmasked in
 * own-profile views; `countryCode` is the country of issuance that drives
 * per-country format validation.
 */
export const NationalIdPothosObject = gqlSchemaBuilder.objectRef<NationalIdValue | null>("NationalId").implement({
  description: "National ID with its country of issuance",
  fields: t => ({
    countryCode: t.field({
      type: "String",
      nullable: true,
      resolve: parent => parent?.countryCode ?? null,
    }),
    number: t.field({
      type: "String",
      nullable: true,
      resolve: parent => parent?.number ?? null,
    }),
  }),
});

export const NationalIdInputPothosObject = gqlSchemaBuilder.inputRef<NationalIdValue>("NationalIdInput").implement({
  description: "National ID input with its country of issuance",
  fields: t => ({
    countryCode: t.string({ required: false, directives: { constraint: { maxLength: 10 } } }),
    number: t.string({ required: true, directives: { constraint: { maxLength: 255 } } }),
  }),
});
