import Swal, { SweetAlertIcon } from "sweetalert2";
import "./swal.css";

const branded = Swal.mixin({
  customClass: {
    popup: "swal-popup",
    title: "swal-title",
    htmlContainer: "swal-html",
    confirmButton: "swal-confirm",
    cancelButton: "swal-cancel",
  },
  buttonsStyling: false,
});

export async function confirmDialog({
  title,
  text,
  confirmText,
  cancelText,
  icon = "question",
}: {
  title: string;
  text?: string;
  confirmText: string;
  cancelText: string;
  icon?: SweetAlertIcon;
}): Promise<boolean> {
  const result = await branded.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });
  return result.isConfirmed;
}

export function alertSuccess(title: string, text?: string): void {
  branded.fire({ title, text, icon: "success" });
}

export function alertError(title: string, text?: string): void {
  branded.fire({ title, text, icon: "error" });
}
