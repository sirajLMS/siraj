import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { AvailabilityStatusPothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import type { BookReturnType } from "@/backend/types";

export const BookRef = gqlSchemaBuilder.objectRef<BookReturnType>("Book");

export const BookPothosObject = BookRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    availabilityStatus: t.expose("availabilityStatus", { type: AvailabilityStatusPothosObject }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});
