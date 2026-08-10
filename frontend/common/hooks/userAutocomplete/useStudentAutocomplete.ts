"use client";

import type { DocumentNode } from "graphql";
import { useCallback, useMemo } from "react";
import type { PersonOption, UserSelectScope } from "@/frontend/common/components/ui/input/userSelect/types";
import { USER_SELECT_LIMIT } from "@/frontend/common/components/ui/input/userSelect/userSelect.constants";
import {
  parentAssignedStudentsQueryDocument,
  parentAssociatedStudentsQueryDocument,
  studentsDirectoryQueryDocument,
  studentsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import {
  type UseAudienceAutocompleteResult,
  useAudienceAutocomplete,
} from "@/frontend/common/hooks/userAutocomplete/useAudienceAutocomplete";

type StudentQueryMode = "directory" | "associated" | "viewerAssigned" | "teacherFiltered";

type StudentRow = {
  readonly id?: string | null;
  readonly name?: string | null;
  readonly avatarUrl?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isUnknownArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

function readOptionalString(value: unknown): string | null | undefined {
  if (typeof value === "string" || value === null) {
    return value;
  }
  return undefined;
}

function readStudentRow(item: unknown, avatarKey: string): StudentRow | null {
  if (!isRecord(item)) {
    return null;
  }
  return {
    id: readOptionalString(item.id),
    name: readOptionalString(item.name),
    avatarUrl: readOptionalString(item[avatarKey]),
  };
}

function readStudentRows(value: unknown, avatarKey: string): readonly StudentRow[] {
  if (!isUnknownArray(value)) {
    return [];
  }
  return value.flatMap(item => {
    const row = readStudentRow(item, avatarKey);
    return row ? [row] : [];
  });
}

function resolveStudentMode(scope?: UserSelectScope | null): StudentQueryMode {
  if (scope?.parentId) {
    return "associated";
  }
  if (scope?.viewerAssigned) {
    return "viewerAssigned";
  }
  if (scope?.primaryTeacherId) {
    return "teacherFiltered";
  }
  return "directory";
}

function resolveStudentDocument(mode: StudentQueryMode): DocumentNode {
  switch (mode) {
    case "associated":
      return parentAssociatedStudentsQueryDocument;
    case "viewerAssigned":
      return parentAssignedStudentsQueryDocument;
    case "teacherFiltered":
      return studentsQueryDocument;
    default:
      return studentsDirectoryQueryDocument;
  }
}

function buildAssociatedStudentRows(data: unknown): readonly StudentRow[] {
  if (!isRecord(data)) {
    return [];
  }
  return readStudentRows(data.parentAssociatedStudents, "avatarUrl");
}

function buildViewerAssignedStudentRows(data: unknown): readonly StudentRow[] {
  if (!isRecord(data)) {
    return [];
  }
  const parentAssignedStudents = data.parentAssignedStudents;
  if (!isRecord(parentAssignedStudents)) {
    return [];
  }
  return readStudentRows(parentAssignedStudents.rows, "studentAvatarUrl");
}

function buildTeacherFilteredStudentRows(data: unknown): readonly StudentRow[] {
  if (!isRecord(data)) {
    return [];
  }
  const students = data.students;
  if (!isRecord(students)) {
    return [];
  }
  return readStudentRows(students.data, "avatarUrl");
}

function buildDirectoryStudentRows(data: unknown): readonly StudentRow[] {
  if (!isRecord(data)) {
    return [];
  }
  return readStudentRows(data.studentsDirectory, "avatarUrl");
}

function resolveStudentVariables(
  mode: StudentQueryMode,
  debouncedSearch: string,
  scope: UserSelectScope | null
): Record<string, unknown> {
  switch (mode) {
    case "associated":
      return { parentId: scope?.parentId ?? "" };
    case "viewerAssigned":
      return {};
    case "teacherFiltered":
      return {
        paginationArgs: { first: USER_SELECT_LIMIT, page: 1 },
        filterArgs: scope?.primaryTeacherId ? { primaryTeacherId: scope.primaryTeacherId } : null,
        orderBy: null,
      };
    default:
      return {
        search: debouncedSearch || null,
        limit: USER_SELECT_LIMIT,
      };
  }
}

function resolveStudentRows(
  mode: StudentQueryMode,
  data: unknown
): readonly StudentRow[] {
  switch (mode) {
    case "associated":
      return buildAssociatedStudentRows(data);
    case "viewerAssigned":
      return buildViewerAssignedStudentRows(data);
    case "teacherFiltered":
      return buildTeacherFilteredStudentRows(data);
    default:
      return buildDirectoryStudentRows(data);
  }
}

function shouldSkipStudentQuery(mode: StudentQueryMode, scope: UserSelectScope | null): boolean {
  if (mode === "associated" && !scope?.parentId) {
    return true;
  }
  if (mode === "teacherFiltered" && !scope?.primaryTeacherId) {
    return true;
  }
  return false;
}

export function useStudentAutocomplete(args?: {
  readonly value?: PersonOption | null;
  readonly scope?: UserSelectScope | null;
  readonly skip?: boolean;
}): UseAudienceAutocompleteResult {
  const scope = args?.scope ?? null;
  const mode = resolveStudentMode(scope);

  const document = useMemo(() => resolveStudentDocument(mode), [mode]);

  const buildVariables = useCallback(
    (debouncedSearch: string) => resolveStudentVariables(mode, debouncedSearch, scope),
    [mode, scope]
  );

  const extractRows = useCallback((data: unknown) => resolveStudentRows(mode, data), [mode]);

  const skip = args?.skip || shouldSkipStudentQuery(mode, scope);

  return useAudienceAutocomplete({
    audience: "student",
    document,
    buildVariables,
    extractRows,
    value: args?.value,
    scope,
    skip,
  });
}
