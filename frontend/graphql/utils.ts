"use client";

import type { ApolloClient, OperationVariables } from "@apollo/client";
import type * as ApolloReact from "@apollo/client/react";
import { useCallback } from "react";

export function useLazyQueryWrapper<T, V extends OperationVariables>(
  lazyQueryResult: ApolloReact.useLazyQuery.ResultTuple<T, V>
) {
  const [execute] = lazyQueryResult;
  return useCallback(
    async (variables: V): Promise<ApolloClient.QueryResult<T>> => {
      return execute({ variables });
    },
    [execute]
  );
}

export function useMutationWrapper<T, V extends OperationVariables>(
  mutationResult: ApolloReact.useMutation.ResultTuple<T, V>
) {
  const [mutate] = mutationResult;
  return useCallback(
    async (variables: V): Promise<ApolloClient.MutateResult<T>> => {
      return mutate({ variables });
    },
    [mutate]
  );
}
