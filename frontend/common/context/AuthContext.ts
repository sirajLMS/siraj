import { createContext } from "react";
import type { LoginMutationVariables, MeQuery } from "@/frontend/common/graphql/generated/gql/graphql";

// The shape of the authentication context
export type AuthContextType = {
  user: MeQuery["me"] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginMutationVariables, redirectUrl?: string | null) => Promise<boolean>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
