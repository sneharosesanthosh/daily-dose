"use client";
import { useFormStatus } from "react-dom";

export default function SubmitButton({ children, pendingLabel = "Saving…", className }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className} disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2`}
    >
      {pending && (
        <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {pending ? pendingLabel : children}
    </button>
  );
}
