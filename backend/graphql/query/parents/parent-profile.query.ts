// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { requireUserId } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { AssociatedStudentRef, ParentProfileRef } from "@/backend/graphql/pothos/parents/parent-profile.pothos";
import { ParentProfileService } from "@/backend/services";

gqlSchemaBuilder.queryField("parentProfile", t =>
  t.field({
    type: ParentProfileRef,
    authScopes: { loggedIn: true },
    nullable: true,
    args: {
      parentId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      return ParentProfileService.getProfile(requireUserId(ctx), args.parentId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("parentAssociatedStudents", t =>
  t.field({
    type: [AssociatedStudentRef],
    authScopes: { loggedIn: true },
    args: {
      parentId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      return ParentProfileService.getAssociatedStudents(requireUserId(ctx), args.parentId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("studentById", t =>
  t.field({
    type: AssociatedStudentRef,
    authScopes: { loggedIn: true },
    nullable: true,
    args: {
      studentId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      // Reusing AssociatedStudentRef but fetching a single one.
      // Need a student-specific service method or repository call.
      // AssociatedStudentResult is defined as { id, name, status, teacherName, ... }
      return ParentProfileService.getStudentById(requireUserId(ctx), args.studentId, ctx.locale);
    },
  })
);
