export { AudienceAutocomplete } from "@/frontend/common/components/ui/input/userSelect/AudienceAutocomplete";
export { ParentAutocomplete } from "@/frontend/common/components/ui/input/userSelect/ParentAutocomplete";
export { StaffAutocomplete } from "@/frontend/common/components/ui/input/userSelect/StaffAutocomplete";
export { StudentAutocomplete } from "@/frontend/common/components/ui/input/userSelect/StudentAutocomplete";
export { TeacherAutocomplete } from "@/frontend/common/components/ui/input/userSelect/TeacherAutocomplete";
export type {
  AudienceAutocompleteProps,
  AudienceAutocompleteSlotProps,
  AudienceFacadeProps,
  ParentAutocompleteProps,
  PersonOption,
  StaffAutocompleteProps,
  StudentAutocompleteProps,
  TeacherAutocompleteProps,
  UserAutocompleteProps,
  UserSelectAudience,
  UserSelectScope,
} from "@/frontend/common/components/ui/input/userSelect/types";
export { UserAutocomplete } from "@/frontend/common/components/ui/input/userSelect/UserAutocomplete";
export { UserSelectOptionRow } from "@/frontend/common/components/ui/input/userSelect/UserSelectOptionRow";
export {
  USER_SELECT_CACHE_MAX_KEYS_PER_AUDIENCE,
  USER_SELECT_DEBOUNCE_MS,
  USER_SELECT_LIMIT,
} from "@/frontend/common/components/ui/input/userSelect/userSelect.constants";
export {
  buildUserSelectCacheKey,
  mapRowsToPersonOptions,
  mergeSelectedIntoOptions,
  resolvePersonOption,
} from "@/frontend/common/components/ui/input/userSelect/userSelect.utils";
