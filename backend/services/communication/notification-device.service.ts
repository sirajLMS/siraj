import type { DBTransaction } from "@/backend/db/db.types";
import { NotificationRepository } from "@/backend/db/repo/notifications/notification.repository";
import { isDuplicateError } from "@/backend/services/shared/is-duplicate-error";
import type { RegisterDeviceTokenInput, UserDeviceTokenSelectType } from "@/backend/types";

function assertNonProduction(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Device token bootstrap operations are not allowed in production.");
  }
}

export namespace NotificationDeviceService {
  export async function registerDeviceToken(
    userId: string,
    input: RegisterDeviceTokenInput,
    tx?: DBTransaction
  ): Promise<UserDeviceTokenSelectType> {
    assertNonProduction();
    try {
      return await NotificationRepository.registerDeviceToken(userId, input, tx);
    } catch (error) {
      if (!isDuplicateError(error)) throw error;
      return NotificationRepository.registerDeviceToken(userId, input, tx);
    }
  }

  export async function registerManyDeviceTokens(
    entries: readonly { userId: string; input: RegisterDeviceTokenInput }[],
    tx?: DBTransaction
  ): Promise<UserDeviceTokenSelectType[]> {
    const results: UserDeviceTokenSelectType[] = [];
    for (const entry of entries) {
      results.push(await registerDeviceToken(entry.userId, entry.input, tx));
    }
    return results;
  }
}
