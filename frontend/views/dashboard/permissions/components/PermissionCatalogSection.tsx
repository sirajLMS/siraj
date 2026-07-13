"use client";

import type { Permission, PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useViewport } from "@/frontend/common/hooks/useViewport";
import { PermissionCatalogSectionMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionCatalogSection.mobile";
import { PermissionCatalogSectionDesktop } from "@/frontend/views/dashboard/permissions/components/permissionCatalogSection.desktop";

export interface PermissionCatalogSectionProps {
  readonly permissions: readonly Permission[];
  readonly groups: readonly PermissionGroup[];
  readonly loading?: boolean;
}

export function PermissionCatalogSection({
  permissions,
  groups,
  loading = false,
}: Readonly<PermissionCatalogSectionProps>) {
  const { isMobile } = useViewport();

  if (isMobile) {
    return <PermissionCatalogSectionMobile permissions={permissions} groups={groups} loading={loading} />;
  }

  return <PermissionCatalogSectionDesktop permissions={permissions} groups={groups} loading={loading} />;
}
