import type { CarryoverBalanceQuery_carryoverBalance } from "@/frontend/common/graphql/generated/gql/graphql";

/** Editable snapshot of an existing carryover; `null` on the dialog props means add mode. */
export type CarryoverFormRow = Pick<
  CarryoverBalanceQuery_carryoverBalance,
  | "id"
  | "teacherId"
  | "teacherName"
  | "teacherAvatarUrl"
  | "fromDate"
  | "toDate"
  | "payable"
  | "teacherCurrency"
  | "studentsCount"
  | "studentsText"
  | "note"
>;
