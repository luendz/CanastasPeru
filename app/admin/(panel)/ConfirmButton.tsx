"use client";

import { useFormStatus } from "react-dom";

/** Botón de envío que pide confirmación y se deshabilita mientras procesa. */
export default function ConfirmButton({ children, message, className, disabled }: { children: React.ReactNode; message: string; className?: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={disabled || pending}
      onClick={(e) => { if (!window.confirm(message)) e.preventDefault(); }}
    >
      {pending ? "Procesando…" : children}
    </button>
  );
}
