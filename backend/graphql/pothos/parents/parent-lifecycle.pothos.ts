import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { ParentStatusPothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
import type { ChangeParentLifecycleResult } from "@/backend/types";

export const ChangeParentLifecycleResultRef =
  gqlSchemaBuilder.objectRef<ChangeParentLifecycleResult>("ChangeParentLifecycleResult");

export const ChangeParentLifecycleResultPothosObject = ChangeParentLifecycleResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    lifecycleStatus: t.expose("lifecycleStatus", { type: ParentStatusPothosEnum }),
  }),
});
