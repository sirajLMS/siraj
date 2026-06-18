import { ClassPerformanceRepository } from "@/backend/db/repo/class-performance.repository";
import { SchedulingRepository } from "@/backend/db/repo/scheduling.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { ClassInstanceDetailPothosObject, ClassStatusEventPothosObject } from "../pothos/class-session.pothos";
import { buildClassInstanceDetail } from "../utils/class-session.utils";

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
      const instance = await SchedulingRepository.getClassInstanceById(args.id);
      if (!instance) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("notFound"));
      }
      const perf = await ClassPerformanceRepository.getByClassInstanceId(args.id);
      return buildClassInstanceDetail(instance, perf);
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
      return SchedulingRepository.getClassStatusEvents(args.classInstanceId);
    },
  })
);
