import type { AdminViewLabels } from "@/shared/messages/types/message";

type DisabledTooltips = AdminViewLabels["adminActions"]["disabledTooltips"];

export function getForceActivateDisabledTooltip(
  executionState: string,
  tooltips: DisabledTooltips["forceActivate"]
): string | null {
  switch (executionState) {
    case "ACTIVATED":
      return tooltips.activated;
    case "RUNNING":
      return tooltips.running;
    case "COMPLETED":
      return tooltips.completed;
    default:
      return null;
  }
}

export function getStopDisabledTooltip(
  executionState: string,
  tooltips: DisabledTooltips["stop"]
): string | null {
  switch (executionState) {
    case "NOT_ACTIVATED":
      return tooltips.notActivated;
    case "ACTIVATED":
      return tooltips.activated;
    case "COMPLETED":
      return tooltips.completed;
    default:
      return null;
  }
}
