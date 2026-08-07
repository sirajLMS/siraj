import {
  buildExtraParentUserSpecs,
  buildExtraStudentUserSpecs,
  buildExtraTeacherUserSpecs,
  getAvatarFileNameForPersona,
  loadSeedConfig,
  type SeedConfig,
  type SeedUserSpec,
  seedEntityFile,
  shouldSeedExtendedFiles,
} from "@/backend/db/seeds/lib";
import { logger } from "@/backend/lib/logger";
import { type SeedDemoUserInput, UserSeedService } from "@/backend/services/seed/user-seed.service";
import { ReferenceDataService } from "@/backend/services/system/reference-data.service";
import type { GroupWithPermissionIds, UserSelectType } from "@/backend/types";
import { DEFAULT_SEED_ADMIN_PASSWORD, INTERNAL_DEMO_USERS } from "@/shared/demo-users";

function resolvePlainPassword(
  spec:
    | Pick<SeedUserSpec, "name" | "email" | "plainPassword" | "isSuperAdmin" | "groupSlug">
    | (typeof INTERNAL_DEMO_USERS)[number]
): string {
  if (!("plainPassword" in spec)) {
    return DEFAULT_SEED_ADMIN_PASSWORD;
  }
  return spec.plainPassword ?? DEFAULT_SEED_ADMIN_PASSWORD;
}

function toDemoUserInput(
  spec:
    | Pick<SeedUserSpec, "name" | "email" | "plainPassword" | "isSuperAdmin" | "groupSlug">
    | (typeof INTERNAL_DEMO_USERS)[number]
): SeedDemoUserInput {
  return {
    name: spec.name,
    email: spec.email,
    plainPassword: resolvePlainPassword(spec),
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

  const demoInputs: SeedDemoUserInput[] = [
    ...INTERNAL_DEMO_USERS.map(toDemoUserInput),
    ...[
      ...buildExtraTeacherUserSpecs(seedConfig),
      ...buildExtraParentUserSpecs(seedConfig),
      ...buildExtraStudentUserSpecs(seedConfig),
    ].map(toDemoUserInput),
  ];

  const results = await UserSeedService.upsertManyDemoUsers(demoInputs, groupMap);

  if (shouldSeedExtendedFiles(seedConfig)) {
    await seedUserAvatars(results);
    const staffProfiles = await UserSeedService.findStaffProfilesByUserIds(results.map(user => user.id));
    await seedStaffProfileAvatars(staffProfiles);
  }

  logger.info(`System users seeded (${results.length} total).`);
  return results;
}

async function seedUserAvatars(users: UserSelectType[]): Promise<void> {
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const avatarFile = getAvatarFileNameForPersona("teachers", i);

    try {
      const { url } = await seedEntityFile({
        assetRelativePath: `avatars/teachers/${avatarFile}`,
        bucketPath: `public/avatars/users/${avatarFile}`,
        referenceTable: "users",
        referenceId: user.id,
        usageType: "avatar",
        ensureParentDirs: ["public/avatars/users"],
      });
      if (url) {
        await UserSeedService.seedAvatarUrl(user.id, url);
      }
    } catch (error) {
      logger.error(`Failed to seed user avatar for ${user.id}:`, error);
    }
  }
}

async function seedStaffProfileAvatars(
  staffProfiles: Awaited<ReturnType<typeof UserSeedService.findStaffProfilesByUserIds>>
): Promise<void> {
  for (let i = 0; i < staffProfiles.length; i++) {
    const profile = staffProfiles[i];
    if (!profile) continue;

    try {
      const avatarFile = getAvatarFileNameForPersona("teachers", i);
      const { url } = await seedEntityFile({
        assetRelativePath: `avatars/teachers/${avatarFile}`,
        bucketPath: `public/avatars/staff/${avatarFile}`,
        referenceTable: "staff_profiles",
        referenceId: profile.staffProfileId,
        usageType: "avatar",
        ensureParentDirs: ["public/avatars/staff"],
      });
      if (url) {
        await UserSeedService.seedAvatarUrl(profile.id, url);
      }
    } catch (error) {
      logger.error(`Failed to seed staff profile avatar for ${profile.staffProfileId}:`, error);
    }
  }
}
