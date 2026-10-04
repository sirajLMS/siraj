import type { useImpersonation } from "@/frontend/common/hooks/useImpersonation";
import type { SimulationStatus } from "@/frontend/common/views/dashboard/components/navbar/UserMenuButton.types";
import type { AuthImpersonationLabels } from "@/shared/locale";

export interface UserMenuState {
  readonly isImpersonating: boolean;
  readonly isSimulatingGroup: boolean;
  readonly impersonationStatus: ReturnType<typeof useImpersonation>["status"];
  readonly simulationStatus: SimulationStatus;
}

export function computeSecondaryLine(
  state: Readonly<UserMenuState>,
  tImpersonation: AuthImpersonationLabels
): string | undefined {
  const { isImpersonating, isSimulatingGroup, impersonationStatus, simulationStatus } = state;
  if (isImpersonating) {
    const actorName = impersonationStatus?.actorUser?.name;
    return actorName ? tImpersonation.actorIdentity(actorName) : undefined;
  }
  if (isSimulatingGroup && simulationStatus?.groupName) {
    return simulationStatus.groupName;
  }
  return undefined;
}
