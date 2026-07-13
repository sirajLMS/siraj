import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

const CLASS_CATEGORY_FIELDS = gql`
  fragment ClassCategoryFields on ClassCategory {
    id
    name
    slug
    description
    isActive
    sortOrder
  }
`;

export const classCategoriesQueryDocument: TypedDocumentNode<Operations.ClassCategoriesQuery> = gql`
  ${CLASS_CATEGORY_FIELDS}
  query classCategories {
    classCategories {
      ...ClassCategoryFields
    }
  }
`;

export const createClassCategoryMutationDocument: TypedDocumentNode<
  Operations.CreateClassCategoryMutation,
  Types.MutationCreateClassCategoryArgs
> = gql`
  ${CLASS_CATEGORY_FIELDS}
  mutation createClassCategory($input: ClassCategoryCreateInput!) {
    createClassCategory(input: $input) {
      ...ClassCategoryFields
    }
  }
`;

export const updateClassCategoryMutationDocument: TypedDocumentNode<
  Operations.UpdateClassCategoryMutation,
  Types.MutationUpdateClassCategoryArgs
> = gql`
  ${CLASS_CATEGORY_FIELDS}
  mutation updateClassCategory($id: ID!, $input: ClassCategoryUpdateInput!) {
    updateClassCategory(id: $id, input: $input) {
      ...ClassCategoryFields
    }
  }
`;

export const deleteClassCategoryMutationDocument: TypedDocumentNode<
  Operations.DeleteClassCategoryMutation,
  Types.MutationDeleteClassCategoryArgs
> = gql`
  mutation deleteClassCategory($id: ID!) {
    deleteClassCategory(id: $id)
  }
`;
