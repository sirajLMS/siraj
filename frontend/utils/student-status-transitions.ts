import { ALLOWED_STATUS_TRANSITIONS, StudentStatus } from "@/shared/lib/enum";

const STATUS_KEY_MAP: Record<string, StudentStatus> = {
  ON_TRIAL: StudentStatus.ON_TRIAL,
  REGULAR: StudentStatus.REGULAR,
  SUSPENDED: StudentStatus.SUSPENDED,
  ON_LEAVE: StudentStatus.ON_LEAVE,
  DEACTIVATED: StudentStatus.DEACTIVATED,
};

function mapTransitions(): Record<string, StudentStatus[]> {
  const result: Record<string, StudentStatus[]> = {};
  for (const [key, targets] of Object.entries(ALLOWED_STATUS_TRANSITIONS)) {
    const mappedKey = STATUS_KEY_MAP[key];
    if (mappedKey) {
      result[mappedKey] = targets.map(t => STATUS_KEY_MAP[t]).filter((t): t is StudentStatus => t !== undefined);
    }
  }
  return result;
}

export const ALLOWED_TARGET_STATUSES: Record<string, StudentStatus[]> = mapTransitions();
