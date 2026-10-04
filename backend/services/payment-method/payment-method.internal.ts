import { UserPaymentMethodRepository } from "@/backend/db/repo";
import { userPaymentMethodSubmitInputSchema } from "@/backend/lib/payment-method.validation";
import {
  assertCatalogActive,
  encryptDetailsForStorage,
  slotsForDirection,
} from "@/backend/services/payment-method/payment-method.helpers";
import { buildMaskedPaymentMethod } from "@/backend/services/payment-method/payment-method-mask";
import type { DBTransaction, UserPaymentMethodReturnType, UserPaymentMethodSubmitInput } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

export namespace PaymentMethodInternal {
  export async function createUserPaymentMethodInternal(
    input: UserPaymentMethodSubmitInput,
    tx: DBTransaction
  ): Promise<UserPaymentMethodReturnType> {
    const parsed = userPaymentMethodSubmitInputSchema.parse(input);
    const encryptedDetails = encryptDetailsForStorage(parsed.type, input.details);

    const tErrors = getServerTranslations("en").errorsTranslations;
    await assertCatalogActive(parsed.type, input.details, tErrors, tx);

    if (parsed.isDefault) {
      await Promise.all(
        slotsForDirection(parsed.direction).map(slot =>
          UserPaymentMethodRepository.clearDefaultsInSlot(parsed.userId, slot, tx)
        )
      );
    }

    const created = await UserPaymentMethodRepository.create(
      {
        ...parsed,
        details: encryptedDetails,
      },
      tx
    );

    return buildMaskedPaymentMethod(created, true);
  }
}
