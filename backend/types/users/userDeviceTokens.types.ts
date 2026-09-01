import type { userDeviceTokens } from "@/backend/db/schema";

export type UserDeviceTokenSelectType = typeof userDeviceTokens.$inferSelect;
type UserDeviceTokenInsertType = typeof userDeviceTokens.$inferInsert;

// UserDeviceTokenReturnType removed — was unused. Re-create from UserDeviceTokenSelectType if needed (Omit "token").

export type RegisterDeviceTokenInput = Pick<UserDeviceTokenInsertType, "token" | "platform"> & {
  deviceName?: string | null;
};
