export type StudentIdentityFieldVisibility = {
  readonly showDateOfBirth: boolean;
  readonly showGender: boolean;
  readonly showLanguage: boolean;
  readonly showTimezoneOverride: boolean;
};

export function getIdentityFieldVisibility(
  enforceFieldAccess: boolean,
  canViewField: (field: "student_identity") => boolean,
  timezoneOverrideLabel?: string
): StudentIdentityFieldVisibility {
  const canViewIdentityField = enforceFieldAccess ? canViewField("student_identity") : true;

  return {
    showDateOfBirth: canViewIdentityField,
    showGender: canViewIdentityField,
    showLanguage: canViewIdentityField,
    showTimezoneOverride: enforceFieldAccess ? canViewIdentityField : Boolean(timezoneOverrideLabel),
  };
}
