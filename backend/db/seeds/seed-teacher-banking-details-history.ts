import { TeacherBankingRepository } from "@/backend/db/repo/teacher-banking.repository";
import logger from "@/backend/lib/logger";
import type { TeacherEntity, UserEntity } from "@/backend/types";
import { getFakerForIndex, loadSeedConfig, type SeedConfig } from "./lib";

export async function seedOrGet(teachersList: TeacherEntity[], usersList: UserEntity[], config?: SeedConfig) {
  logger.info("Seeding teacher banking details...");
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableExtendedScheduling || !teachersList?.length) {
    return [];
  }

  const adminUser = usersList.find(u => u.email === "admin@siraj.local");
  const results = [];

  for (let i = 0; i < teachersList.length; i++) {
    const teacher = teachersList[i];
    const existing = await TeacherBankingRepository.getActiveBankingDetails(teacher.id);
    if (existing) {
      if (existing.verifiedAt === null && adminUser) {
        const verified = await TeacherBankingRepository.verifyBankingDetails({
          bankingDetailsId: existing.id,
          verifiedByUserId: adminUser.id,
        });
        results.push(verified);
      } else {
        results.push(existing);
      }
      continue;
    }

    const faker = getFakerForIndex(seedConfig.fakerSeed, 9000 + i);
    const created = await TeacherBankingRepository.submitBankingDetails({
      teacherId: teacher.id,
      beneficiaryName: faker.person.fullName(),
      bankName: faker.company.name(),
      accountNumber: faker.finance.accountNumber(),
      routingNumber: faker.finance.routingNumber(),
      swiftBic: faker.finance.bic(),
      iban: faker.finance.iban(),
    });

    if (adminUser) {
      const verified = await TeacherBankingRepository.verifyBankingDetails({
        bankingDetailsId: created.id,
        verifiedByUserId: adminUser.id,
      });
      results.push(verified);
    } else {
      results.push(created);
    }
  }

  logger.info(`Teacher banking details seeded (${results.length} rows).`);
  return results;
}
