import { z } from "zod";

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

export type ManagerOnboardingFormData = z.infer<typeof managerOnboardingSchema>;
export type ManagerAccountType = (typeof accountTypeValues)[number];
export type ManagerDepartment = (typeof departmentValues)[number];
