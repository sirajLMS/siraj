import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import type { EffectiveMeetingReturnType } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

const EffectiveMeetingSourceRef = gqlSchemaBuilder.enumType("EffectiveMeetingSource", {
  values: ["class", "recurring", "teacher", "none"] as const,
});

const EffectiveMeetingRef = gqlSchemaBuilder.objectRef<EffectiveMeetingReturnType>("EffectiveMeeting");

export const EffectiveMeetingPothosObject = EffectiveMeetingRef.implement({
  fields: t => ({
    joinUrl: t.exposeString("joinUrl", { nullable: true }),
    providerSlug: t.exposeString("providerSlug", { nullable: true }),
    providerName: t.expose("providerName", { type: "LocalizedString", nullable: true }),
    logoUrl: t.exposeString("logoUrl", { nullable: true }),
    meetingId: t.exposeString("meetingId", { nullable: true }),
    source: t.expose("source", { type: EffectiveMeetingSourceRef }),
    configId: t.exposeString("configId", { nullable: true }),
    providerId: t.exposeString("providerId", { nullable: true }),
  }),
});

export async function resolveEffectiveMeetingForClassInstance(classInstanceId: string, tErrors: ErrorsLabels) {
  const { EffectiveMeetingService } = await import("@/backend/services/meeting/class-meeting-config.service");
  return EffectiveMeetingService.resolveForClassInstance(classInstanceId, tErrors);
}

export async function resolveEffectiveMeetingForClassInstanceFromContext(classInstanceId: string, ctx: BaseContext) {
  const tErrors = ctx.t().errorsTranslations;
  return resolveEffectiveMeetingForClassInstance(classInstanceId, tErrors);
}
