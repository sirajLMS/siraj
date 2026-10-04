/**
 * Cron schedule CRUD implementations backing `CronService`.
 *
 * Extracted from `cron.service.ts` to keep the orchestration module within the
 * file-size limit; `CronService` re-exposes every function here under its
 * original name.
 */
import { CronRepository, toScheduleReturnType } from "@/backend/db/repo/cron";
import { CronScheduleStatus } from "@/backend/enum/cron/cron.enums";
import { DomainError, ForbiddenError, NotFoundError, UnauthorizedError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import {
  InvalidCronExpression,
  nextRunAt,
  validateCronExpression,
} from "@/backend/services/cron/cron-scheduler.engine";
import { isDuplicateError } from "@/backend/services/shared/is-duplicate-error";
import type {
  CronScheduleInsertType,
  CronScheduleListInput,
  CronScheduleListResult,
  CronScheduleReturnType,
  CronScheduleSelectType,
  CronScheduleSubmitInput,
  CronScheduleUpdateInput,
} from "@/backend/types";
import { getServerTranslations } from "@/shared/locale/server-graphql";

/**
 * Hard cap for a persisted cron schedule payload — defense-in-depth on top
 * of the GraphQL request-body cap, so a single field cannot monopolize
 * storage with deeply nested JSON.
 */
const MAX_CRON_PAYLOAD_BYTES = 64 * 1024;

export type CronScheduleErrors = ReturnType<typeof getServerTranslations>["dashboardTranslations"]["cron"]["errors"];

function getScheduleErrorTranslations(locale: string): CronScheduleErrors {
  return getServerTranslations(locale).dashboardTranslations.cron.errors;
}

export async function assertScheduleExists(id: string, t: CronScheduleErrors): Promise<CronScheduleSelectType> {
  const existing = await CronRepository.getScheduleById(id);
  if (!existing) {
    throw new NotFoundError("SCHEDULE", t.scheduleNotFound(id));
  }
  return existing;
}

function validateTimezone(timezone: string, errFn: (tz: string) => string): void {
  try {
    // Intl.DateTimeFormat throws if timezone is invalid; we don't need the instance
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch (err) {
    throw new DomainError("INVALID_TIMEZONE", errFn(timezone), { cause: err });
  }
}

export async function createScheduleImpl(
  input: CronScheduleSubmitInput,
  locale: string = "en",
  createdByUserId?: string
): Promise<CronScheduleReturnType> {
  const translations = getServerTranslations(locale);
  const t = translations.dashboardTranslations.cron.errors;

  if (!createdByUserId) {
    throw new UnauthorizedError(t.userContextRequired);
  }

  if (input.payload != null && Buffer.byteLength(JSON.stringify(input.payload)) > MAX_CRON_PAYLOAD_BYTES) {
    throw new DomainError("CRON_PAYLOAD_TOO_LARGE", t.payloadTooLarge);
  }

  if (!validateCronExpression(input.cronExpression)) {
    throw new InvalidCronExpression(input.cronExpression, t.invalidCronExpression(input.cronExpression));
  }

  if (input.timezone) {
    validateTimezone(input.timezone, t.invalidTimezone);
  } else {
    // Timezone is always present in valid input; throw error if missing
    throw new DomainError("INVALID_TIMEZONE", t.invalidTimezone("undefined"));
  }

  const computedNextRunAt = nextRunAt(input.cronExpression, new Date(), input.timezone);

  // Pre-check for existing schedule name (fast path)
  const existing = await CronRepository.getScheduleByName(input.name);
  if (existing) {
    throw new DomainError("SCHEDULE_NAME_TAKEN", t.scheduleNameTaken(input.name));
  }

  const insertData: CronScheduleInsertType = {
    ...input,
    createdByUserId,
    nextRunAt: computedNextRunAt,
    status: CronScheduleStatus.ACTIVE,
  };

  let row: CronScheduleSelectType;
  try {
    row = await CronRepository.createSchedule(insertData);
  } catch (err) {
    if (isDuplicateError(err)) {
      throw new DomainError("SCHEDULE_NAME_TAKEN", t.scheduleNameTaken(input.name), { cause: err });
    }
    throw err;
  }
  logger.info("cron.schedule.created", { id: row.id, name: row.name });

  return toScheduleReturnType(row);
}

export async function updateScheduleImpl(
  id: string,
  input: CronScheduleUpdateInput,
  locale: string = "en",
  updatedByUserId?: string
): Promise<CronScheduleReturnType> {
  const translations = getServerTranslations(locale);
  const t = translations.dashboardTranslations.cron.errors;

  if (!updatedByUserId) {
    throw new UnauthorizedError(t.userContextRequired);
  }

  if (input.payload != null && Buffer.byteLength(JSON.stringify(input.payload)) > MAX_CRON_PAYLOAD_BYTES) {
    throw new DomainError("CRON_PAYLOAD_TOO_LARGE", t.payloadTooLarge);
  }

  const existing = await CronRepository.getScheduleById(id);
  if (!existing) {
    throw new NotFoundError("SCHEDULE", t.scheduleNotFound(id));
  }

  if (input.cronExpression && !validateCronExpression(input.cronExpression)) {
    throw new InvalidCronExpression(input.cronExpression, t.invalidCronExpression(input.cronExpression));
  }

  if (input.timezone) {
    validateTimezone(input.timezone, t.invalidTimezone);
  }

  const cronChanged = input.cronExpression && input.cronExpression !== existing.cronExpression;
  const tzChanged = input.timezone && input.timezone !== existing.timezone;
  const shouldRecompute = cronChanged ?? tzChanged;

  const updateData: CronScheduleUpdateInput = { ...input };
  if (shouldRecompute && existing.status === (CronScheduleStatus.ACTIVE as typeof existing.status)) {
    updateData.nextRunAt = nextRunAt(
      input.cronExpression ?? existing.cronExpression,
      new Date(),
      input.timezone ?? existing.timezone
    );
  }

  const row = await CronRepository.updateSchedule(id, { ...updateData, updatedByUserId });
  if (!row) {
    throw new NotFoundError("SCHEDULE", t.scheduleNotFound(id));
  }

  logger.info("cron.schedule.updated", { id });
  return toScheduleReturnType(row);
}

export async function pauseScheduleImpl(id: string, locale: string = "en"): Promise<CronScheduleReturnType> {
  const t = getScheduleErrorTranslations(locale);
  await assertScheduleExists(id, t);

  const updated = await CronRepository.updateScheduleIfStatus(
    id,
    {
      status: CronScheduleStatus.PAUSED,
      nextRunAt: null,
    },
    CronScheduleStatus.ACTIVE
  );
  if (!updated) {
    throw new ForbiddenError(t.scheduleNotActive);
  }

  logger.info("cron.schedule.paused", { id });
  return toScheduleReturnType(updated);
}

export async function resumeScheduleImpl(id: string, locale: string = "en"): Promise<CronScheduleReturnType> {
  const t = getScheduleErrorTranslations(locale);
  const existing = await assertScheduleExists(id, t);

  const computedNextRunAt = nextRunAt(existing.cronExpression, new Date(), existing.timezone);

  const updated = await CronRepository.updateScheduleIfStatus(
    id,
    {
      status: CronScheduleStatus.ACTIVE,
      nextRunAt: computedNextRunAt,
    },
    CronScheduleStatus.PAUSED
  );
  if (!updated) {
    throw new ForbiddenError(t.scheduleNotPaused);
  }

  logger.info("cron.schedule.resumed", { id, nextRunAt: computedNextRunAt });
  return toScheduleReturnType(updated);
}

export async function deleteScheduleImpl(params: { id: string; hard?: boolean }, locale: string = "en"): Promise<void> {
  const translations = getServerTranslations(locale);
  const t = translations.dashboardTranslations.cron.errors;
  const existing = await CronRepository.getScheduleById(params.id);
  if (!existing) {
    throw new NotFoundError("SCHEDULE", t.scheduleNotFound(params.id));
  }

  if (params.hard) {
    await CronRepository.permanentlyDeleteScheduleById(params.id);
  } else {
    await CronRepository.softDeleteScheduleById(params.id);
  }
  logger.info("cron.schedule.deleted", { id: params.id, hard: params.hard ?? false });
}

export async function getScheduleImpl(id: string): Promise<CronScheduleReturnType | null> {
  const row = await CronRepository.getScheduleById(id);
  return row ? toScheduleReturnType(row) : null;
}

export async function getSchedulesImpl(input: CronScheduleListInput = {}): Promise<CronScheduleListResult> {
  return CronRepository.listSchedules(input);
}
