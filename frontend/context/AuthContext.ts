import { createContext } from "react";
import type { MutationLoginArgs, User } from "@/frontend/graphql/generated/gql/graphql-types";

// The shape of the authentication context
export type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: MutationLoginArgs, redirectUrl?: string | null) => Promise<boolean>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
