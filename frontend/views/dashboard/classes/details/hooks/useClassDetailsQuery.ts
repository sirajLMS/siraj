import { useQuery } from "@apollo/client/react";
import { classInstanceQueryDocument } from "@/frontend/graphql/sharedDocuments";

export function useClassDetailsQuery(id: string) {
  const { data, loading, error } = useQuery(classInstanceQueryDocument, {
    variables: { id },
    skip: !id,
  });
  return { data, loading, error };
}

export function useClassDetailsData(id: string) {
  const { data, loading, error } = useClassDetailsQuery(id);
  return { data, loading, error };
}
