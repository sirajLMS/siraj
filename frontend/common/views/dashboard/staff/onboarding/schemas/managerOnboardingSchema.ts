import { z } from "zod";
import { CurrencyCode, ManagerAccountType } from "@/frontend/common/graphql/generated/gql/graphql";
import { isValidIanaTimezoneId } from "@/frontend/common/lib/timezone";

const MANAGER_ACCOUNT_TYPES = new Set<string>(Object.values(ManagerAccountType) as readonly string[]);

function isManagerAccountType(value: unknown): value is ManagerAccountType {
  return typeof value === "string" && MANAGER_ACCOUNT_TYPES.has(value);
}

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
  accountType: z.custom<ManagerAccountType>(val => isManagerAccountType(val)),
  password: z.string().min(8, "passwordMinLength"),
});
