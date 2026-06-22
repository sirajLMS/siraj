export type {
  LearningResourceRow as GqlLearningResourceRow,
  ResourceUploadInput,
} from "@/frontend/graphql/generated/gql/graphql-types";

/**
 * Learning Resources — Shared Types
 *
 * GraphQL-generated types (from codegen) are used for data shapes.
 * This file contains UI-specific types for file type classification, filtering, and sorting.
 */

/**
 * Supported resource file types for display and filtering.
 * Derived from the file extension in `filePath`, not from GraphQL.
 */
export type ResourceFileType = "pdf" | "pptx" | "xlsx" | "docx";

/**
 * Sort order for the resource library list.
 */
export type ResourceSortBy = "date" | "name";

/**
 * Filter type for the resource library — "all" or a specific file type.
 */
export type ResourceFilterType = ResourceFileType | "all";

/**
 * Upload form data shape — used by the upload dialog component.
 * This is the form-level type before it's converted to `ResourceUploadInput` for the mutation.
 */
export interface ResourceUploadFormData {
  readonly documentName: string;
  readonly fileName: string;
}

/**
 * View-specific learning resource row.
 * Maps the GraphQL LearningResourceRow fields to what the UI views expect.
 */
export interface LearningResourceRow {
  readonly id: string;
  readonly title: string;
  readonly fileName: string;
  readonly fileType: ResourceFileType;
  readonly uploadedAt: string;
  readonly uploadedAtTimestamp: number;
}
