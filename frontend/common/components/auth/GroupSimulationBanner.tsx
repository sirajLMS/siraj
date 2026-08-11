"use client";

import { SimulationBannerShared } from "@/frontend/common/components/auth/__shared__/simulationBannerShared";
import { usePermissionGroupSimulation } from "@/frontend/common/hooks/usePermissionGroupSimulation";

import { Translation, useAppTranslation } from "@/shared/locale";

export function GroupSimulationBanner() {
  const t = useAppTranslation(Translation.Auth.GroupSimulation);

  const { isSimulatingGroup, status, endSimulation, loading } = usePermissionGroupSimulation();

  return (
    <SimulationBannerShared
      active={isSimulatingGroup && Boolean(status?.groupName)}
      message={status?.groupName ? t.bannerSimulatingAs(status.groupName) : null}
      endLabel={t.returnToNormalRole}
      onEnd={endSimulation}
      loading={loading}
      bannerSx={theme => ({
        backgroundColor: theme.palette.secondaryContainer,
        color: theme.palette.onSecondaryContainer,
      })}
      linkSx={theme => ({ color: theme.palette.onSecondaryContainer })}
    />
  );
}
