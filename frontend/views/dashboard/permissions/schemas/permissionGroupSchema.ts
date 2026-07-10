import { z } from "zod";
import {
  localizedStringOptionalSchema,
  localizedStringRequiredSchema,
} from "@/frontend/lib/localized-string.validation";

export const permissionGroupSchema = z.object({
  name: localizedStringRequiredSchema(["ar"]),
  description: localizedStringOptionalSchema(),
  permissionIds: z.array(z.string()),
});

export type PermissionGroupFormData = z.infer<typeof permissionGroupSchema>;
