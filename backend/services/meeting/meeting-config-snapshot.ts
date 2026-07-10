import type { DBTransaction } from "@/backend/db/db.types";
import { ClassMeetingConfigRepository } from "@/backend/db/repo/meeting/class-meeting-config.repository";
import { MeetingProviderRepository } from "@/backend/db/repo/meeting/meeting-provider.repository";
import { UserMeetingConfigRepository } from "@/backend/db/repo/meeting/user-meeting-config.repository";
import { parseMeetingConfigDetails } from "@/backend/lib/meeting-config.validation";
import { buildMeetingProviderCatalogSnapshot } from "@/backend/services/meeting/meeting-config-mask";
import type { MeetingConfigSnapshot } from "@/backend/types/meeting/meeting-config.types";

export namespace MeetingConfigSnapshotService {
  export async function buildSessionSnapshot(configId: string, tx?: DBTransaction): Promise<MeetingConfigSnapshot> {
    const config = await UserMeetingConfigRepository.getByIdOrThrow(configId, tx);
    const provider = await MeetingProviderRepository.getByIdOrThrow(config.providerId, tx);
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
    tx?: DBTransaction
  ): Promise<MeetingConfigSnapshot> {
    const config = await ClassMeetingConfigRepository.getByIdOrThrow(configId, tx);
    const provider = await MeetingProviderRepository.getByIdOrThrow(config.providerId, tx);
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
