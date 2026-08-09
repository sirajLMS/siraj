import {
  findSupervisorUserOrFallback,
  getFakerForIndex,
  loadSeedConfig,
  type SeedConfig,
} from "@/backend/db/seeds/lib";
import { ComplaintStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { ComplaintService } from "@/backend/services/communication/complaint.service";
import type { UserSelectType } from "@/backend/types";

type ComplaintRow = {
  id: string;
  status: string;
};

export async function seedOrGet(complaintsList: ComplaintRow[], usersList: UserSelectType[], config?: SeedConfig) {
  logger.info("Seeding complaint responses...");
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableCommunications || !complaintsList?.length) {
    return [];
  }

  const responderUser = findSupervisorUserOrFallback(usersList);
  const results = [];

  for (let i = 0; i < complaintsList.length; i++) {
    const complaint = complaintsList[i];
    if (complaint.status !== ComplaintStatus.ANSWERED) continue;

    const faker = getFakerForIndex(seedConfig.fakerSeed, 12000 + i);
    const inserted = await ComplaintService.ensureComplaintResponse({
      complaintId: complaint.id,
      responderUserId: responderUser?.id ?? null,
      body: faker.lorem.paragraph(),
      emailSent: true,
    });
    results.push(inserted);
  }

  logger.info(`Complaint responses seeded (${results.length} rows).`);
  return results;
}
