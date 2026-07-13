"use client";

import type { ApolloClient, OperationVariables } from "@apollo/client";
import type * as ApolloReact from "@apollo/client/react";
import { useCallback } from "react";

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
