"use client";

import { useViewport } from "@/frontend/common/hooks/useViewport";
import { UpdatedSessionsSectionDesktop } from "@/frontend/desktop/views/dashboard/tools/dst-migration/components/updatedSessionsSection.desktop";
import { UpdatedSessionsSectionMobile } from "@/frontend/mobile/views/dashboard/tools/dst-migration/components/updatedSessionsSection.mobile";
import type { UpdatedSession } from "@/frontend/views/dashboard/tools/dst-migration/dst-migration.types";

export interface UpdatedSessionsSectionProps {
  readonly sessions: readonly UpdatedSession[];
  readonly successfulCount: number;
  readonly loading?: boolean;
}

export function UpdatedSessionsSection({ sessions, successfulCount, loading }: Readonly<UpdatedSessionsSectionProps>) {
  const { isMobile } = useViewport();

  if (isMobile) {
    return <UpdatedSessionsSectionMobile sessions={sessions} successfulCount={successfulCount} loading={loading} />;
  }

  return <UpdatedSessionsSectionDesktop sessions={sessions} successfulCount={successfulCount} loading={loading} />;
}
