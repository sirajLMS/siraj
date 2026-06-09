import type { teacherBankingDetails, teachers } from "@/backend/db/schema";

export type TeacherEntity = typeof teachers.$inferSelect;
export type TeacherEntityInput = typeof teachers.$inferInsert;

export type TeacherBankingDetailsSelectType = typeof teacherBankingDetails.$inferSelect;
export type TeacherBankingDetailsInsertInput = typeof teacherBankingDetails.$inferInsert;
