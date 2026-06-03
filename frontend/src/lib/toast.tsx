import { Toaster, toast } from "sonner";
import { useAppSettings } from "../context/AppSettings";

export function BrandedToaster() {
  const { theme } = useAppSettings();

  return (
    <Toaster
      theme={theme === "dark" ? "dark" : "light"}
      position="top-right"
      toastOptions={{
        style: {
          background: "rgb(var(--c-surface))",
          color: "rgb(var(--c-on-surface))",
          border: "1px solid rgb(var(--c-outline-variant))",
          fontFamily: "'Manrope', sans-serif",
          borderRadius: "0.75rem",
        },
      }}
    />
  );
}

export const notify = {
  success: (msg: string) =>
    toast.success(msg, {
      style: { borderLeft: "4px solid rgb(var(--c-primary))" },
    }),
  error: (msg: string) =>
    toast.error(msg, {
      style: { borderLeft: "4px solid rgb(var(--c-error))" },
    }),
  info: (msg: string) => toast(msg),
};
