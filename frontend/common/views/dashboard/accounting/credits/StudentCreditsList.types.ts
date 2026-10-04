import type { StudentsDirectoryQuery } from "@/frontend/common/graphql/generated/gql/graphql";

export type StudentCreditsRow = StudentsDirectoryQuery["studentsDirectory"][number];
