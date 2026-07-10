import {
  buildExtraParentUserSpecs,
  buildExtraTeacherUserSpecs,
  loadSeedConfig,
  type SeedConfig,
  type SeedUserSpec,
} from "@/backend/db/seeds/lib";
import logger from "@/backend/lib/logger";
import { ReferenceDataService } from "@/backend/services/system/reference-data.service";
import { type DemoUserUpsertInput, UserBootstrapService } from "@/backend/services/system/user-bootstrap.service";
import type { GroupWithPermissionIds, UserSelectType } from "@/backend/types";
import { DEFAULT_SEED_ADMIN_PASSWORD, INTERNAL_DEMO_USERS } from "@/shared/demo-users";

function toDemoUserInput(
  spec:
    | Pick<SeedUserSpec, "name" | "email" | "plainPassword" | "isSuperAdmin" | "groupSlug">
    | (typeof INTERNAL_DEMO_USERS)[number]
): DemoUserUpsertInput {
  return {
    name: spec.name,
    email: spec.email,
    plainPassword:
      "plainPassword" in spec ? (spec.plainPassword ?? DEFAULT_SEED_ADMIN_PASSWORD) : DEFAULT_SEED_ADMIN_PASSWORD,
    isSuperAdmin: spec.isSuperAdmin,
    groupSlug: spec.groupSlug,
  };
}

export async function seedOrGet(
  permissionGroups?: GroupWithPermissionIds[],
  config?: SeedConfig
): Promise<UserSelectType[]> {
  logger.info("Seeding system users...");
  const seedConfig = config ?? loadSeedConfig();

  const groups = permissionGroups ?? (await ReferenceDataService.listPermissionGroups());
  const groupMap = new Map(groups.map(g => [g.slug, g.id]));

  const demoInputs: DemoUserUpsertInput[] = [
    ...INTERNAL_DEMO_USERS.map(toDemoUserInput),
    ...[...buildExtraTeacherUserSpecs(seedConfig), ...buildExtraParentUserSpecs(seedConfig)].map(toDemoUserInput),
  ];

  const results = await UserBootstrapService.upsertManyDemoUsers(demoInputs, groupMap);
  logger.info(`System users seeded (${results.length} total).`);
  return results;
}
