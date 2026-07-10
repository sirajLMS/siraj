import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { supportedMobileWallets } from "@/backend/db/schema/billing/supported-mobile-wallets";
import { supportedPaymentLinks } from "@/backend/db/schema/billing/supported-payment-links";
import { userPaymentMethods } from "@/backend/db/schema/billing/user-payment-methods";
import { findAdminUser, loadSeedConfig, type SeedConfig } from "@/backend/db/seeds/lib";
import { PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import logger from "@/backend/lib/logger";
import { encryptBankTransferDetails } from "@/backend/lib/payment-method-jsonb";
import type { UserPaymentMethodSelectType, UserSelectType } from "@/backend/types";

const DEMO_PARENT_EMAIL = "parent@siraj.local";
const DEMO_TEACHER_EMAIL = "teacher@siraj.local";

const PARENT_MOBILE_WALLET_SLUG = "vodafone_cash_eg";
const PARENT_PAYMENT_LINK_SLUG = "instapay_eg";

const DEMO_PARENT_WALLET_PHONE = "01012345678";
const DEMO_PARENT_INSTAPAY_URL = "https://instapay.com.eg/demo-parent";

function toUserPaymentMethodSelectType(row: {
  id: string;
  userId: string;
  type: string;
  direction: string;
  isDefault: boolean;
  label: string | null;
  details: UserPaymentMethodSelectType["details"];
  verifiedAt: Date | null;
  verifiedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): UserPaymentMethodSelectType {
  return {
    ...row,
    type: row.type as PaymentMethodType,
    direction: row.direction as PaymentDirection,
  };
}

const DEMO_TEACHER_BANK = {
  beneficiaryName: "Default Teacher",
  bankName: "National Bank of Egypt",
  iban: "EG38001800000000001234567890",
} as const;

async function findCatalogMobileWalletId(slug: string): Promise<string> {
  const [wallet] = await db
    .select({ id: supportedMobileWallets.id })
    .from(supportedMobileWallets)
    .where(eq(supportedMobileWallets.slug, slug))
    .limit(1);

  if (!wallet) {
    throw new Error(
      `Supported mobile wallet catalog row not found for slug "${slug}". Run payment catalog seeds before user payment method seeds.`
    );
  }

  return wallet.id;
}

async function findCatalogPaymentLinkId(slug: string): Promise<string> {
  const [link] = await db
    .select({ id: supportedPaymentLinks.id })
    .from(supportedPaymentLinks)
    .where(eq(supportedPaymentLinks.slug, slug))
    .limit(1);

  if (!link) {
    throw new Error(
      `Supported payment link catalog row not found for slug "${slug}". Run payment catalog seeds before user payment method seeds.`
    );
  }

  return link.id;
}

async function findExistingDefault(
  userId: string,
  slot: "payin" | "payout"
): Promise<UserPaymentMethodSelectType | undefined> {
  const directions =
    slot === "payin"
      ? [PaymentDirection.PAYIN, PaymentDirection.BOTH]
      : [PaymentDirection.PAYOUT, PaymentDirection.BOTH];

  const [existing] = await db
    .select()
    .from(userPaymentMethods)
    .where(
      and(
        eq(userPaymentMethods.userId, userId),
        eq(userPaymentMethods.isDefault, true),
        inArray(userPaymentMethods.direction, directions)
      )
    )
    .limit(1);

  return existing ? toUserPaymentMethodSelectType(existing) : undefined;
}

async function seedDemoParentPayinDefault(parentUser: UserSelectType, now: Date): Promise<UserPaymentMethodSelectType> {
  const existing = await findExistingDefault(parentUser.id, "payin");
  if (existing) {
    return existing;
  }

  let walletId: string | undefined;
  try {
    walletId = await findCatalogMobileWalletId(PARENT_MOBILE_WALLET_SLUG);
  } catch (walletError) {
    logger.warn(
      `Mobile wallet catalog "${PARENT_MOBILE_WALLET_SLUG}" unavailable; falling back to InstaPay payment link.`,
      walletError
    );
  }

  if (walletId) {
    const [inserted] = await db
      .insert(userPaymentMethods)
      .values({
        userId: parentUser.id,
        type: PaymentMethodType.MOBILE_WALLET,
        direction: PaymentDirection.PAYIN,
        isDefault: true,
        label: "Vodafone Cash",
        details: {
          walletId,
          phone: DEMO_PARENT_WALLET_PHONE,
        },
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return toUserPaymentMethodSelectType(inserted);
  }

  const paymentLinkId = await findCatalogPaymentLinkId(PARENT_PAYMENT_LINK_SLUG);
  const [inserted] = await db
    .insert(userPaymentMethods)
    .values({
      userId: parentUser.id,
      type: PaymentMethodType.PAYMENT_LINK,
      direction: PaymentDirection.PAYIN,
      isDefault: true,
      label: "InstaPay",
      details: {
        paymentLinkId,
        url: DEMO_PARENT_INSTAPAY_URL,
      },
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return toUserPaymentMethodSelectType(inserted);
}

async function seedDemoTeacherPayoutDefault(
  teacherUser: UserSelectType,
  adminUser: UserSelectType | undefined,
  now: Date
): Promise<UserPaymentMethodSelectType> {
  const existing = await findExistingDefault(teacherUser.id, "payout");
  if (existing) {
    if (existing.verifiedAt === null && adminUser && existing.type === PaymentMethodType.BANK_TRANSFER) {
      const [verified] = await db
        .update(userPaymentMethods)
        .set({
          verifiedAt: now,
          verifiedByUserId: adminUser.id,
          updatedAt: now,
        })
        .where(eq(userPaymentMethods.id, existing.id))
        .returning();
      return toUserPaymentMethodSelectType(verified);
    }
    return toUserPaymentMethodSelectType(existing);
  }

  const encryptedDetails = encryptBankTransferDetails({
    beneficiaryName: DEMO_TEACHER_BANK.beneficiaryName,
    bankName: DEMO_TEACHER_BANK.bankName,
    iban: DEMO_TEACHER_BANK.iban,
  });

  const [inserted] = await db
    .insert(userPaymentMethods)
    .values({
      userId: teacherUser.id,
      type: PaymentMethodType.BANK_TRANSFER,
      direction: PaymentDirection.PAYOUT,
      isDefault: true,
      label: "Primary bank account",
      details: encryptedDetails,
      verifiedAt: adminUser ? now : null,
      verifiedByUserId: adminUser?.id ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return toUserPaymentMethodSelectType(inserted);
}

export async function seedOrGet(
  usersList: UserSelectType[],
  config?: SeedConfig
): Promise<UserPaymentMethodSelectType[]> {
  logger.info("Seeding demo user payment methods...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!usersList?.length) {
    return [];
  }

  const parentUser = usersList.find(u => u.email === DEMO_PARENT_EMAIL);
  const teacherUser = usersList.find(u => u.email === DEMO_TEACHER_EMAIL);

  if (!parentUser && !teacherUser) {
    logger.warn("No demo parent/teacher users found; skipping user payment method seeds.");
    return [];
  }

  const adminUser = findAdminUser(usersList);
  const results: UserPaymentMethodSelectType[] = [];

  if (parentUser) {
    results.push(await seedDemoParentPayinDefault(parentUser, now));
  }

  if (teacherUser) {
    results.push(await seedDemoTeacherPayoutDefault(teacherUser, adminUser, now));
  }

  logger.info(`Demo user payment methods seeded (${results.length} rows, profile=${seedConfig.profile}).`);
  return results;
}
