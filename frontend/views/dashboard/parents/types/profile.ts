import type { ParentAccountStatus } from "@/frontend/stores/parentsStore";

export interface ParentStudent {
  readonly id: string;
  readonly name: string;
  readonly avatarUrl?: string;
  readonly teacher: string;
  readonly hoursPerWeek: number;
  readonly classesLeft: number;
  readonly totalClasses: number;
  readonly language: string;
  readonly gender: "male" | "female";
  readonly status: "regular" | "on_trial" | "on_leave";
}

export interface ParentProfileData {
  readonly id: string;
  readonly name: string;
  readonly avatarUrl?: string;
  readonly status: ParentAccountStatus;
  readonly nationality: string;
  readonly email: string;
  readonly phone: string;
  readonly address: string;
  readonly facebook?: string;
  readonly whatsapp?: string;
  readonly skype?: string;
  readonly zoomLink?: string;
  readonly invoiceType: string;
  readonly feeAmount: number;
  readonly paymentMethod: string;
  readonly currency: string;
  readonly students: readonly ParentStudent[];
}
