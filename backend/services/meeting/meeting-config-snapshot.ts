import type { DBTransaction } from "@/backend/db/db.types";
import { ClassMeetingConfigRepository } from "@/backend/db/repo/meeting/class-meeting-config.repository";
import { MeetingProviderRepository } from "@/backend/db/repo/meeting/meeting-provider.repository";
import { UserMeetingConfigRepository } from "@/backend/db/repo/meeting/user-meeting-config.repository";
import { parseMeetingConfigDetails } from "@/backend/lib/meeting-config.validation";
import { buildMeetingProviderCatalogSnapshot } from "@/backend/services/meeting/meeting-config-mask";
import type { MeetingConfigSnapshot } from "@/backend/types/meeting/meeting-config.types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace MeetingConfigSnapshotService {
  export async function buildSessionSnapshot(
    configId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<MeetingConfigSnapshot> {
    const config = await UserMeetingConfigRepository.getByIdOrThrow(configId, tErrors, tx);
    const provider = await MeetingProviderRepository.getByIdOrThrow(config.providerId, tErrors, tx);
    const details = parseMeetingConfigDetails(provider, config.details);

    return {
      userMeetingConfigId: config.id,
      providerId: config.providerId,
      label: config.label,
      details,
      provider: buildMeetingProviderCatalogSnapshot(provider),
      snapshottedAt: new Date().toISOString(),
    };
  }

  export async function buildClassSessionSnapshot(
    configId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<MeetingConfigSnapshot> {
    const config = await ClassMeetingConfigRepository.getByIdOrThrow(configId, tErrors, tx);
    const provider = await MeetingProviderRepository.getByIdOrThrow(config.providerId, tErrors, tx);
    const details = parseMeetingConfigDetails(provider, config.details);

    return {
      userMeetingConfigId: config.id,
      providerId: config.providerId,
      label: config.label,
      details,
      provider: buildMeetingProviderCatalogSnapshot(provider),
      snapshottedAt: new Date().toISOString(),
    };
  }
}
