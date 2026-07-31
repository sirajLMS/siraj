import { and, asc, eq, inArray, type SQL } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { userPaymentMethods } from "@/backend/db/schema";
import { PaymentDirection } from "@/backend/enum/billing/payment-method.enum";
import type {
  UserPaymentMethodInsertType,
  UserPaymentMethodSelectType,
} from "@/backend/types/billing/payment-method.types";
import type { ErrorsLabels } from "@/shared/locale";

type DefaultSlot = "PAYIN" | "PAYOUT";

type UserPaymentMethodRow = typeof userPaymentMethods.$inferSelect;

function toSelectType(row: UserPaymentMethodRow): UserPaymentMethodSelectType {
  return {
    ...row,
    type: row.type as UserPaymentMethodSelectType["type"],
    direction: row.direction as UserPaymentMethodSelectType["direction"],
  };
}

function slotDirections(slot: DefaultSlot): PaymentDirection[] {
  return slot === "PAYIN"
    ? [PaymentDirection.PAYIN, PaymentDirection.BOTH]
    : [PaymentDirection.PAYOUT, PaymentDirection.BOTH];
}

async function selectByCondition(
  condition: SQL | undefined,
  tx: DBTransaction | undefined,
  orderBy?: SQL
): Promise<UserPaymentMethodSelectType[]> {
  const client = queryDb(tx);
  const baseQuery = client.select().from(userPaymentMethods);
  const withWhere = condition ? baseQuery.where(condition) : baseQuery;
  return (orderBy ? withWhere.orderBy(orderBy) : withWhere).then(rows => rows.map(toSelectType));
}

export namespace UserPaymentMethodRepository {
  export async function listByUserId(userId: string, tx?: DBTransaction): Promise<UserPaymentMethodSelectType[]> {
    return selectByCondition(eq(userPaymentMethods.userId, userId), tx, asc(userPaymentMethods.createdAt));
  }

  export async function getById(id: string, tx?: DBTransaction): Promise<UserPaymentMethodSelectType | null> {
    const client = queryDb(tx);
    const [row] = await client.select().from(userPaymentMethods).where(eq(userPaymentMethods.id, id)).limit(1);
    return row ? toSelectType(row) : null;
  }

  export async function create(
    input: UserPaymentMethodInsertType,
    tx?: DBTransaction
  ): Promise<UserPaymentMethodSelectType> {
    const client = tx ?? db;
    const now = new Date();
    const [created] = await client
      .insert(userPaymentMethods)
      .values({
        ...input,
        createdAt: input.createdAt ?? now,
        updatedAt: input.updatedAt ?? now,
      })
      .returning();

    if (!created) {
      throw new Error("Failed to create user payment method");
    }

    return toSelectType(created);
  }

  export async function update(
    id: string,
    input: Partial<UserPaymentMethodInsertType>,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<UserPaymentMethodSelectType> {
    const client = tx ?? db;
    const [updated] = await client
      .update(userPaymentMethods)
      .set({ ...input, updatedAt: input.updatedAt ?? new Date() })
      .where(eq(userPaymentMethods.id, id))
      .returning();

    if (!updated) {
      throw new Error(tErrors.file.recordNotFound({ tableName: "user_payment_methods", entityId: id }));
    }

    return toSelectType(updated);
  }

  export async function deleteById(id: string, tErrors: ErrorsLabels, tx?: DBTransaction): Promise<void> {
    const client = tx ?? db;
    const [deleted] = await client
      .delete(userPaymentMethods)
      .where(eq(userPaymentMethods.id, id))
      .returning({ id: userPaymentMethods.id });

    if (!deleted) {
      throw new Error(tErrors.file.recordNotFound({ tableName: "user_payment_methods", entityId: id }));
    }
  }

  export async function clearDefaultsInSlot(userId: string, slot: DefaultSlot, tx?: DBTransaction): Promise<void> {
    const client = tx ?? db;
    await client
      .update(userPaymentMethods)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(
        and(
          eq(userPaymentMethods.userId, userId),
          eq(userPaymentMethods.isDefault, true),
          inArray(userPaymentMethods.direction, slotDirections(slot))
        )
      );
  }

  export async function setVerified(
    id: string,
    verifiedByUserId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<UserPaymentMethodSelectType> {
    return update(
      id,
      {
        verifiedAt: new Date(),
        verifiedByUserId,
      },
      tErrors,
      tx
    );
  }

  export async function listDefaultsByUserId(
    userId: string,
    tx?: DBTransaction
  ): Promise<UserPaymentMethodSelectType[]> {
    return selectByCondition(and(eq(userPaymentMethods.userId, userId), eq(userPaymentMethods.isDefault, true)), tx);
  }

  export async function findDefaultForSlot(
    userId: string,
    slot: DefaultSlot,
    tx?: DBTransaction
  ): Promise<UserPaymentMethodSelectType | null> {
    const client = queryDb(tx);
    const [row] = await client
      .select()
      .from(userPaymentMethods)
      .where(
        and(
          eq(userPaymentMethods.userId, userId),
          eq(userPaymentMethods.isDefault, true),
          inArray(userPaymentMethods.direction, slotDirections(slot))
        )
      )
      .limit(1);

    return row ? toSelectType(row) : null;
  }
}
