// NEW FOR PLAN v5 (newly created for the migration wave)
import type { Permission } from "@/frontend/common/graphql/generated/gql/graphql-types";

export type ValidPermission = Permission & { id: string; key: string; category: string };
