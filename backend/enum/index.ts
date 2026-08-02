// ⚠️ Backend-only enum barrel file.
// Frontend code MUST use GraphQL codegen enums from
// `@/frontend/common/graphql/generated/gql/graphql-types` instead.
// Prefer deep imports (e.g. `import { StudentStatus } from "@/backend/enum/students/student-lifecycle.enum"`)
// rather than importing from this index file.

export * from "./auth/auth.enum";
export * from "./billing";
export * from "./books/book.enum";
export * from "./classes";
export * from "./complaints";
export * from "./fx";
export * from "./meeting";
export * from "./notifications";
export * from "./parents";
export * from "./permissions";
export * from "./pricing";
export * from "./profiles";
export * from "./scheduling";
export * from "./shared";
export * from "./students";
export * from "./teachers";
export * from "./users";
