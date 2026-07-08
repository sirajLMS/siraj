export enum StudentStatus {
  REGULAR = "REGULAR",
  ON_LEAVE = "ON_LEAVE",
  SUSPENDED = "SUSPENDED",
  ON_TRIAL = "ON_TRIAL",
  DEACTIVATED = "DEACTIVATED",
}

export const ALLOWED_STATUS_TRANSITIONS: Record<StudentStatus, readonly StudentStatus[]> = {
  [StudentStatus.ON_TRIAL]: [StudentStatus.REGULAR, StudentStatus.DEACTIVATED],
  [StudentStatus.REGULAR]: [StudentStatus.SUSPENDED, StudentStatus.ON_LEAVE, StudentStatus.DEACTIVATED],
  [StudentStatus.SUSPENDED]: [StudentStatus.REGULAR, StudentStatus.DEACTIVATED],
  [StudentStatus.ON_LEAVE]: [StudentStatus.REGULAR, StudentStatus.DEACTIVATED],
  [StudentStatus.DEACTIVATED]: [StudentStatus.REGULAR],
};
