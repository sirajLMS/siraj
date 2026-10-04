import { eq } from "drizzle-orm";
import { db } from "@/backend/db";
import type { ParentProfileResult } from "@/backend/db/repo/parents/parent.repository.helpers";
import { getParentProfileImpl } from "@/backend/db/repo/parents/parent.repository.profile";
import { UserRepository } from "@/backend/db/repo/users";
import { parents, users } from "@/backend/db/schema";
import { AccountStatus, type ParentStatus } from "@/backend/enum";
import type {
  DBTransaction,
  ParentCreateResult,
  ParentInsertType,
  ParentProfileUpdateInput,
  ParentSelectType,
} from "@/backend/types";
import { parseAccountStatus, parseIanaTimezone, parseParentStatus } from "@/shared/lib/enum";
import { getServerTranslations } from "@/shared/locale";

export const createParentImpl = async (
  input: ParentInsertType,
  tx?: DBTransaction,
  locale?: string
): Promise<ParentCreateResult> => {
  const executor = tx ?? db;

  if (!input.userId) {
    const { session } = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new Error(session.userIdRequired);
  }
  const userId = input.userId;

  const existingParent = await executor
    .select({ id: parents.id })
    .from(parents)
    .where(eq(parents.userId, userId))
    .limit(1);

  if (existingParent.length > 0) {
    const { parent } = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new Error(parent.alreadyExists);
  }

  const [created] = await executor
    .insert(parents)
    .values({
      ...input,
      createdAt: input.createdAt ?? new Date(),
      updatedAt: input.updatedAt ?? new Date(),
    })
    .returning();

  if (!created) {
    const { parent } = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new Error(parent.createFailed);
  }

  const [userRow] = await executor
    .select({ timezone: users.timezone })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return {
    id: created.id,
    userId: created.userId,
    status: created.status,
    invoiceType: created.invoiceType,
    feeAmount: created.feeAmount,
    currency: created.currency,
    timezone: parseIanaTimezone(userRow?.timezone),
    createdAt: created.createdAt,
  };
};

type DeactivatedParentResult = {
  id: string;
  userId: string;
  accountStatus: AccountStatus;
  updatedAt: Date;
};

async function setParentAccountStatus(
  parentId: string,
  nextStatus: AccountStatus,
  conflictWhenDeactivated: boolean,
  tx?: DBTransaction,
  locale?: string
): Promise<DeactivatedParentResult> {
  const executor = tx ?? db;
  const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;

  const existing = await executor
    .select({ id: parents.id, userId: parents.userId, accountStatus: users.status })
    .from(parents)
    .innerJoin(users, eq(parents.userId, users.id))
    .where(eq(parents.id, parentId))
    .limit(1);

  if (existing.length === 0) {
    throw new Error(errorsTranslations.parentNotFound);
  }

  const current = existing[0];
  const isDeactivated = parseAccountStatus(current.accountStatus) === parseAccountStatus("DEACTIVATED");
  if (isDeactivated === conflictWhenDeactivated) {
    throw new Error(
      conflictWhenDeactivated ? errorsTranslations.parentAlreadyDeactivated : errorsTranslations.parentAlreadyActivated
    );
  }

  const updatedUser = await UserRepository.updateStatus(current.userId, nextStatus, tx, locale);

  const [updatedParent] = await executor
    .update(parents)
    .set({ updatedAt: new Date() })
    .where(eq(parents.id, parentId))
    .returning({
      id: parents.id,
      userId: parents.userId,
      updatedAt: parents.updatedAt,
    });

  return {
    id: updatedParent.id,
    userId: updatedParent.userId,
    accountStatus: parseAccountStatus(updatedUser.status),
    updatedAt: updatedParent.updatedAt,
  };
}

export const deactivateParentImpl = async (
  parentId: string,
  tx?: DBTransaction,
  locale?: string
): Promise<DeactivatedParentResult> => {
  return setParentAccountStatus(parentId, AccountStatus.DEACTIVATED, true, tx, locale);
};

export const reactivateParentImpl = async (
  parentId: string,
  tx?: DBTransaction,
  locale?: string
): Promise<DeactivatedParentResult> => {
  return setParentAccountStatus(parentId, AccountStatus.ACTIVATED, false, tx, locale);
};

type ChangeParentLifecycleResult = {
  id: string;
  lifecycleStatus: ParentStatus;
};

export const changeLifecycleStatusImpl = async (
  parentId: string,
  newStatus: ParentStatus,
  tx?: DBTransaction,
  locale?: string
): Promise<ChangeParentLifecycleResult> => {
  const executor = tx ?? db;
  const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;

  const existing = await executor.select({ id: parents.id }).from(parents).where(eq(parents.id, parentId)).limit(1);

  if (existing.length === 0) {
    throw new Error(errorsTranslations.parentNotFound);
  }

  const [updated] = await executor
    .update(parents)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(parents.id, parentId))
    .returning({
      id: parents.id,
      status: parents.status,
    });

  return {
    id: updated.id,
    lifecycleStatus: parseParentStatus(updated.status) ?? newStatus,
  };
};

export const updateParentProfileImpl = async (
  parentId: string,
  input: ParentProfileUpdateInput,
  locale?: string,
  tx?: DBTransaction
): Promise<ParentProfileResult> => {
  const executor = tx ?? db;
  const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;

  const existing = await getParentProfileImpl(parentId, tx);
  if (!existing) {
    throw new Error(errorsTranslations.parentNotFound);
  }

  const now = new Date();
  const parentUpdate: Record<string, unknown> = { updatedAt: now };

  if (input.nationality !== undefined) parentUpdate.nationality = input.nationality;
  if (input.address !== undefined) parentUpdate.address = input.address;
  if (input.facebook !== undefined) parentUpdate.facebook = input.facebook;
  if (input.whatsapp !== undefined) parentUpdate.whatsapp = input.whatsapp;
  if (input.twitter !== undefined) parentUpdate.twitter = input.twitter;
  if (input.invoiceType !== undefined) parentUpdate.invoiceType = input.invoiceType;
  if (input.feeAmount !== undefined) parentUpdate.feeAmount = input.feeAmount;
  if (input.currency !== undefined) parentUpdate.currency = input.currency;

  await executor.update(parents).set(parentUpdate).where(eq(parents.id, parentId));

  const updated = await getParentProfileImpl(parentId, tx);
  if (!updated) {
    throw new Error(errorsTranslations.parentNotFound);
  }

  return updated;
};

export const upsertByUserIdImpl = async (
  userId: string,
  status: string,
  tx?: DBTransaction,
  locale?: string
): Promise<ParentSelectType> => {
  const executor = tx ?? db;
  const now = new Date();
  const [row] = await executor
    .insert(parents)
    .values({ userId, status, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: parents.userId,
      set: { status, updatedAt: now },
    })
    .returning();
  if (!row) {
    const i18n = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new Error(i18n.parent.upsertFailed);
  }
  return row;
};
