import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  CreateRecurringClassInputPothosObject,
  CreateRecurringClassResultPothosObject,
} from "@/backend/graphql/pothos/classes/recurring-class.pothos";
import { RecurringClassService } from "@/backend/services/schedule/recurring-class.service";

gqlSchemaBuilder.mutationField("createRecurringClass", t =>
  t.field({
    type: CreateRecurringClassResultPothosObject,
    args: {
      input: t.arg({ type: CreateRecurringClassInputPothosObject, required: true }),
    },
    authScopes: { superAdmin: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user?.id) {
        const tErrors = await ctx.t("errors");
        throw new Error(tErrors.unauthorized);
      }
      const tErrors = await ctx.t("errors");

      return await RecurringClassService.createRecurringClass(
        ctx.user.id,
        {
          studentId: args.input.studentId,
          teacherId: args.input.teacherId,
          durationMinutes: args.input.durationMinutes,
          defaultStartTime: args.input.defaultStartTime,
          timezone: args.input.timezone,
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
        tErrors
      );
    },
  })
);
