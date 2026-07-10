import type { CurrencyCode, Gender, StudentStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import type { ParentLifecycleStatus } from "@/frontend/views/dashboard/types/parent.types";

export type ParentStudentStatus = `${Lowercase<StudentStatus>}`;

export interface ParentStudent {
  readonly id: string;
  readonly name: string;
  readonly avatarUrl?: string;
  readonly teacher: string;
  readonly teacherId?: string | null;
  readonly teacherUserId?: string | null;
  readonly hoursPerWeek: number;
  readonly classesLeft: number;
  readonly totalClasses: number;
  readonly language: string;
  readonly gender: Gender;
  readonly status: ParentStudentStatus;
}

export interface ParentProfileData {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly avatarUrl?: string;
  readonly lifecycleStatus: ParentLifecycleStatus;
  readonly nationality: string;
  readonly email: string;
  readonly phone: string;
  readonly address: string;
  readonly facebook?: string;
  readonly whatsapp?: string;
  readonly invoiceType: string;
  readonly feeAmount: number;
  readonly currency: CurrencyCode;
  readonly students: readonly ParentStudent[];
}
