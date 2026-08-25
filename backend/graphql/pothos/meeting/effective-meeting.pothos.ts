import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { EffectiveMeetingSourcePothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
import { EffectiveMeetingService } from "@/backend/services";
import type { EffectiveMeetingReturnType } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export const EffectiveMeetingRef = gqlSchemaBuilder.objectRef<EffectiveMeetingReturnType>("EffectiveMeeting");

export const EffectiveMeetingPothosObject = EffectiveMeetingRef.implement({
  fields: t => ({
    id: t.string({
      resolve: parent => parent.configId ?? parent.meetingId ?? `effective-meeting-${parent.source}`,
    }),
    joinUrl: t.exposeString("joinUrl", { nullable: true }),
    providerSlug: t.exposeString("providerSlug", { nullable: true }),
    providerName: t.expose("providerName", { type: "LocalizedString", nullable: true }),
    logoUrl: t.exposeString("logoUrl", { nullable: true }),
    meetingId: t.exposeString("meetingId", { nullable: true }),
    source: t.expose("source", { type: EffectiveMeetingSourcePothosEnum }),
    configId: t.exposeString("configId", { nullable: true }),
    providerId: t.exposeString("providerId", { nullable: true }),
    supportsAutoGeneration: t.exposeBoolean("supportsAutoGeneration"),
  }),
});

export async function resolveEffectiveMeetingForClassInstance(classInstanceId: string, tErrors: ErrorsLabels) {
  return EffectiveMeetingService.resolveForClassInstance(classInstanceId, tErrors);
}

export async function resolveEffectiveMeetingForClassInstanceFromContext(classInstanceId: string, ctx: BaseContext) {
  const tErrors = ctx.t().errorsTranslations;
  return resolveEffectiveMeetingForClassInstance(classInstanceId, tErrors);
}
