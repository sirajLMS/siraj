/**
 * Seed-only push notification device token provisioning.
 *
 * Registers fake device tokens for demo users during `bun db seed`.
 * Production push registration lives in notification domain services / GraphQL
 * resolvers — **not here**.
 *
 * Writes blocked on real production via {@link assertSeedWriteAllowed}.
 *
 * @see backend/db/seeds/users/seed-user-device-tokens.ts
 */
import type { DBTransaction } from "@/backend/db/db.types";
import { NotificationRepository } from "@/backend/db/repo/notifications/notification.repository";
import { assertSeedWriteAllowed } from "@/backend/lib/bootstrap-gate";
import { isDuplicateError } from "@/backend/services/shared/is-duplicate-error";
import type { RegisterDeviceTokenInput, UserDeviceTokenSelectType } from "@/backend/types";

export namespace NotificationDeviceSeedService {
  /** Idempotently register one demo device token for a user. */
  export async function seedDeviceToken(
    userId: string,
    input: RegisterDeviceTokenInput,
    tx?: DBTransaction
  ): Promise<UserDeviceTokenSelectType> {
    assertSeedWriteAllowed("Device token seed writes");
    try {
      return await NotificationRepository.registerDeviceToken(userId, input, tx);
    } catch (error) {
      if (!isDuplicateError(error)) throw error;
      return NotificationRepository.registerDeviceToken(userId, input, tx);
    }
  }

  /** Idempotently register many demo device tokens. */
  export async function seedManyDeviceTokens(
    entries: readonly { userId: string; input: RegisterDeviceTokenInput }[],
    tx?: DBTransaction
  ): Promise<UserDeviceTokenSelectType[]> {
    return entries.reduce<Promise<UserDeviceTokenSelectType[]>>(
      async (prev, entry) => [...(await prev), await seedDeviceToken(entry.userId, entry.input, tx)],
      Promise.resolve([])
    );
  }
}
