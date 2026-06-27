import { z } from "zod";
import { ManagerAccountType } from "../types";

export type { ManagerOnboardingFormData } from "../types";

export const managerOnboardingSchema = z.object({
  name: z.string().min(1, "fullNameRequired"),
  email: z.email({ message: "emailInvalid" }),
  phone: z.string().optional(),
  skypeId: z.string().optional(),
  accountType: z.custom<ManagerAccountType>(
    val => typeof val === "string" && Object.values(ManagerAccountType).includes(val as ManagerAccountType)
  ),
  password: z.string().min(8, "passwordMinLength"),
});
