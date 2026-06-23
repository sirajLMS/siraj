import type { staffProfiles } from "@/backend/db/schema";

export type StaffProfileEntity = typeof staffProfiles.$inferSelect;
export type StaffProfileEntityInput = typeof staffProfiles.$inferInsert;

export type StaffProfileCreateResult = Pick<
  StaffProfileEntity,
  "id" | "userId" | "status" | "phone" | "skypeId" | "createdAt"
>;
