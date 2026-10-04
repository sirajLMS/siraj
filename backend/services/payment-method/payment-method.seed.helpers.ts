import { db } from "@/backend/db/drizzleDb";
import { UserPaymentMethodRepository } from "@/backend/db/repo";
import { PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import { encryptBankTransferDetails } from "@/backend/lib/payment-method-jsonb";
import { PaymentMethodInternal } from "@/backend/services/payment-method/payment-method.internal";
import { buildMaskedPaymentMethod } from "@/backend/services/payment-method/payment-method-mask";
import type { DBTransaction, UserPaymentMethodReturnType } from "@/backend/types";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

type CatalogService = typeof import("@/backend/services/payment-method/payment-catalog.service").PaymentCatalogService;

async function seedParentPayinMethod(
  parentUser: { id: string; email: string },
  _adminUser: { id: string; email: string } | undefined,
  paymentCatalogService: CatalogService,
  tx: DBTransaction
): Promise<UserPaymentMethodReturnType | null> {
  const existingPayin = await UserPaymentMethodRepository.findDefaultForSlot(parentUser.id, "PAYIN", tx);
  if (existingPayin) {
    return buildMaskedPaymentMethod(existingPayin, true);
  }

  const wallet = await paymentCatalogService.getMobileWalletBySlug("vodafone_cash_eg", tx);
  if (wallet) {
    return PaymentMethodInternal.createUserPaymentMethodInternal(
      {
        userId: parentUser.id,
        type: PaymentMethodType.MOBILE_WALLET,
        direction: PaymentDirection.PAYIN,
        isDefault: true,
        label: "Vodafone Cash",
        details: { walletId: wallet.id, phone: "01012345678" },
      },
      tx
    );
  }

  const link = await paymentCatalogService.getPaymentLinkBySlug("instapay_eg", tx);
  if (!link) {
    throw new Error(
      'Supported payment link catalog row not found for slug "instapay_eg". Run payment catalog seeds before user payment method seeds.'
    );
  }
  return PaymentMethodInternal.createUserPaymentMethodInternal(
    {
      userId: parentUser.id,
      type: PaymentMethodType.PAYMENT_LINK,
      direction: PaymentDirection.PAYIN,
      isDefault: true,
      label: "InstaPay",
      details: { paymentLinkId: link.id, url: "https://instapay.com.eg/demo-parent" },
    },
    tx
  );
}

async function seedTeacherPayoutMethod(
  teacherUser: { id: string; email: string },
  adminUser: { id: string; email: string } | undefined,
  tErrors: ErrorsLabels,
  tx: DBTransaction
): Promise<UserPaymentMethodReturnType | null> {
  const existingPayout = await UserPaymentMethodRepository.findDefaultForSlot(teacherUser.id, "PAYOUT", tx);
  if (existingPayout) {
    if (existingPayout.verifiedAt === null && adminUser && existingPayout.type === PaymentMethodType.BANK_TRANSFER) {
      const verified = await UserPaymentMethodRepository.setVerified(existingPayout.id, adminUser.id, tErrors, tx);
      return buildMaskedPaymentMethod(verified, true);
    }
    return buildMaskedPaymentMethod(existingPayout, true);
  }

  const encryptedDetails = encryptBankTransferDetails({
    beneficiaryName: "Default Teacher",
    bankName: "National Bank of Egypt",
    iban: "EG38001800000000001234567890",
  });
  const created = await PaymentMethodInternal.createUserPaymentMethodInternal(
    {
      userId: teacherUser.id,
      type: PaymentMethodType.BANK_TRANSFER,
      direction: PaymentDirection.PAYOUT,
      isDefault: true,
      label: "Primary bank account",
      details: encryptedDetails,
    },
    tx
  );
  if (adminUser) {
    const verified = await UserPaymentMethodRepository.setVerified(created.id, adminUser.id, tErrors, tx);
    return buildMaskedPaymentMethod(verified, true);
  }
  return created;
}

export namespace PaymentMethodSeed {
  export async function seedDemoUserPaymentMethods(
    usersList: readonly { id: string; email: string }[]
  ): Promise<UserPaymentMethodReturnType[]> {
    const parentUser = usersList.find(u => u.email === "parent@siraj.local");
    const teacherUser = usersList.find(u => u.email === "teacher@siraj.local");
    if (!parentUser && !teacherUser) {
      return [];
    }

    const adminUser = usersList.find(u => u.email === "academy@siraj.local");
    const { PaymentCatalogService } = await import("@/backend/services/payment-method/payment-catalog.service");
    const tErrors = getServerTranslations("en").errorsTranslations;

    return db.transaction(async tx => {
      const results: UserPaymentMethodReturnType[] = [];

      if (parentUser) {
        const payinResult = await seedParentPayinMethod(parentUser, adminUser, PaymentCatalogService, tx);
        if (payinResult) results.push(payinResult);
      }

      if (teacherUser) {
        const payoutResult = await seedTeacherPayoutMethod(teacherUser, adminUser, tErrors, tx);
        if (payoutResult) results.push(payoutResult);
      }

      return results;
    });
  }
}
