import { db } from "@/backend/db/drizzleDb";
import { SystemSettingsRepository } from "@/backend/db/repo/shared/system-settings.repository";
import { systemSettings } from "@/backend/db/schema";
import { AppPermission } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AuditService } from "@/backend/services/system/audit.service";
import { getStorageService } from "@/backend/storage/storage.service";
import type {
  CreateAuditLogInput,
  DBTransaction,
  SystemSettingSelectType,
  SystemSettingUpsertInput,
} from "@/backend/types";
import { SystemSettingCategory, SystemSettingDataType } from "@/shared/constants/settings/system-settings.enum";
import type { ErrorsLabels } from "@/shared/locale";

const HANDBOOK_SETTING_KEY = "teacher_handbook_url";
const PARENT_HANDBOOK_SETTING_KEY = "parent_handbook_url";

type HandbookUploadConfig = {
  adminPermission: AppPermission;
  defaultFileName: string;
  settingKey: string;
  description: string;
  logLabel: string;
  registerLogMessage?: string;
};

const TEACHER_HANDBOOK_UPLOAD: HandbookUploadConfig = {
  adminPermission: AppPermission.TEACHERS_EDIT,
  defaultFileName: "teacher-handbook.pdf",
  settingKey: HANDBOOK_SETTING_KEY,
  description: "Default download URL for the teacher handbook",
  logLabel: "teacher handbook",
  registerLogMessage: "Registering teacher handbook in system settings...",
};

const PARENT_HANDBOOK_UPLOAD: HandbookUploadConfig = {
  adminPermission: AppPermission.PARENTS_EDIT,
  defaultFileName: "parent-handbook.pdf",
  settingKey: PARENT_HANDBOOK_SETTING_KEY,
  description: "Default download URL for the parent handbook",
  logLabel: "parent handbook",
};

/** Prefix reserved for env-config DB overrides (managed by the Stage 3 env-config service). */
const ENV_SETTING_KEY_PREFIX = "env::";

/**
 * Typed error thrown when an attempt is made to mutate an `env::*` key through
 * the generic general-settings service. Env-config keys are owned by the
 * Settings → Environment Config tab and its dedicated service.
 */
class EnvConfigScopeError extends Error {
  readonly code = "EENV_SCOPE_REJECTED" as const;

  constructor(message: string) {
    super(message);
    this.name = "EnvConfigScopeError";
  }
}

export namespace SystemSettingsService {
  async function assertUserHasAnyPermission(
    userId: string,
    permissions: AppPermission[],
    tErrors: ErrorsLabels
  ): Promise<void> {
    const results = await Promise.all(
      permissions.map(permission => PermissionsService.hasPermission(userId, permission))
    );
    if (results.some(Boolean)) {
      return;
    }
    throw new Error(tErrors.unauthorizedAction);
  }

  async function getStoredFileDownloadUrl(settingKey: string, tErrors: ErrorsLabels): Promise<string> {
    const setting = await SystemSettingsRepository.getByKey(settingKey);
    if (!setting?.value) {
      throw new Error(tErrors.notFound);
    }

    const storageService = await getStorageService();
    const fileInfo = await storageService.fileInfoByPath(setting.value);
    if (!fileInfo?.url) {
      throw new Error(tErrors.notFound);
    }

    return fileInfo.url;
  }

  async function assertUploadPermissionIfUserPresent(
    userId: string | null,
    uploadPermission: AppPermission,
    adminPermission: AppPermission,
    tErrors: ErrorsLabels
  ): Promise<void> {
    if (!userId) {
      return;
    }
    await assertUserHasAnyPermission(userId, [uploadPermission, adminPermission], tErrors);
  }

  async function uploadHandbookWithConfig(
    userId: string | null,
    fileName: string,
    fileBuffer: Buffer,
    tErrors: ErrorsLabels,
    config: HandbookUploadConfig
  ): Promise<void> {
    await assertUploadPermissionIfUserPresent(userId, AppPermission.RESOURCES_UPLOAD, config.adminPermission, tErrors);

    const bucketPath = `public/docs/${fileName || config.defaultFileName}`;
    logger.info(`Uploading ${config.logLabel} to storage path: ${bucketPath}`);
    const storageService = await getStorageService();
    const uploadResult = await storageService.uploadFile(bucketPath, "application/pdf", fileBuffer);
    if (!uploadResult.success) {
      throw new Error(tErrors.resource.handbookUploadFailed);
    }

    if (config.registerLogMessage) {
      logger.info(config.registerLogMessage);
    }

    await SystemSettingsRepository.upsertSetting({
      key: config.settingKey,
      value: bucketPath,
      dataType: SystemSettingDataType.String,
      description: config.description,
      category: SystemSettingCategory.System,
      updatedByUserId: userId,
    });
  }

