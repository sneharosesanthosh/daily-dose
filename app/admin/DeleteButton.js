"use client";

export default function DeleteButton({ action }) {
  return (
    <form action={action}>
      <button
        type="submit"
        onClick={(e) => { if (!confirm("Delete this quote?")) e.preventDefault(); }}
        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 font-sans text-xs hover:bg-red-50 transition-colors"
      >
        Delete
      </button>
    </form>
  );
}
