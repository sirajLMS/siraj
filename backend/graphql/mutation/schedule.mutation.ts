import { getBackendTranslations } from "@/backend/lib/intl";
import { RecurringClassService } from "@/backend/services/schedule/recurring-class.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import {
  CreateRecurringClassInputPothosObject,
  CreateRecurringClassResultPothosObject,
} from "../pothos/recurring-class.pothos";

gqlSchemaBuilder.mutationField("createRecurringClass", t =>
  t.field({
    type: CreateRecurringClassResultPothosObject,
    args: {
      input: t.arg({ type: CreateRecurringClassInputPothosObject, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user?.id) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }

      return await RecurringClassService.createRecurringClass(
        ctx.user.id,
        {
          studentId: args.input.studentId,
          teacherId: args.input.teacherId,
          durationMinutes: args.input.durationMinutes,
          defaultStartTime: args.input.defaultStartTime,
          timezone: args.input.timezone,
          timezoneId: args.input.timezoneId || undefined,
          effectiveFrom: args.input.effectiveFrom || undefined,
          effectiveUntil: args.input.effectiveUntil || undefined,
          days: args.input.days.map(d => ({
            dayOfWeek: d.dayOfWeek as
              | "MONDAY"
              | "TUESDAY"
              | "WEDNESDAY"
              | "THURSDAY"
              | "FRIDAY"
              | "SATURDAY"
              | "SUNDAY",
            startTime: d.startTime,
            isActive: d.isActive,
          })),
          classType: args.input.classType as "REGULAR" | "TRIAL" | "ADVANCE" | undefined,
          generateInstancesForWeeks: args.input.generateInstancesForWeeks || undefined,
        },
        ctx.locale
      );
    },
  })
);
