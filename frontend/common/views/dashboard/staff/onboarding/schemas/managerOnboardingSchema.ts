import { z } from "zod";
import { CurrencyCode, ManagerAccountType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { isValidIanaTimezoneId } from "@/frontend/common/lib/timezone";

export const managerOnboardingSchema = z.object({
  name: z.string().min(1, "fullNameRequired"),
  email: z.email({ message: "emailInvalid" }),
  avatarUrl: z.string().optional(),
  phone: z.string().optional(),
  timezone: z
    .string()
    .min(1, "timezoneRequired")
    .refine(value => isValidIanaTimezoneId(value), { message: "timezoneRequired" }),
  displayCurrency: z.enum(CurrencyCode).optional().nullable(),
  accountType: z.custom<ManagerAccountType>(
    val => typeof val === "string" && Object.values(ManagerAccountType).includes(val as ManagerAccountType)
  ),
  password: z.string().min(8, "passwordMinLength"),
});
