import { createContext } from "react";

export type NetworkConnectivityContextType = {
  isConnected: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  checkConnectivity: () => Promise<boolean>;
  setConnected: (connected: boolean) => void;
  notifyIfDisconnected: () => void;
  authToken: string | null;
  updateAuthToken: (token: string) => void;
  clearAuthData: () => void;
};

export const NetworkConnectivityContext = createContext<NetworkConnectivityContextType | undefined>(undefined);
