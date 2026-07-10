import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const fxSyncHealthQueryDocument: TypedDocumentNode<Operations.FxSyncHealthQuery> = gql`
  query FxSyncHealth {
    fxSyncHealth {
      id
      isStale
      status
      finishedAt
    }
  }
`;
