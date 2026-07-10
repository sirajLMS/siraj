"use client";

import { createContext, useContext } from "react";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export type StudentProfileQueryData = NonNullable<Operations.StudentProfileQuery["studentProfile"]>;

export type StudentProfileClassHistorySession = NonNullable<
  NonNullable<StudentProfileQueryData["classHistory"]>["sessions"]
>[number];

type StudentProfileContextValue = {
  readonly studentId: string;
  readonly profile: StudentProfileQueryData | null | undefined;
  readonly loading: boolean;
  readonly refetch: (variables?: { readonly year?: number | null; readonly month?: number | null }) => Promise<unknown>;
};

const StudentProfileContext = createContext<StudentProfileContextValue | null>(null);

export function StudentProfileProvider({
  value,
  children,
}: {
  readonly value: StudentProfileContextValue;
  readonly children: React.ReactNode;
}) {
  return <StudentProfileContext.Provider value={value}>{children}</StudentProfileContext.Provider>;
}

export function useStudentProfileContext(): StudentProfileContextValue | null {
  return useContext(StudentProfileContext);
}
