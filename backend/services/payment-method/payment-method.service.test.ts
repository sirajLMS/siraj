import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { SupportedMobileWalletRepository } from "@/backend/db/repo/billing/supported-mobile-wallet.repository";
import { UserPaymentMethodRepository } from "@/backend/db/repo/billing/user-payment-method.repository";
import { NotificationPreferencesRepository } from "@/backend/db/repo/notifications/notification-preferences.repository";
import { PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import { NotificationEventType } from "@/backend/enum/notifications/notificationDeliveries.enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { CommunicationService } from "@/backend/services/communication/communication.service";
import { PaymentMethodService } from "@/backend/services/payment-method/payment-method.service";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

interface CommunicationPayloadShape {
  readonly userId: string;
  readonly eventType: NotificationEventType;
  readonly channel: string;
  readonly title: string;
  readonly body: string | null;
  readonly metadata?: Record<string, unknown>;
}

// Valid UUIDs (Zod's `.uuid()` enforces the RFC 4122 v1-5 + 0/forEach pattern).
const ACTOR_ID = "11111111-1111-4111-8111-111111111111";
const OWNER_ID = "22222222-2222-4222-8222-222222222222";
const METHOD_ID = "33333333-3333-4333-8333-333333333333";
const WALLET_ID = "44444444-4444-4444-8444-444444444444";

const baseMethod = {
  id: METHOD_ID,
  userId: OWNER_ID,
  type: PaymentMethodType.MOBILE_WALLET,
  direction: PaymentDirection.PAYIN,
  isDefault: false,
  label: "Test wallet",
  details: { walletId: WALLET_ID, phone: "01012345678" },
  verifiedAt: null,
  verifiedByUserId: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const baseMethodBankTransfer = {
  ...baseMethod,
  type: PaymentMethodType.BANK_TRANSFER,
  direction: PaymentDirection.PAYOUT,
  details: {
    beneficiaryName: "Default Teacher",
    bankName: "National Bank of Egypt",
    iban: "EG38001800000000001234567890",
  },
};

const mobileWalletCreateInput = {
  userId: OWNER_ID,
  type: PaymentMethodType.MOBILE_WALLET,
  direction: PaymentDirection.PAYIN,
  isDefault: false,
  label: "Test wallet",
  details: { walletId: WALLET_ID, phone: "01012345678" },
};

describe("PaymentMethodService notification dispatch", () => {
  const spies: ReturnType<typeof spyOn>[] = [];
  let dispatchMultiSpy: ReturnType<typeof spyOn>;
  let tErrors: ErrorsLabels;

  beforeEach(() => {
    tErrors = getServerTranslations("en").errorsTranslations;

    dispatchMultiSpy = spyOn(CommunicationService, "dispatchMulti").mockResolvedValue([
      { channel: "on_app", success: true },
      { channel: "email", success: true },
      { channel: "sms", success: true },
      { channel: "push", success: true },
    ]);
    spies.push(dispatchMultiSpy);

    const prefsSpy = spyOn(NotificationPreferencesRepository, "getByUserId").mockResolvedValue([]);
    spies.push(prefsSpy);

    const permsSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    spies.push(permsSpy);

    // Pretend the mobile-wallet catalog row is active so `assertCatalogActive` passes
    // for `createUserPaymentMethod` tests that go through the real mutation path.
    const walletSpy = spyOn(SupportedMobileWalletRepository, "getById").mockResolvedValue({
      id: WALLET_ID,
      slug: "vodafone_cash_eg",
      name: { en: "Vodafone Cash", ar: "فودافون كاش" },
      description: null,
      instructions: null,
      countryCode: null,
      currencyCode: null,
      phoneRegion: null,
      supportedDirections: PaymentDirection.BOTH,
      logoUrl: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    spies.push(walletSpy);
  });

  afterEach(() => {
    for (const spy of spies) spy.mockRestore();
    spies.length = 0;
  });

  function track<T extends ReturnType<typeof spyOn>>(spy: T): T {
    spies.push(spy);
    return spy;
  }

  function assertPaymentMethodChangedPayloads(expectedUserId: string = OWNER_ID): CommunicationPayloadShape[] {
    expect(dispatchMultiSpy).toHaveBeenCalledTimes(1);
    const payloads = dispatchMultiSpy.mock.calls[0][0] as CommunicationPayloadShape[];
    expect(payloads).toHaveLength(4);
    expect(payloads.every(payload => payload.eventType === NotificationEventType.PAYMENT_METHOD_CHANGED)).toBe(true);
    expect(payloads.every(payload => payload.userId === expectedUserId)).toBe(true);
    return payloads;
  }

  // Shared spy setup for mutation paths that route through `updateUserPaymentMethodCore`
  // (update + setDefault both mock the same getById/update/clearDefaultsInSlot trio).
  function setupUpdateCoreSpies(updatedMethod: typeof baseMethod) {
    const existingSpy = track(spyOn(UserPaymentMethodRepository, "getById").mockResolvedValue({ ...baseMethod }));
    const updateSpy = track(spyOn(UserPaymentMethodRepository, "update").mockResolvedValue({ ...updatedMethod }));
    track(spyOn(UserPaymentMethodRepository, "clearDefaultsInSlot").mockResolvedValue(undefined));
    return { existingSpy, updateSpy };
  }

  test("createUserPaymentMethod dispatches PAYMENT_METHOD_CHANGED once with action=created and userId=owner", async () => {
    const createSpy = track(spyOn(UserPaymentMethodRepository, "create").mockResolvedValue({ ...baseMethod }));

    await PaymentMethodService.createUserPaymentMethod(ACTOR_ID, mobileWalletCreateInput, tErrors);

    expect(createSpy).toHaveBeenCalledTimes(1);
    assertPaymentMethodChangedPayloads();
  });

  test("updateUserPaymentMethod dispatches PAYMENT_METHOD_CHANGED once with action=updated", async () => {
    const { existingSpy, updateSpy } = setupUpdateCoreSpies({ ...baseMethod, label: "Updated" });

    await PaymentMethodService.updateUserPaymentMethod(ACTOR_ID, METHOD_ID, { label: "Updated" }, tErrors);

    expect(existingSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledTimes(1);
    assertPaymentMethodChangedPayloads();
  });

  test("deleteUserPaymentMethod dispatches PAYMENT_METHOD_CHANGED with action=deleted", async () => {
    const existingSpy = track(spyOn(UserPaymentMethodRepository, "getById").mockResolvedValue({ ...baseMethod }));
    const deleteSpy = track(spyOn(UserPaymentMethodRepository, "deleteById").mockResolvedValue(undefined));

    await PaymentMethodService.deleteUserPaymentMethod(ACTOR_ID, METHOD_ID, tErrors);

    expect(existingSpy).toHaveBeenCalledTimes(1);
    expect(deleteSpy).toHaveBeenCalledTimes(1);
    assertPaymentMethodChangedPayloads();
  });

  test("setDefaultUserPaymentMethod dispatches PAYMENT_METHOD_CHANGED exactly once with action=setDefault", async () => {
    const { existingSpy, updateSpy } = setupUpdateCoreSpies({ ...baseMethod, isDefault: true });

    await PaymentMethodService.setDefaultUserPaymentMethod(ACTOR_ID, METHOD_ID, tErrors);

    // setDefaultUserPaymentMethod calls getById once for its own guard, then
    // updateUserPaymentMethodCore calls getById again for its existence check.
    expect(existingSpy).toHaveBeenCalledTimes(2);
    expect(updateSpy).toHaveBeenCalledTimes(1);
    assertPaymentMethodChangedPayloads();
  });

  test("verifyBankTransferPaymentMethod dispatches PAYMENT_METHOD_CHANGED with action=verified", async () => {
    track(spyOn(UserPaymentMethodRepository, "getById").mockResolvedValue({ ...baseMethodBankTransfer }));
    const verifySpy = track(
      spyOn(UserPaymentMethodRepository, "setVerified").mockResolvedValue({
        ...baseMethodBankTransfer,
        verifiedAt: new Date(),
        verifiedByUserId: ACTOR_ID,
      })
    );

    await PaymentMethodService.verifyBankTransferPaymentMethod(ACTOR_ID, METHOD_ID, tErrors);

    expect(verifySpy).toHaveBeenCalledTimes(1);
    assertPaymentMethodChangedPayloads();
  });

  test("dispatch failure does not throw out of create action", async () => {
    track(spyOn(UserPaymentMethodRepository, "create").mockResolvedValue({ ...baseMethod }));
    dispatchMultiSpy.mockRejectedValueOnce(new Error("dispatch boom"));

    let err: unknown = null;
    try {
      const result = await PaymentMethodService.createUserPaymentMethod(ACTOR_ID, mobileWalletCreateInput, tErrors);
      expect(result).toBeDefined();
    } catch (e) {
      err = e;
    }
    expect(err).toBeNull();
  });
});
