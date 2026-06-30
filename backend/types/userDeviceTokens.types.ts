import type { userDeviceTokens } from "@/backend/db/schema";

export type UserDeviceTokenSelectType = typeof userDeviceTokens.$inferSelect;
export type UserDeviceTokenInsertType = typeof userDeviceTokens.$inferInsert;

export type RegisterDeviceTokenInput = Pick<UserDeviceTokenInsertType, "token" | "platform"> & {
  deviceName?: string | null;
};
