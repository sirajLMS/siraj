import type { AutocompleteProps } from "@mui/material/Autocomplete";
import type { SxProps, Theme } from "@mui/material/styles";

/** Person-picker audience keys (permission-based; not RBAC roles). */
export type UserSelectAudience = "teacher" | "student" | "parent" | "user" | "staff";

export interface PersonOption {
  readonly id: string;
  readonly name: string;
  readonly avatarUrl?: string | null;
  readonly email?: string | null;
}

export interface UserSelectScope {
  readonly parentId?: string;
  readonly primaryTeacherId?: string;
  readonly permissionGroupFilter?: string;
  /** Logged-in parent's children (`parentAssignedStudents`). */
  readonly viewerAssigned?: boolean;
}

export type AudienceAutocompleteSlotProps = NonNullable<
  AutocompleteProps<PersonOption, false, false, false>["slotProps"]
>;

export interface AudienceAutocompleteProps {
  readonly value: PersonOption | null;
  readonly onChange: (next: PersonOption | null) => void;
  readonly options: readonly PersonOption[];
  readonly loading?: boolean;
  readonly inputValue: string;
  readonly onInputChange: (value: string) => void;
  readonly label?: string;
  readonly placeholder?: string;
  readonly noOptionsText?: string;
  readonly error?: boolean;
  readonly helperText?: string;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly size?: "small" | "medium";
  readonly sx?: SxProps<Theme>;
  readonly slotProps?: AudienceAutocompleteSlotProps;
  readonly fullWidth?: boolean;
  readonly excludeIds?: readonly string[];
}

interface AudienceFacadeProps {
  readonly value: PersonOption | null;
  readonly onChange: (next: PersonOption | null) => void;
  readonly label?: string;
  readonly placeholder?: string;
  readonly error?: boolean;
  readonly helperText?: string;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly size?: "small" | "medium";
  readonly sx?: SxProps<Theme>;
  readonly slotProps?: AudienceAutocompleteSlotProps;
  readonly fullWidth?: boolean;
  readonly scope?: UserSelectScope;
  readonly skip?: boolean;
  readonly excludeIds?: readonly string[];
}

export type TeacherAutocompleteProps = Omit<AudienceFacadeProps, "scope">;
export type StudentAutocompleteProps = AudienceFacadeProps;
export type ParentAutocompleteProps = Omit<AudienceFacadeProps, "scope">;
export type UserAutocompleteProps = Omit<AudienceFacadeProps, "scope">;
