import { useContext } from "react";
import {
  NetworkConnectivityContext,
  type NetworkConnectivityContextType,
} from "@/frontend/context/NetworkConnectivityContext";

export const useNetworkConnectivity = (): NetworkConnectivityContextType => {
  const context = useContext(NetworkConnectivityContext);
  if (!context) {
    throw new Error("useNetworkConnectivity must be used within a NetworkConnectivityProvider");
  }
  return context;
};
