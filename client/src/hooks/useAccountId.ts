import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export function useAccountId(): string {
  return useContext(AuthContext)?.session?.userId ?? "local";
}
