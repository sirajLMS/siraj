import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  CreateRecurringClassInputPothosObject,
  CreateRecurringClassResultPothosObject,
} from "@/backend/graphql/pothos/classes/recurring-class.pothos";
import {
  RecurringScheduleDetailPothosObject,
  UpdateRecurringClassRateInputPothos,
} from "@/backend/graphql/pothos/scheduling/recurring-schedule.pothos";
import { RecurringClassService } from "@/backend/services/schedule/recurring-class.service";
import { RecurringScheduleDetailService } from "@/backend/services/schedule/recurring-schedule-detail.service";

gqlSchemaBuilder.mutationField("createRecurringClass", t =>
  t.field({
    type: CreateRecurringClassResultPothosObject,
    args: {
      input: t.arg({ type: CreateRecurringClassInputPothosObject, required: true }),
    },
    authScopes: { superAdmin: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user?.id) {
        const tErrors = ctx.t().errorsTranslations;
        throw new Error(tErrors.unauthorized);
      }
      const tErrors = ctx.t().errorsTranslations;

      return await RecurringClassService.createRecurringClass(
        ctx.user.id,
        {
          studentId: args.input.studentId,
          teacherId: args.input.teacherId,
          subjectId: args.input.subjectId,
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
          hourlyRate: args.input.hourlyRate || null,
          rateCurrency: args.input.rateCurrency ?? null,
        },
        tErrors
      );
    },
  })
);

gqlSchemaBuilder.mutationField("updateRecurringClassRate", t =>
  t.field({
    type: RecurringScheduleDetailPothosObject,
    args: {
      input: t.arg({ type: UpdateRecurringClassRateInputPothos, required: true }),
    },
    authScopes: { superAdmin: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user?.id) {
        const tErrors = ctx.t().errorsTranslations;
        throw new Error(tErrors.unauthorized);
      }
      const tErrors = ctx.t().errorsTranslations;

      await RecurringClassService.updateRecurringClassRate(
        ctx.user.id,
        {
          recurringScheduleId: args.input.recurringScheduleId,
          hourlyRate: args.input.hourlyRate ?? null,
          rateCurrency: args.input.rateCurrency ?? null,
        },
        tErrors
      );

      // Return the refreshed detail so the client gets the canonical shape.
      return RecurringScheduleDetailService.getDetail(ctx.user.id, args.input.recurringScheduleId, tErrors);
    },
  })
);