  /**
   * Retrieves the signed, secure download URL for the teacher handbook.
   *
   * Checks if the user is authorized as a teacher (TEACHER_VIEW_DASHBOARD permission)
   * or as an administrator (TEACHERS_EDIT permission).
   * It fetches the stored file path from the "teacher_handbook_url" system settings record,
   * then delegates to the active storage provider to retrieve a signed download URL.
   *
   * @param userId The ID of the user requesting the handbook URL.
   * @param tErrors Translated error labels.
   * @returns A promise resolving to the signed download URL.
   */
  export async function getHandbookDownloadUrl(userId: string, tErrors: ErrorsLabels): Promise<string> {
    await assertUserHasAnyPermission(
      userId,
      [AppPermission.TEACHER_VIEW_DASHBOARD, AppPermission.TEACHERS_EDIT],
      tErrors
    );
    return getStoredFileDownloadUrl(HANDBOOK_SETTING_KEY, tErrors);
  }

  export async function getParentHandbookDownloadUrl(userId: string, tErrors: ErrorsLabels): Promise<string> {
    await assertUserHasAnyPermission(userId, [AppPermission.SCHEDULE_VIEW_FAMILY, AppPermission.PARENTS_EDIT], tErrors);
    return getStoredFileDownloadUrl(PARENT_HANDBOOK_SETTING_KEY, tErrors);
  }

  export async function uploadParentHandbook(
    userId: string | null,
    fileName: string,
    fileBuffer: Buffer,
    tErrors: ErrorsLabels
  ): Promise<void> {
    return uploadHandbookWithConfig(userId, fileName, fileBuffer, tErrors, PARENT_HANDBOOK_UPLOAD);
  }

  /**
   * Uploads or updates the teacher handbook file in storage and registers its path in the database.
   *
   * Checks if the user has resource upload permissions (RESOURCES_UPLOAD or TEACHERS_EDIT)
   * if a `userId` is provided. If `userId` is `null`, it allows system-level bypass (e.g. database seeding).
   * It uploads the file buffer to `public/docs/[fileName]`, and then updates or inserts the path into
   * the system settings table with the key "teacher_handbook_url".
   *
   * @param userId The user ID of the actor initiating the upload, or `null` for system-level bypass.
   * @param fileName The desired filename (e.g. "teacher-handbook.pdf").
   * @param fileBuffer The raw PDF file buffer.
   * @param tErrors Translated error labels.
   */
  export async function uploadHandbook(
    userId: string | null,
    fileName: string,
    fileBuffer: Buffer,
    tErrors: ErrorsLabels
  ): Promise<void> {
    return uploadHandbookWithConfig(userId, fileName, fileBuffer, tErrors, TEACHER_HANDBOOK_UPLOAD);
  }

  export async function upsertManySettings(inputs: SystemSettingUpsertInput[], updatedByUserId: string | null = null) {
    return Promise.all(
      inputs.map(input =>
        SystemSettingsRepository.upsertSetting({
          ...input,
          updatedByUserId,
        })
      )
    );
  }

  /**
   * Enforces SETTINGS_EDIT_GENERAL. Throws `tErrors.insufficientPermissions` on
   * missing permission. Rejects `env::*` keys (they are owned by the env-config tab).
   */
  async function assertGeneralEditPermission(actorUserId: string, tErrors: ErrorsLabels, key: string): Promise<void> {
    if (key.startsWith(ENV_SETTING_KEY_PREFIX)) {
      throw new EnvConfigScopeError(
        `Key "${key}" belongs to the environment-config scope and cannot be modified through general settings.`
      );
    }
    const allowed = await PermissionsService.hasPermission(actorUserId, AppPermission.SETTINGS_EDIT_GENERAL);
    if (!allowed) {
      throw new Error(tErrors.insufficientPermissions);
    }
  }

