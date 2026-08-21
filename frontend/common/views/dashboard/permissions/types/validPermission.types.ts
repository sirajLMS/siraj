// NEW FOR PLAN v5 (newly created for the migration wave)
import type { PermissionsQuery_permissions } from "@/frontend/common/graphql/generated/gql/graphql";

export type ValidPermission = PermissionsQuery_permissions & { id: string; key: string; category: string };
