import { z } from "zod";
import { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { CreateUserLabels } from "@/shared/locale/types/dashboard/users/createUser";

export type GeneralUserCreateValidationLabels = Pick<
  CreateUserLabels,
  "nameRequired" | "emailRequired" | "emailInvalid" | "passwordRequired" | "permissionGroupRequired"
>;

export const generalUserCreateSchemaFactory = (validationLabels: GeneralUserCreateValidationLabels) =>
  z.object({
    name: z.string().min(2, validationLabels.nameRequired),
    email: z
      .string()
      .min(1, validationLabels.emailRequired)
      .pipe(z.email({ message: validationLabels.emailInvalid })),
    password: z.string().min(8, validationLabels.passwordRequired),
    phone: z.string().optional(),
    groupSlug: z.string().min(1, validationLabels.permissionGroupRequired),
    status: z.enum(AccountStatus),
  });

export type GeneralUserCreateFormData = z.infer<ReturnType<typeof generalUserCreateSchemaFactory>>;
