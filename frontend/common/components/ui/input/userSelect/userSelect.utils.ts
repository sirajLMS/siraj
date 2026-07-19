import type {
  PersonOption,
  UserSelectAudience,
  UserSelectScope,
} from "@/frontend/common/components/ui/input/userSelect/types";

export function buildUserSelectCacheKey(
  audience: UserSelectAudience,
  search: string,
  scope?: UserSelectScope | null
): string {
  const normalizedSearch = search.trim().toLowerCase();
  const scopeParts = [
    scope?.parentId ? `parent:${scope.parentId}` : null,
    scope?.primaryTeacherId ? `teacher:${scope.primaryTeacherId}` : null,
    scope?.permissionGroupFilter ? `pg:${scope.permissionGroupFilter}` : null,
  ].filter(Boolean);
  const scopeKey = scopeParts.length > 0 ? scopeParts.join("|") : "global";
  return `${audience}::${scopeKey}::${normalizedSearch}`;
}

export function mergeSelectedIntoOptions(
  options: readonly PersonOption[],
  selected: PersonOption | null | undefined
): readonly PersonOption[] {
  if (!selected?.id) {
    return options;
  }
  if (options.some(option => option.id === selected.id)) {
    return options;
  }
  return [selected, ...options];
}

export function resolvePersonOption(
  id: string | null | undefined,
  options: readonly PersonOption[],
  fallback?: PersonOption | null
): PersonOption | null {
  if (!id) {
    return null;
  }
  const fromOptions = options.find(option => option.id === id);
  if (fromOptions) {
    return fromOptions;
  }
  if (fallback?.id === id) {
    return fallback;
  }
  return null;
}

export function mapRowsToPersonOptions(
  rows: readonly {
    readonly id?: string | null;
    readonly name?: string | null;
    readonly avatarUrl?: string | null;
    readonly email?: string | null;
  }[]
): PersonOption[] {
  const options: PersonOption[] = [];
  for (const row of rows) {
    if (!row.id) {
      continue;
    }
    options.push({
      id: row.id,
      name: row.name ?? "",
      avatarUrl: row.avatarUrl ?? null,
      email: row.email ?? null,
    });
  }
  return options;
}
