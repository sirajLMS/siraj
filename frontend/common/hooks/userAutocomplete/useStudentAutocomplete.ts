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

export function useStudentAutocomplete(args?: {
  readonly value?: PersonOption | null;
  readonly scope?: UserSelectScope | null;
  readonly skip?: boolean;
}): UseAudienceAutocompleteResult {
  const scope = args?.scope ?? null;
  const mode = resolveStudentMode(scope);

  const document: DocumentNode = useMemo(() => {
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
  }, [mode]);

  const buildVariables = useCallback(
    (debouncedSearch: string) => {
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
    },
    [mode, scope?.parentId, scope?.primaryTeacherId]
  );

  const extractRows = useCallback(
    (data: unknown) => {
      switch (mode) {
        case "associated": {
          const typed = data as {
            parentAssociatedStudents?: readonly {
              id?: string | null;
              name?: string | null;
              avatarUrl?: string | null;
            }[];
          } | null;
          return typed?.parentAssociatedStudents ?? [];
        }
        case "viewerAssigned": {
          const typed = data as {
            parentAssignedStudents?: {
              rows?: readonly {
                id?: string | null;
                name?: string | null;
                studentAvatarUrl?: string | null;
              }[];
            } | null;
          } | null;
          const rows = typed?.parentAssignedStudents?.rows ?? [];
          return rows.map(row => ({
            id: row.id,
            name: row.name,
            avatarUrl: row.studentAvatarUrl ?? null,
          }));
        }
        case "teacherFiltered": {
          const typed = data as {
            students?: {
              data?:
                | readonly {
                    id?: string | null;
                    name?: string | null;
                    avatarUrl?: string | null;
                  }[]
                | null;
            } | null;
          } | null;
          return typed?.students?.data ?? [];
        }
        default: {
          const typed = data as {
            studentsDirectory?: readonly {
              id?: string | null;
              name?: string | null;
              avatarUrl?: string | null;
            }[];
          } | null;
          return typed?.studentsDirectory ?? [];
        }
      }
    },
    [mode]
  );

  const skipAssociated = mode === "associated" && !scope?.parentId;
  const skipTeacher = mode === "teacherFiltered" && !scope?.primaryTeacherId;

  return useAudienceAutocomplete({
    audience: "student",
    document,
    buildVariables,
    extractRows,
    value: args?.value,
    scope,
    skip: Boolean(args?.skip || skipAssociated || skipTeacher),
  });
}
