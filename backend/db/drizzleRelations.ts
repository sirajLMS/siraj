import { defineRelations } from "drizzle-orm";
import { authRelations } from "@/backend/db/drizzleRelations.auth.parts";
import { billingRelations } from "@/backend/db/drizzleRelations.billing.parts";
import { learningRelations } from "@/backend/db/drizzleRelations.learning.parts";
import { operationsRelations } from "@/backend/db/drizzleRelations.operations.parts";
import { peopleRelations } from "@/backend/db/drizzleRelations.people.parts";
import * as schema from "@/backend/db/schema";

export const relations = defineRelations(schema, r => ({
  ...authRelations(r),
  ...billingRelations(r),
  ...learningRelations(r),
  ...operationsRelations(r),
  ...peopleRelations(r),
}));
