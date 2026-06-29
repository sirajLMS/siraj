import { getBackendTranslations } from "@/backend/lib/intl";
import { ScheduleService } from "@/backend/services/schedule/schedule.service";
import { ClassSessionService } from "@/backend/services/session/class-session.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import {
  ClassInstanceDetailPothosObject,
  ClassStatusEventPothosObject,
  TeacherFutureSchedulePothosObject,
} from "../pothos/class-session.pothos";

gqlSchemaBuilder.queryField("classInstance", t =>
  t.field({
    type: ClassInstanceDetailPothosObject,
    args: { id: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      return ClassSessionService.getClassInstanceDetail(ctx.user.id, args.id, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("classStatusEvents", t =>
  t.field({
    type: [ClassStatusEventPothosObject],
    args: { classInstanceId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      return ClassSessionService.getClassStatusEvents(ctx.user.id, args.classInstanceId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("teacherFutureSchedule", t =>
  t.field({
    type: TeacherFutureSchedulePothosObject,
    args: {
      teacherId: t.arg.string({ required: false }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      return ScheduleService.getTeacherFutureSchedule(ctx.user.id, args.teacherId ?? undefined, ctx.locale);
    },
  })
);