  /** Emits an audit log entry for a generic system-setting change (best-effort). */
  async function auditGenericSettingChange(
    actorUserId: string,
    action: "UPDATE" | "DELETE",
    key: string,
    tx?: DBTransaction
  ): Promise<void> {
    const auditInput: CreateAuditLogInput = {
      actorUserId,
      actorType: "USER",
      entityType: "SYSTEM_SETTING",
      entityId: key,
      action,
      description: `System setting '${key}' changed`,
    };
    try {
      await AuditService.createManyAuditLogs([auditInput], tx);
    } catch (error) {
      logger.error(
        `system-settings-service: failed to write audit log (${action}) for key "${key}". Error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Serializes a raw string `value` for persistence based on its `dataType`.
   *
   * - `Boolean`: coerces to the canonical `"true"`/`"false"` string the repo
   *   stores (and `getBooleanValue` parses). Accepts case-insensitive truthy
   *   input from the GraphQL layer.
   * - `Json`: validates `JSON.parse` succeeds BEFORE the repo write so the
   *   service surfaces a typed error rather than persisting garbage that
   *   `getJsonValue<T>` cannot round-trip. Throws `Error(tErrors.invalidInput)`
   *   on parse failure — the GraphQL resolver maps the message via i18n.
   * - `String` / `Integer`: no extra serialization — values are stored as
   *   provided by the caller.
   */
  function serializeSettingValue(
    value: string,
    dataType: SystemSettingDataType | undefined,
    tErrors: ErrorsLabels
  ): string {
    if (dataType === SystemSettingDataType.Boolean) {
      return String(value.trim().toLowerCase() === "true");
    }
    if (dataType === SystemSettingDataType.Json) {
      try {
        JSON.parse(value);
      } catch (error) {
        logger.error(
          `system-settings-service: invalid JSON value for setting. Error: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        throw new Error(tErrors.invalidInput, { cause: error });
      }
      return value;
    }
    return value;
  }

  /**
   * Lists all stored system settings. Read-only; the GraphQL resolver guards
   * this with `AppPermission.SETTINGS_VIEW`.
   */
  export async function listAllSettings(tx?: DBTransaction): Promise<SystemSettingSelectType[]> {
    const queryDb = tx ?? db;
    return queryDb.select().from(systemSettings);
  }

  /**
   * Returns the full row for the given key, or `null` when missing. Read-only;
   * the GraphQL resolver guards this with `AppPermission.SETTINGS_VIEW`.
   */
  export async function getSettingByKey(key: string, tx?: DBTransaction): Promise<SystemSettingSelectType | null> {
    return SystemSettingsRepository.getByKey(key, tx);
  }

  /**
   * Creates or updates a generic system setting.
   *
   * - Enforces `AppPermission.SETTINGS_EDIT_GENERAL` (else `tErrors.insufficientPermissions`).
   * - Rejects keys starting with `env::` (owned by the env-config tab) by
   *   throwing {@link EnvConfigScopeError}.
   * - Persists via `SystemSettingsRepository.upsertSetting`, stamping
   *   `updatedByUserId: actorUserId`.
   * - Emits a best-effort audit log (`action: "UPSERT"`).
   */
  export async function upsertGenericSetting(
    input: SystemSettingUpsertInput,
    actorUserId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<SystemSettingSelectType> {
    await assertGeneralEditPermission(actorUserId, tErrors, input.key);

    const persistedValue = serializeSettingValue(input.value, input.dataType, tErrors);

    const row = await SystemSettingsRepository.upsertSetting(
      {
        key: input.key,
        value: persistedValue,
        dataType: input.dataType,
        description: input.description,
        category: input.category,
        updatedByUserId: actorUserId,
      },
      tx
    );

    await auditGenericSettingChange(actorUserId, "UPDATE", input.key, tx);

    return row;
  }

  /**
   * Deletes a system setting by key.
   *
   * - Enforces `AppPermission.SETTINGS_EDIT_GENERAL` (else `tErrors.insufficientPermissions`).
   * - Rejects keys starting with `env::` (owned by the env-config tab) by
   *   throwing {@link EnvConfigScopeError}.
   * - Removes the row via `SystemSettingsRepository.deleteSetting`.
   * - Emits a best-effort audit log (`action: "DELETE"`).
   */
  export async function deleteSettingByKey(
    key: string,
    actorUserId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<void> {
    await assertGeneralEditPermission(actorUserId, tErrors, key);

    await SystemSettingsRepository.deleteSetting(key, tx);

    await auditGenericSettingChange(actorUserId, "DELETE", key, tx);
  }
}
