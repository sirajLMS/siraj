import { z } from "zod";
import type { ManagerAccountType, ManagerOnboardingFormData } from "../types";

export type { ManagerAccountType, ManagerOnboardingFormData };

const departmentValues = ["academic", "operations", "human_resources", "it_support"] as const;
const accountTypeValues = ["manager", "admin"] as const;

export const managerOnboardingSchema = z.object({
  fullName: z.string().min(1, "fullNameRequired"),
  email: z.email({ message: "emailInvalid" }),
  phone: z.string().optional(),
  skypeId: z.string().optional(),
  accountType: z.enum(accountTypeValues),
  department: z
    .string()
    .min(1, "departmentRequired")
    .refine(val => (departmentValues as readonly string[]).includes(val), {
      message: "departmentRequired",
    }),
});

export type ManagerDepartment = (typeof departmentValues)[number];
