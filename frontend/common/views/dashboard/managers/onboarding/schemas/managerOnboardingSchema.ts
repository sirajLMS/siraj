import { z } from "zod";
import { ManagerAccountType } from "@/frontend/common/views/dashboard/managers/onboarding/types";

export type { ManagerOnboardingFormData } from "@/frontend/common/views/dashboard/managers/onboarding/types";

export const managerOnboardingSchema = z.object({
  name: z.string().min(1, "fullNameRequired"),
  email: z.email({ message: "emailInvalid" }),
  avatarUrl: z.string().optional(),
  phone: z.string().optional(),
  accountType: z.custom<ManagerAccountType>(
    val => typeof val === "string" && Object.values(ManagerAccountType).includes(val as ManagerAccountType)
  ),
  password: z.string().min(8, "passwordMinLength"),
});
