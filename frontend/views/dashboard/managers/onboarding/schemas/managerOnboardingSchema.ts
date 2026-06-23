import { z } from "zod";
import { ManagerAccountType, type ManagerOnboardingFormData } from "../types";

export type { ManagerOnboardingFormData };

const departmentValues = ["academic", "operations", "human_resources", "it_support"] as const;

export const managerOnboardingSchema = z.object({
  name: z.string().min(1, "fullNameRequired"),
  email: z.email({ message: "emailInvalid" }),
  phone: z.string().optional(),
  skypeId: z.string().optional(),
  accountType: z.custom<ManagerAccountType>(
    val => typeof val === "string" && Object.values(ManagerAccountType).includes(val as ManagerAccountType)
  ),
  department: z
    .string()
    .min(1, "departmentRequired")
    .refine(val => (departmentValues as readonly string[]).includes(val), {
      message: "departmentRequired",
    }),
});

export type ManagerDepartment = (typeof departmentValues)[number];
