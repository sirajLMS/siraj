import type { StudentQuotaFormData } from "@/frontend/views/dashboard/students/quota/schemas/studentQuotaSchema";

export interface StudentProfileData extends StudentQuotaFormData {
  readonly id: string;
  readonly profileImage: string;
  readonly lastEditedBy: string;
  readonly lastEditedTime: string;
}
