import { z } from "zod";

export const permissionGroupSchema = z.object({
  name: z
    .string()
    .min(1, "nameRequired")
    .max(255, "nameTooLong"),
  description: z
    .string()
    .max(1000, "descriptionTooLong")
    .optional()
    .or(z.literal("")),
  permissionIds: z.array(z.string()),
});

export type PermissionGroupFormData = z.infer<typeof permissionGroupSchema>;
