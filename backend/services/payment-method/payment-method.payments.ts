import { db } from "@/backend/db/drizzleDb";
import { BillingRepository, ParentRepository, TeacherRepository } from "@/backend/db/repo";
import { teacherPayments } from "@/backend/db/schema";
import { PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import { assertUuidShape, ForbiddenError, NotFoundError } from "@/backend/lib";
import {
  getPaymentMethodOrThrow,
  supportsTransactionDirection,
} from "@/backend/services/payment-method/payment-method.helpers";
import { PaymentMethodSnapshotService } from "@/backend/services/payment-method/payment-method-snapshot";
import type {
  CreateTeacherPaymentInput,
  DBTransaction,
  PaymentRecordInput,
  TeacherPaymentSelectType,
  UserPaymentMethodSubmitInput,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace PaymentMethodPayments {
  export async function recordPayin(
    input: Omit<PaymentRecordInput, "paymentMethodType" | "paymentMethodSnapshot"> & {
      readonly userPaymentMethodId?: string | null;
      readonly inlineMethod?: Pick<UserPaymentMethodSubmitInput, "type" | "label" | "details">;
    },
    tErrors: ErrorsLabels,
    tx?: DBTransaction,
    _locale?: string
  ) {
    assertUuidShape(
      input.invoiceId,
      () => new NotFoundError("INVOICE", tErrors.billing.invoiceNotFound(input.invoiceId))
    );
    if (input.userPaymentMethodId) {
      assertUuidShape(
        input.userPaymentMethodId,
        () =>
          new NotFoundError("PAYMENT_METHOD", tErrors.billing.paymentMethodNotFound(input.userPaymentMethodId ?? ""))
      );
    }
    let snapshotSource:
      | { userPaymentMethodId: string }
      | { inline: Pick<UserPaymentMethodSubmitInput, "type" | "label" | "details"> };

    if (input.userPaymentMethodId) {
      const method = await getPaymentMethodOrThrow(input.userPaymentMethodId, tErrors, tx);
      if (!supportsTransactionDirection(method.direction, PaymentDirection.PAYIN)) {
        throw new Error(tErrors.insufficientPermissions);
      }
      const invoice = await BillingRepository.getInvoiceById(input.invoiceId, tx);
      if (invoice === null) {
        throw new NotFoundError("INVOICE", tErrors.billing.invoiceNotFound(input.invoiceId));
      }
      const parentUserId = await ParentRepository.findUserIdByParentId(invoice.parentId, tx);
      if (method.userId !== parentUserId) {
        throw new ForbiddenError(tErrors.insufficientPermissions);
      }
      snapshotSource = { userPaymentMethodId: input.userPaymentMethodId };
    } else if (input.inlineMethod) {
      snapshotSource = { inline: input.inlineMethod };
    } else {
      throw new Error(tErrors.billing.invoiceNotFound("payin"));
    }

    const paymentMethodSnapshot = await PaymentMethodSnapshotService.buildTransactionSnapshot(
      snapshotSource,
      PaymentDirection.PAYIN,
      tx
    );

    return BillingRepository.recordPayment(
      {
        ...input,
        userPaymentMethodId: input.userPaymentMethodId ?? null,
        paymentMethodType: paymentMethodSnapshot.type,
        paymentMethodSnapshot,
      },
      tErrors,
      tx
    );
  }

  export async function recordPayout(
    input: CreateTeacherPaymentInput,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<TeacherPaymentSelectType> {
    const client = tx ?? db;

    if (!input.userPaymentMethodId) {
      throw new Error(tErrors.billing.invoiceNotFound(input.teacherId));
    }

    const method = await getPaymentMethodOrThrow(input.userPaymentMethodId, tErrors, tx);

    if (!supportsTransactionDirection(method.direction, PaymentDirection.PAYOUT)) {
      throw new Error(tErrors.insufficientPermissions);
    }

    const teacher = await TeacherRepository.findActiveById(input.teacherId, tx);
    if (teacher === null) {
      throw new NotFoundError("TEACHER", tErrors.teacher.teacherNotFound(input.teacherId));
    }
    if (method.userId !== teacher.userId) {
      throw new ForbiddenError(tErrors.insufficientPermissions);
    }

    if (!input.isTestPayment && method.type === PaymentMethodType.BANK_TRANSFER && method.verifiedAt === null) {
      throw new Error(tErrors.billing.invoiceNotFound(input.teacherId));
    }

    const paymentMethodSnapshot = await PaymentMethodSnapshotService.buildTransactionSnapshot(
      { userPaymentMethodId: input.userPaymentMethodId },
      PaymentDirection.PAYOUT,
      tx
    );

    const now = new Date();
    const [created] = await client
      .insert(teacherPayments)
      .values({
        teacherId: input.teacherId,
        userPaymentMethodId: input.userPaymentMethodId,
        paymentMethodType: paymentMethodSnapshot.type,
        paymentMethodSnapshot,
        amount: input.amount,
        currency: input.currency,
        paymentDate: input.paymentDate,
        isTestPayment: input.isTestPayment ?? false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!created) {
      throw new Error(tErrors.file.recordNotFound({ tableName: "teacher_payments", entityId: input.teacherId }));
    }

    return created;
  }
}
