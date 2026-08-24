import {
  findSupervisorUserOrFallback,
  getFakerForIndex,
  loadSeedConfig,
  type SeedConfig,
} from "@/backend/db/seeds/lib";
import { logger } from "@/backend/lib/logger";
import { ComplaintService } from "@/backend/services";
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

  const answeredComplaints = complaintsList
    .map((complaint, index) => ({ complaint, index }))
    .filter(({ complaint }) => complaint.status === "ANSWERED");

  const results = await answeredComplaints.reduce<
    Promise<Awaited<ReturnType<typeof ComplaintService.ensureComplaintResponse>>[]>
  >(async (prev, { complaint, index }) => {
    const acc = await prev;
    const faker = getFakerForIndex(seedConfig.fakerSeed, 12000 + index);
    const res = await ComplaintService.ensureComplaintResponse({
      complaintId: complaint.id,
      responderUserId: responderUser?.id ?? null,
      body: faker.lorem.paragraph(),
      emailSent: true,
    });
    return [...acc, res];
  }, Promise.resolve([]));

  logger.info(`Complaint responses seeded (${results.length} rows).`);
  return results;
}
