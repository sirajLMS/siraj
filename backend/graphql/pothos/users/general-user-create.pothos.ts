import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { AccountStatusPothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { UserPothosObject } from "@/backend/graphql/pothos/users/user.pothos";
import type { GeneralUserCreateInput, GeneralUserCreateResult } from "@/backend/types";

export const GeneralUserCreateInputPothosObject = gqlSchemaBuilder
  .inputRef<GeneralUserCreateInput>("GeneralUserCreateInput")
  .implement({
    description: "Input for creating a general user with permission group assignment",
    fields: t => ({
      name: t.string({ required: true, directives: { constraint: { maxLength: 512 } } }),
      email: t.string({ required: true, directives: { constraint: { maxLength: 254 } } }),
      password: t.string({ required: true, directives: { constraint: { maxLength: 128 } } }),
      phone: t.string({ directives: { constraint: { maxLength: 50 } } }),
      groupSlug: t.string({ required: true, directives: { constraint: { maxLength: 100 } } }),
      status: t.field({ type: AccountStatusPothosObject }),
    }),
  });

export const GeneralUserCreateResultPothosObject = gqlSchemaBuilder
  .objectRef<GeneralUserCreateResult>("GeneralUserCreateResult")
  .implement({
    description: "Result of general user creation with assigned permission group",
    fields: t => ({
      id: t.string({ resolve: parent => parent.user.id }),
      user: t.field({ type: UserPothosObject, resolve: parent => parent.user }),
      assignedGroupSlug: t.exposeString("assignedGroupSlug"),
    }),
  });
