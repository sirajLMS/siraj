import { WhatsappAccountRepository } from "@/backend/db/repo/whatsapp";
import {
  coerceLimitTier,
  coerceQualityRating,
  isMetaTestNumber,
  isValidLimitTier,
  isValidQualityRating,
} from "@/backend/lib";
import { logger } from "@/backend/lib/logger";
import { MAX_CONCURRENT_CALLS } from "@/backend/lib/whatsapp-constants";
import {
  buildTemplateSnapshot,
  messageTemplateListSchema,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests";
import { buildGetPhoneNumberRequest } from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/get-phone-number.request";
import { collectAllTemplates } from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/list-message-templates.request";
import { collectAllPhoneNumbers } from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/list-phone-numbers.request";
import { MAX_CONCURRENT_PHONES, SYNC_STATUS_PENDING } from "@/backend/services/whatsapp/whatsapp-account.constants";
import { phoneNumberListSchema, phoneNumberResultSchema } from "@/backend/services/whatsapp/whatsapp-account.schemas";
import {
  auditChange,
  collectSequentially,
  executeGraphApiFetch,
  getErrorDescription,
  resolveGraphApiContext,
} from "@/backend/services/whatsapp/whatsapp-account.shared.helpers";
import type {
  DBTransaction,
  GetPhoneNumberResult,
  GraphApiRequestContext,
  ListMessageTemplatesResponseBody,
  ListPhoneNumbersResponseBody,
  WhatsappAccountReturnType,
  WhatsappPhoneNumber,
  WhatsappSyncFromMetaReturnType,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * Resolves the coerced Meta enum fields for one phone detail, warning when
 * Meta sends an unrecognized enum value (r10-012) without logging the raw
 * provider string.
 */
function resolvePhoneMetaFields(detail: GetPhoneNumberResult): {
  qualityRating: ReturnType<typeof coerceQualityRating>;
  portfolioMessagingLimitTier: ReturnType<typeof coerceLimitTier>;
  isTestNumber: boolean;
} {
  const qualityRating = coerceQualityRating(detail.quality_rating);
  if (!isValidQualityRating(detail.quality_rating)) {
    logger.warn("whatsapp-account-service: quality rating from Meta was not recognized — falling back to UNKNOWN", {
      qualityRatingFallback: "UNKNOWN",
    });
  }
  const portfolioMessagingLimitTier = coerceLimitTier(detail.portfolio_messaging_limit_tier);
  if (!isValidLimitTier(detail.portfolio_messaging_limit_tier)) {
    logger.warn(
      "whatsapp-account-service: messaging limit tier from Meta was not recognized — falling back to TIER_NOT_SET",
      { messagingLimitTierFallback: "TIER_NOT_SET" }
    );
  }
  const isTestNumber = isMetaTestNumber(
    detail.verified_name,
    detail.code_verification_status,
    detail.display_phone_number
  );
  return { qualityRating, portfolioMessagingLimitTier, isTestNumber };
}

/** Re-syncs Meta-derived metadata on an existing account, preserving its token and active toggle. */
async function upsertExistingPhoneAccount(
  existing: WhatsappAccountReturnType,
  detail: GetPhoneNumberResult,
  fields: ReturnType<typeof resolvePhoneMetaFields>,
  tx: DBTransaction | undefined
): Promise<WhatsappAccountReturnType> {
  await WhatsappAccountRepository.update(
    existing.id,
    {
      displayPhoneNumber: detail.display_phone_number,
      qualityRating: fields.qualityRating,
      portfolioMessagingLimitTier: fields.portfolioMessagingLimitTier,
      throughputLevel: detail.throughput_level,
      metaStatus: detail.status ?? null,
      isTestNumber: fields.isTestNumber,
    },
    tx
  );
  return {
    ...existing,
    metaStatus: detail.status ?? null,
    displayPhoneNumber: detail.display_phone_number,
    qualityRating: fields.qualityRating,
    portfolioMessagingLimitTier: fields.portfolioMessagingLimitTier,
    throughputLevel: detail.throughput_level,
    isTestNumber: fields.isTestNumber,
  } satisfies WhatsappAccountReturnType;
}

/**
 * Creates the account row for a newly discovered number. The detail fetch
 * already proved `ctx.accessToken` can reach this number's Graph API
 * endpoint: when Meta reports the number CONNECTED, adopt the sync token and
 * mark it active; otherwise store a pending placeholder so it stays visibly
 * inactive until credentials land.
 */
function createNewPhoneAccount(
  phone: WhatsappPhoneNumber,
  detail: GetPhoneNumberResult,
  fields: ReturnType<typeof resolvePhoneMetaFields>,
  ctx: GraphApiRequestContext,
  wabaId: string,
  tx: DBTransaction | undefined
): Promise<WhatsappAccountReturnType> {
  const isConnected = detail.status?.toUpperCase() === "CONNECTED";
  const hasUsableToken = ctx.accessToken.trim().length > 0 && ctx.accessToken !== SYNC_STATUS_PENDING;
  return WhatsappAccountRepository.create(
    {
      wabaId,
      phoneNumberId: phone.id,
      displayPhoneNumber: detail.display_phone_number,
      qualityRating: fields.qualityRating,
      portfolioMessagingLimitTier: fields.portfolioMessagingLimitTier,
      throughputLevel: detail.throughput_level,
      metaStatus: detail.status ?? null,
      encryptedAccessToken: isConnected && hasUsableToken ? ctx.accessToken : SYNC_STATUS_PENDING,
      encryptedTwoStepPin: SYNC_STATUS_PENDING,
      isActive: isConnected && hasUsableToken,
      isTestNumber: fields.isTestNumber,
    },
    tx
  );
}

/**
 * Processes a single phone number: coerce Meta enums, upsert the account, and
 * return the result. Returns null on per-account write failure (counts toward
 * `failedCount`).
 */
async function processPhoneNumber(
  phone: WhatsappPhoneNumber,
  detail: GetPhoneNumberResult | undefined,
  existing: WhatsappAccountReturnType | null,
  ctx: GraphApiRequestContext,
  wabaId: string,
  tx: DBTransaction | undefined,
  onFail: () => void
): Promise<WhatsappAccountReturnType | null> {
  if (!detail) {
    return null;
  }
  const fields = resolvePhoneMetaFields(detail);

  try {
    if (existing) {
      return await upsertExistingPhoneAccount(existing, detail, fields, tx);
    }
    return await createNewPhoneAccount(phone, detail, fields, ctx, wabaId, tx);
  } catch (error) {
    onFail();
    // r10-036: Avoid leaking DB internals.
    const errorDescription = getErrorDescription(error);
    logger.warn(
      `whatsapp-account-service: syncFromMeta failed to write account for phoneNumberId=${phone.id}: ${errorDescription}`,
      { phoneNumberId: phone.id, errorType: errorDescription }
    );
    return null;
  }
}

/**
 * Batch-fetch phone number details from the Graph API in concurrent chunks.
 *
 * Uses Promise.allSettled so a single rejected fetch does not abort the entire
 * sync — partial data is better than no data. Only treat it as a total failure
 * if ALL fetches in a chunk reject.
 */
async function fetchPhoneDetailsBatch(
  ctx: GraphApiRequestContext,
  phoneNumbers: readonly WhatsappPhoneNumber[]
): Promise<Map<string, GetPhoneNumberResult>> {
  const phoneDetails = new Map<string, GetPhoneNumberResult>();

  async function processPhoneChunk(chunk: readonly WhatsappPhoneNumber[]): Promise<void> {
    const promises = chunk.map(phone => {
      const detailRequest = buildGetPhoneNumberRequest(ctx, { phoneNumberId: phone.id });
      return executeGraphApiFetch<GetPhoneNumberResult>(detailRequest, phoneNumberResultSchema);
    });
    const settled = await Promise.allSettled(promises);
    let allRejected = true;
    for (let j = 0; j < chunk.length; j++) {
      const outcome = settled[j];
      if (outcome.status === "fulfilled") {
        allRejected = false;
        phoneDetails.set(chunk[j].id, outcome.value);
      } else {
        logger.warn(
          `whatsapp-account-service: syncFromMeta phone detail fetch failed for phoneNumberId=${chunk[j].id}: ${outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason)}`,
          { phoneNumberId: chunk[j].id, error: outcome.reason }
        );
      }
    }
    if (allRejected) {
      const phoneIds = chunk.map(p => p.id).join(", ");
      // Internal server error (not user-facing) — hardcoded is acceptable here
      throw new Error(
        `whatsapp-account-service: syncFromMeta — all phone detail fetches failed for chunk [${phoneIds}]`
      );
    }
  }

  const chunks: WhatsappPhoneNumber[][] = [];
  for (let i = 0; i < phoneNumbers.length; i += MAX_CONCURRENT_CALLS) {
    chunks.push(phoneNumbers.slice(i, i + MAX_CONCURRENT_CALLS));
  }

  await chunks.reduce((chain, chunk) => chain.then(() => processPhoneChunk(chunk)), Promise.resolve());

  return phoneDetails;
}

/**
 * Collect account results from phone numbers, respecting the transaction
 * boundary. When `tx` is provided, writes run sequentially. When absent,
 * writes run in bounded parallel chunks.
 */
async function collectAccountResults(
  phoneNumbers: readonly WhatsappPhoneNumber[],
  phoneDetails: Map<string, GetPhoneNumberResult>,
  existingByPhoneId: Map<string, WhatsappAccountReturnType | null>,
  ctx: GraphApiRequestContext,
  wabaId: string,
  tx: DBTransaction | undefined
): Promise<{ accounts: WhatsappAccountReturnType[]; failedCount: number }> {
  let failedCount = 0;
  const onFail = () => {
    failedCount++;
  };

  const processOne = (phone: WhatsappPhoneNumber) =>
    processPhoneNumber(
      phone,
      phoneDetails.get(phone.id),
      existingByPhoneId.get(phone.id) ?? null,
      ctx,
      wabaId,
      tx,
      onFail
    );

  let accountResults: (WhatsappAccountReturnType | null)[];
  if (tx) {
    accountResults = await collectSequentially([...phoneNumbers], processOne);
  } else {
    accountResults = [];
    const phoneChunks: WhatsappPhoneNumber[][] = [];
    for (let i = 0; i < phoneNumbers.length; i += MAX_CONCURRENT_PHONES) {
      phoneChunks.push([...phoneNumbers].slice(i, i + MAX_CONCURRENT_PHONES));
    }
    await phoneChunks.reduce(
      (chain, chunk) =>
        chain
          .then(() => Promise.all(chunk.map(processOne)))
          .then(chunkResults => {
            accountResults.push(...chunkResults);
            return accountResults;
          }),
      Promise.resolve<(WhatsappAccountReturnType | null)[]>([])
    );
  }

  const accounts = accountResults.filter((r): r is WhatsappAccountReturnType => r !== null);
  return { accounts, failedCount };
}

/**
 * Syncs accounts and templates from Meta: resolves the Graph API context,
 * reads the WABA's phone numbers and their details, upserts one account per
 * number respecting the transaction boundary, snapshots the message
 * templates, and emits the sync audit row.
 */
export async function syncWhatsappAccountsFromMeta(
  actorUserId: string,
  tErrors: ErrorsLabels,
  tx?: DBTransaction
): Promise<WhatsappSyncFromMetaReturnType> {
  const { ctx, wabaId } = await resolveGraphApiContext(tErrors);

  const phoneNumbers = await collectAllPhoneNumbers(ctx, { wabaId }, async request => {
    return executeGraphApiFetch<ListPhoneNumbersResponseBody>(request, phoneNumberListSchema);
  });

  const phoneDetails = await fetchPhoneDetailsBatch(ctx, phoneNumbers);

  // Batch-fetch all existing accounts by phone number ID in a single query
  // (avoids N*2 round-trips for N phone numbers).
  const phoneIds = phoneNumbers.map(p => p.id);
  const existingByPhoneId = await WhatsappAccountRepository.findByPhoneNumberIds(phoneIds, tx);

  const { accounts, failedCount } = await collectAccountResults(
    phoneNumbers,
    phoneDetails,
    existingByPhoneId,
    ctx,
    wabaId,
    tx
  );

  const templates = await collectAllTemplates(ctx, { wabaId }, async request => {
    return executeGraphApiFetch<ListMessageTemplatesResponseBody>(request, messageTemplateListSchema);
  });

  const templateSnapshot = buildTemplateSnapshot(templates);

  const failedNote = failedCount > 0 ? ` ${failedCount} account writes failed` : "";
  await auditChange(
    actorUserId,
    "UPSERT",
    wabaId,
    {
      description: `Synced ${accounts.length} WhatsApp accounts and ${templates.length} templates from Meta${failedNote}`,
      metadata: {
        accountsSynced: accounts.length,
        templatesSynced: templates.length,
        failedAccountWrites: failedCount,
        templates: templateSnapshot,
      },
    },
    tx
  );

  return {
    id: "whatsapp-sync-result",
    accounts,
    templates: templateSnapshot,
  } satisfies WhatsappSyncFromMetaReturnType;
}
