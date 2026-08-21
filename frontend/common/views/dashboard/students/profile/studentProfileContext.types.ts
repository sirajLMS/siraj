import type { StudentProfileQuery } from "@/frontend/common/graphql/generated/gql/graphql";

export type StudentProfileQueryData = NonNullable<StudentProfileQuery["studentProfile"]>;

export type StudentProfileClassHistorySession = NonNullable<
  NonNullable<StudentProfileQueryData["classHistory"]>["sessions"]
>[number];

export type StudentProfileContextValue = {
  readonly studentId: string;
  readonly profile: StudentProfileQueryData | null | undefined;
  readonly loading: boolean;
  readonly refetch: (variables?: { readonly year?: number | null; readonly month?: number | null }) => Promise<unknown>;
};
