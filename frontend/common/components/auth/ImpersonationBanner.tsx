"use client";

import { SimulationBannerShared } from "@/frontend/common/components/auth/__shared__/simulationBannerShared";
import { useImpersonation } from "@/frontend/common/hooks/useImpersonation";

import { Translation, useAppTranslation } from "@/shared/locale";

export function ImpersonationBanner() {
  const t = useAppTranslation(Translation.Auth.Impersonation);

  const { isImpersonating, status, endImpersonation, loading } = useImpersonation();

  const targetName = status?.targetUser?.name ?? status?.targetUser?.email ?? "";

  return (
    <SimulationBannerShared
      active={isImpersonating && Boolean(status?.targetUser)}
      message={t.bannerLoggedInAs(targetName)}
      endLabel={t.returnToNormalLogin}
      onEnd={endImpersonation}
      loading={loading}
      bannerSx={theme => ({
        backgroundColor: theme.palette.warningContainer ?? theme.palette.warning.main,
        color: theme.palette.onWarningContainer ?? theme.palette.onWarning,
      })}
      linkSx={theme => ({ color: theme.palette.onWarningContainer ?? theme.palette.onWarning })}
    />
  );
}
