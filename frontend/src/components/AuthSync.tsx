import { useEffect } from "react";
import { useAuth } from "@clerk/react";
import { setTokenProvider } from "../api/client";

export default function AuthSync() {
  const { getToken } = useAuth();

  useEffect(() => {
    setTokenProvider(() => getToken());
  }, [getToken]);

  return null;
}
