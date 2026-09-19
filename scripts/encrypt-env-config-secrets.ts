#!/usr/bin/env bun
/**
 * Encrypt existing plaintext env-config secret DB overrides at rest.
 *
 * Walks every `isSecret` registry key that is DB-eligible (`excludeFromDb === false`)
 * and, for each `env::<KEY>` override row in `system_settings` that is still stored in
 * plaintext, rewrites it with the shared aes-256-gcm field encryption
 * (`encryptField` — the same versioned format the env-config write path produces,
 * bound to the setting row's GCM additional-authenticated-data context).
 *
 * Idempotent: rows already matching the canonical ciphertext shape (the versioned
 * `v1:iv:cipherText:authTag` format or the legacy un-prefixed shape) are skipped,
 * so re-running is safe. Legacy plaintext rows keep resolving on the read path
 * while the plaintext-passthrough migration window is open; this script closes the
 * at-rest gap for them.
 *
 * Requires `DATABASE_ENCRYPTION_KEY` (same key the write path uses).
 *
 * Usage:
 *   bun run scripts/encrypt-env-config-secrets.ts             # encrypt all columns
 *   bun run scripts/encrypt-env-config-secrets.ts --dryRun    # report only, no writes
 */

import { SystemSettingsRepository } from "@/backend/db/repo/shared";
import { encryptField, isEncryptedFieldValue } from "@/backend/lib";
import { ENV_CONFIG_KEYS } from "@/backend/lib/env-config-keys";
import { logger } from "@/backend/lib/logger";
import {
  envConfigEncryptionContext,
  invalidateEnvConfigCache,
  toEnvSettingDbKey,
} from "@/backend/services/system/environment-config.service";
import { SystemSettingCategory, SystemSettingDataType } from "@/shared/constants/settings/system-settings.enum";

/** Number of keys processed concurrently per batch. */
const BATCH_SIZE = 10;

const DRY_RUN_FLAG = "--dryRun";

interface MigrationCounts {
  encrypted: number;
  alreadyEncrypted: number;
  noOverride: number;
  failed: number;
}

/** Re-encrypts one key's DB override if it is still stored in plaintext. */
async function encryptOverrideIfPlaintext(
  descriptor: (typeof ENV_CONFIG_KEYS)[number],
  counts: MigrationCounts,
  dryRun: boolean
): Promise<void> {
  const dbKey = toEnvSettingDbKey(descriptor.key);
  try {
    const setting = await SystemSettingsRepository.getByKey(dbKey);
    // `system_settings.value` is non-nullable (`textColumn("value").notNull()`),
    // so only an absent row or a blank stored value means "no override to migrate".
    if (setting == null || setting.value === "") {
      counts.noOverride += 1;
      return;
    }
    if (isEncryptedFieldValue(setting.value)) {
      counts.alreadyEncrypted += 1;
      return;
    }

    counts.encrypted += 1;
    if (dryRun) {
      return;
    }

    await SystemSettingsRepository.upsertSetting({
      key: dbKey,
      value: encryptField(setting.value, envConfigEncryptionContext(descriptor.key)),
      dataType: SystemSettingDataType.String,
      description: descriptor.description.en,
      category: SystemSettingCategory.System,
      updatedByUserId: null,
    });
    invalidateEnvConfigCache(descriptor.key);
    logger.info(`encrypt-env-config-secrets: encrypted DB override for key "${descriptor.key}"`);
  } catch (error) {
    counts.failed += 1;
    logger.error(
      `encrypt-env-config-secrets: failed to encrypt DB override for key "${descriptor.key}". ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/** Processes batches one at a time (each batch's keys run concurrently). */
async function runBatches(
  batches: (typeof ENV_CONFIG_KEYS)[number][][],
  counts: MigrationCounts,
  dryRun: boolean,
  index = 0
): Promise<void> {
  if (index >= batches.length) {
    return;
  }
  await Promise.all(batches[index].map(descriptor => encryptOverrideIfPlaintext(descriptor, counts, dryRun)));
  await runBatches(batches, counts, dryRun, index + 1);
}

async function main(): Promise<void> {
  const dryRun = process.argv.slice(2).includes(DRY_RUN_FLAG);
  const secretDescriptors = ENV_CONFIG_KEYS.filter(descriptor => descriptor.isSecret && !descriptor.excludeFromDb);
  logger.info(
    `encrypt-env-config-secrets: scanning ${secretDescriptors.length} secret env-config keys for plaintext DB overrides` +
      (dryRun ? " (dry run)" : "")
  );

  const counts: MigrationCounts = { encrypted: 0, alreadyEncrypted: 0, noOverride: 0, failed: 0 };
  const batches: (typeof ENV_CONFIG_KEYS)[number][][] = [];
  for (let offset = 0; offset < secretDescriptors.length; offset += BATCH_SIZE) {
    batches.push(secretDescriptors.slice(offset, offset + BATCH_SIZE));
  }
  await runBatches(batches, counts, dryRun);

  logger.info(
    `encrypt-env-config-secrets: done — ${dryRun ? "plaintext remaining" : "encrypted"} ${counts.encrypted}, ` +
      `already-encrypted ${counts.alreadyEncrypted}, no-override ${counts.noOverride}, failed ${counts.failed}`
  );
  if (counts.failed > 0) {
    process.exitCode = 1;
  }
  // Deployment gate: the plaintext-passthrough window must not close while any
  // plaintext secret override remains, so a dry run exits non-zero until the
  // count of remaining plaintext overrides is zero.
  if (dryRun && counts.encrypted > 0) {
    logger.error(
      `encrypt-env-config-secrets: dry-run gate failed — ${counts.encrypted} plaintext secret override(s) still ` +
        `stored in the clear. Run without --dryRun to encrypt them before closing the migration window.`
    );
    process.exitCode = 1;
  }
}

await main();
