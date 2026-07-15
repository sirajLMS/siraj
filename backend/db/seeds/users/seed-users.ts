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
import logger from "@/backend/lib/logger";
import { ReferenceDataService } from "@/backend/services/system/reference-data.service";
import { type DemoUserUpsertInput, UserBootstrapService } from "@/backend/services/system/user-bootstrap.service";
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
): DemoUserUpsertInput {
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

  const demoInputs: DemoUserUpsertInput[] = [
    ...INTERNAL_DEMO_USERS.map(toDemoUserInput),
    ...[
      ...buildExtraTeacherUserSpecs(seedConfig),
      ...buildExtraParentUserSpecs(seedConfig),
      ...buildExtraStudentUserSpecs(seedConfig),
    ].map(toDemoUserInput),
  ];

  const results = await UserBootstrapService.upsertManyDemoUsers(demoInputs, groupMap);

  if (shouldSeedExtendedFiles(seedConfig)) {
    const staffProfiles = await UserBootstrapService.findStaffProfilesByUserIds(results.map(user => user.id));

    for (let i = 0; i < results.length; i++) {
      const user = results[i];
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
          await UserBootstrapService.updateAvatarUrl(user.id, url);
        }
      } catch (error) {
        logger.error(`Failed to seed user avatar for ${user.id}:`, error);
      }
    }

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
          await UserBootstrapService.updateAvatarUrl(profile.id, url);
        }
      } catch (error) {
        logger.error(`Failed to seed staff profile avatar for ${profile.staffProfileId}:`, error);
      }
    }
  }

  logger.info(`System users seeded (${results.length} total).`);
  return results;
}
