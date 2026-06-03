import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/react";
import { setTokenProvider } from "../api/client";
import { notify } from "../lib/toast";
import { useAppSettings } from "../context/AppSettings";

const COPY = {
  es: { welcome: "¡Bienvenido!" },
  en: { welcome: "Welcome!" },
} as const;

const SESSION_KEY = "studyai_welcomed";

export default function AuthSync() {
  const { getToken, isSignedIn } = useAuth();
  const { lang } = useAppSettings();
  const notified = useRef(false);

  useEffect(() => {
    setTokenProvider(() => getToken());
  }, [getToken]);

  useEffect(() => {
    if (isSignedIn && !notified.current && !sessionStorage.getItem(SESSION_KEY)) {
      notified.current = true;
      sessionStorage.setItem(SESSION_KEY, "1");
      notify.success(COPY[lang].welcome);
    }
  }, [isSignedIn, lang]);

  return null;
}
