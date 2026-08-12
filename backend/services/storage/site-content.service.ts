/**
 * Service-layer API for the Settings → Site Content / CMS tab.
 *
 * This service is the bridge between the read path (site-content resolver,
 * guarded with `SETTINGS_VIEW`) and the write path (`site_content` repository).
 *
 * Write path — `upsertSiteContent` / `updatePublishState` /
 * `deleteSiteContentById` / `deleteSiteContentBySlug`:
 *   Enforces `AppPermission.SETTINGS_SITE_CONTENT_MANAGE` and emits an audit
 *   log entry via `AuditService.createManyAuditLogs`. Audit is best-effort and
 *   wrapped in try/catch so a logging failure never rolls back the mutation.
 *
 * Read path — `list*` / `get*`:
 *   No permission check (the GraphQL resolver guards with `SETTINGS_VIEW`).
 *
 * `tErrors: ErrorsLabels` is caller-supplied (mirrors `StorageService` and
 * `FxProviderConfigService`) so localized error strings come from the
 * compile-time translation system rather than hardcoded strings.
 */

import type { DBTransaction } from "@/backend/types";
import { SiteContentRepository } from "@/backend/db/repo/storage";
import { AppPermission } from "@/backend/enum";
import { logger } from "@/backend/lib";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AuditService } from "@/backend/services/system/audit.service";
import type { AuditAction, CreateAuditLogInput } from "@/backend/types";
import type { SiteContentSelectType, SiteContentUpsertInput } from "@/backend/types/storage/site-content.types";
import type { ErrorsLabels } from "@/shared/locale";

/** URL-safe slug pattern: lowercase alphanumerics and hyphens, 2-100 chars, no leading/trailing hyphen. */
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,98}[a-z0-9]$/i;

/** Discriminator for typed service validation errors (machine-readable). */
export type SiteContentValidationErrorCode = "ESLUG_INVALID";

/**
 * Typed error thrown by the site-content service when input validation fails.
 *
 * Carries a stable `code` field so callers (e.g. GraphQL resolvers) can map
 * to localized error strings without regex-matching `message`.
 */
export class SiteContentValidationError extends Error {
  readonly code: SiteContentValidationErrorCode;

  constructor(code: SiteContentValidationErrorCode, message: string) {
    super(message);
    this.name = "SiteContentValidationError";
    this.code = code;
  }
}

function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

async function assertManagePermission(actorUserId: string, tErrors: ErrorsLabels): Promise<void> {
  const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.SETTINGS_SITE_CONTENT_MANAGE);
  if (!hasPermission) {
    throw new Error(tErrors.insufficientPermissions);
  }
}

/** Best-effort audit emit — never throws. */
async function emitAudit(
  actorUserId: string,
  action: AuditAction,
  entityId: string,
  tx?: DBTransaction
): Promise<void> {
  const input: CreateAuditLogInput = {
    actorUserId,
    actorType: "USER",
    entityType: "SITE_CONTENT",
    entityId,
    action,
  };

  try {
    await AuditService.createManyAuditLogs([input], tx);
  } catch (error) {
    logger.error(
      `site-content-service: audit log failed for ${action} on "${entityId}". ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export namespace SiteContentService {
  export async function listSiteContent(tx?: DBTransaction): Promise<SiteContentSelectType[]> {
    return SiteContentRepository.listAll(tx);
  }

  export async function listPublishedSiteContent(tx?: DBTransaction): Promise<SiteContentSelectType[]> {
    return SiteContentRepository.listPublished(tx);
  }

  export async function listSiteContentByType(
    contentType: string,
    tx?: DBTransaction
  ): Promise<SiteContentSelectType[]> {
    return SiteContentRepository.listByContentType(contentType, tx);
  }

  export async function getSiteContentById(id: string, tx?: DBTransaction): Promise<SiteContentSelectType | null> {
    return SiteContentRepository.findById(id, tx);
  }

  export async function getSiteContentBySlug(slug: string, tx?: DBTransaction): Promise<SiteContentSelectType | null> {
    return SiteContentRepository.findBySlug(slug, tx);
  }

  export async function upsertSiteContent(
    input: SiteContentUpsertInput,
    actorUserId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<SiteContentSelectType> {
    await assertManagePermission(actorUserId, tErrors);

    if (!isValidSlug(input.slug)) {
      throw new SiteContentValidationError("ESLUG_INVALID", `Site content slug "${input.slug}" is not URL-safe.`);
    }

    const result = await SiteContentRepository.upsert({ ...input, updatedByUserId: actorUserId }, tx);

    await emitAudit(actorUserId, "UPSERT", input.slug, tx);

    return result;
  }

  export async function updatePublishState(
    id: string,
    isPublished: boolean,
    actorUserId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<SiteContentSelectType | null> {
    await assertManagePermission(actorUserId, tErrors);

    const result = await SiteContentRepository.updatePublishState(id, isPublished, tx);

    await emitAudit(actorUserId, "UPDATE", id, tx);

    return result;
  }

  export async function deleteSiteContentById(
    id: string,
    actorUserId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<void> {
    await deleteSiteContent(txn => SiteContentRepository.deleteById(id, txn), id, actorUserId, tErrors, tx);
  }

  export async function deleteSiteContentBySlug(
    slug: string,
    actorUserId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<void> {
    await deleteSiteContent(txn => SiteContentRepository.deleteBySlug(slug, txn), slug, actorUserId, tErrors, tx);
  }

  /**
   * Shared delete flow for the site-content service: assert the manage
   * permission, run the repo delete callback for the supplied identifier,
   * then emit a best-effort `DELETE` audit entry.
   */
  async function deleteSiteContent(
    deleteFn: (tx?: DBTransaction) => Promise<unknown>,
    identifier: string,
    actorUserId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<void> {
    await assertManagePermission(actorUserId, tErrors);

    await deleteFn(tx);

    await emitAudit(actorUserId, "DELETE", identifier, tx);
  }
}
