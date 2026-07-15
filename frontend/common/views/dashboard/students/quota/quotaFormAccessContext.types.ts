export interface QuotaFormAccessContextValue {
  readonly readOnly: boolean;
  readonly canEditIdentity: boolean;
  readonly canEditQuota: boolean;
  readonly canViewQuota: boolean;
  readonly canViewTeacher: boolean;
}
