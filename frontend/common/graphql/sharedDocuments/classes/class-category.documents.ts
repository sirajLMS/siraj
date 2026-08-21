import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  ClassCategoriesQuery,
  CreateClassCategoryMutation,
  CreateClassCategoryMutationVariables,
  DeleteClassCategoryMutation,
  DeleteClassCategoryMutationVariables,
  UpdateClassCategoryMutation,
  UpdateClassCategoryMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

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

export const classCategoriesQueryDocument: TypedDocumentNode<ClassCategoriesQuery> = gql`
  ${CLASS_CATEGORY_FIELDS}
  query classCategories {
    classCategories {
      ...ClassCategoryFields
    }
  }
`;

export const createClassCategoryMutationDocument: TypedDocumentNode<
  CreateClassCategoryMutation,
  CreateClassCategoryMutationVariables
> = gql`
  ${CLASS_CATEGORY_FIELDS}
  mutation createClassCategory($input: ClassCategoryCreateInput!) {
    createClassCategory(input: $input) {
      ...ClassCategoryFields
    }
  }
`;

export const updateClassCategoryMutationDocument: TypedDocumentNode<
  UpdateClassCategoryMutation,
  UpdateClassCategoryMutationVariables
> = gql`
  ${CLASS_CATEGORY_FIELDS}
  mutation updateClassCategory($id: ID!, $input: ClassCategoryUpdateInput!) {
    updateClassCategory(id: $id, input: $input) {
      ...ClassCategoryFields
    }
  }
`;

export const deleteClassCategoryMutationDocument: TypedDocumentNode<
  DeleteClassCategoryMutation,
  DeleteClassCategoryMutationVariables
> = gql`
  mutation deleteClassCategory($id: ID!) {
    deleteClassCategory(id: $id)
  }
`;
