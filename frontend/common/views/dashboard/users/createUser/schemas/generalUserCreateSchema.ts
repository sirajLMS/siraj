import { z } from "zod";
import { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { CreateUserLabels } from "@/shared/locale/types/dashboard/users/createUser";
import { createPasswordFieldSchema } from "@/shared/utils/password-schema";

export type GeneralUserCreateValidationLabels = Pick<
  CreateUserLabels,
  | "nameRequired"
  | "emailRequired"
  | "emailInvalid"
  | "passwordRequired"
  | "passwordMinLength"
  | "passwordWeakComplexity"
  | "permissionGroupRequired"
>;

export const generalUserCreateSchemaFactory = (validationLabels: GeneralUserCreateValidationLabels) =>
  z.object({
    name: z.string().min(2, validationLabels.nameRequired),
    email: z
      .string()
      .min(1, validationLabels.emailRequired)
      .pipe(z.email({ message: validationLabels.emailInvalid })),
    password: createPasswordFieldSchema({
      required: validationLabels.passwordRequired,
      minLength: validationLabels.passwordMinLength,
      weakComplexity: validationLabels.passwordWeakComplexity,
    }),
    phone: z.string().optional(),
    groupSlug: z.string().min(1, validationLabels.permissionGroupRequired),
    status: z.enum(AccountStatus),
  });

export type GeneralUserCreateFormData = z.infer<ReturnType<typeof generalUserCreateSchemaFactory>>;
