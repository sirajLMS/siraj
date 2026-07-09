import { SchedulingRepository } from "@/backend/db/repo";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  CreateTeacherNoteInputPothos,
  TeacherImportantNotePothosObject,
  UpdateTeacherNoteInputPothos,
} from "@/backend/graphql/pothos/teacher-notes.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { TeacherNotesService } from "@/backend/services/subject/teacher-notes.service";

gqlSchemaBuilder.mutationField("createTeacherImportantNote", t =>
  t.field({
    type: TeacherImportantNotePothosObject,
    args: {
      input: t.arg({ type: CreateTeacherNoteInputPothos, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      const teacher = await SchedulingRepository.getTeacherByUserId(userId);
      const teacherId = teacher?.id ?? null;
      return TeacherNotesService.createNote(
        userId,
        {
          title: args.input.title,
          body: args.input.body ?? null,
          isPublished: args.input.isPublished ?? undefined,
          priority: args.input.priority ?? undefined,
          startsAt: args.input.startsAt ?? null,
          expiresAt: args.input.expiresAt ?? null,
        },
        teacherId,
        ctx.locale
      );
    },
  })
);

gqlSchemaBuilder.mutationField("updateTeacherImportantNote", t =>
  t.field({
    type: TeacherImportantNotePothosObject,
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateTeacherNoteInputPothos, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      return TeacherNotesService.updateNote(
        userId,
        args.id,
        {
          title: args.input.title ?? undefined,
          body: args.input.body ?? null,
          isPublished: args.input.isPublished ?? undefined,
          priority: args.input.priority ?? undefined,
          startsAt: args.input.startsAt ?? null,
          expiresAt: args.input.expiresAt ?? null,
        },
        ctx.locale
      );
    },
  })
);

gqlSchemaBuilder.mutationField("deleteTeacherImportantNote", t =>
  t.field({
    type: "Boolean",
    args: {
      id: t.arg.id({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      await TeacherNotesService.deleteNote(userId, args.id, ctx.locale);
      return true;
    },
  })
);
