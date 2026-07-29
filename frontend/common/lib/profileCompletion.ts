/** Paths reachable while a teacher must complete required profile fields. */
export const TEACHER_PROFILE_COMPLETION_ALLOWED_PATHS = new Set(["/profile", "/profile/edit"]);

export const TEACHER_PROFILE_EDIT_PATH = "/profile/edit";

export const FORCE_COMPLETE_SEARCH_PARAM = "forceComplete";
export const FORCE_COMPLETE_SEARCH_VALUE = "1";

export const TEACHER_PROFILE_COMPLETION_EDIT_HREF = buildTeacherProfileEditHref(true);

export function isTeacherProfileCompletionPath(pathname: string): boolean {
  return TEACHER_PROFILE_COMPLETION_ALLOWED_PATHS.has(pathname);
}

export function isTeacherNationalIdComplete(nationalId: string | null | undefined): boolean {
  return Boolean(nationalId?.trim());
}

type ForceCompleteSearchParams = URLSearchParams | Readonly<Record<string, string | string[] | undefined>>;

export function hasForceCompleteSearchParam(searchParams: ForceCompleteSearchParams): boolean {
  if (searchParams instanceof URLSearchParams) {
    return searchParams.get(FORCE_COMPLETE_SEARCH_PARAM) === FORCE_COMPLETE_SEARCH_VALUE;
  }

  const value = searchParams[FORCE_COMPLETE_SEARCH_PARAM];
  if (Array.isArray(value)) {
    return value[0] === FORCE_COMPLETE_SEARCH_VALUE;
  }

  return value === FORCE_COMPLETE_SEARCH_VALUE;
}

export function buildTeacherProfileEditHref(
  forceComplete?: boolean,
  baseSearchParams?: URLSearchParams | string
): string {
  const params = new URLSearchParams(
    typeof baseSearchParams === "string" ? baseSearchParams : baseSearchParams?.toString()
  );

  if (forceComplete) {
    params.set(FORCE_COMPLETE_SEARCH_PARAM, FORCE_COMPLETE_SEARCH_VALUE);
  } else {
    params.delete(FORCE_COMPLETE_SEARCH_PARAM);
  }

  const query = params.toString();
  return query ? `${TEACHER_PROFILE_EDIT_PATH}?${query}` : TEACHER_PROFILE_EDIT_PATH;
}
