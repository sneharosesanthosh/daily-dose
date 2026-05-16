import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Globe, LogOut, BookMarked } from "lucide-react";
import DeleteButton from "./DeleteButton";

async function requireAdmin() {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_session")?.value !== "1") redirect("/login");
}

async function deleteQuote(id) {
  "use server";
  if (!Number.isInteger(id)) return;
  await prisma.quote.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/");
}

export default async function AdminPage() {
  await requireAdmin();

  const quotes = await prisma.quote.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">

      {/* Top nav */}
      <nav className="flex items-center justify-between mb-10 pb-4 border-b border-border">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-sans text-muted hover:text-ink transition-colors"
        >
          <Globe size={14} />
          View site
        </Link>
        <Link
          href="/logout"
          className="inline-flex items-center gap-1.5 text-sm font-sans text-muted hover:text-red-500 transition-colors"
        >
          Sign out
          <LogOut size={14} />
        </Link>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <h1 className="font-serif text-3xl font-semibold text-ink">Admin</h1>
        <p className="text-muted font-sans text-sm mt-1">{quotes.length} quotes total</p>
      </div>

      {/* Add quote */}
      <div className="mb-6">
        <Link
          href="/admin/add"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-cream font-sans text-sm font-medium hover:bg-ink transition-colors"
        >
          + Add quote
        </Link>
      </div>

      {/* Quote list */}
      {quotes.length === 0 ? (
        <div className="text-center py-20 text-muted font-sans">
          <p className="text-4xl mb-4">✦</p>
          <p>No quotes yet. <Link href="/admin/add" className="text-accent underline">Add the first one.</Link></p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {quotes.map((quote) => (
            <div key={quote.id} className="py-6 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-serif text-lg italic text-ink leading-relaxed line-clamp-2">
                  &ldquo;{quote.text}&rdquo;
                </p>
                <div className="mt-2 flex items-center gap-2 flex-wrap font-sans text-xs text-muted">
                  {quote.author && <span>— {quote.author}</span>}
                  {quote.source && <span>· {quote.source}</span>}
                  <span className="px-2 py-0.5 rounded-full bg-accent-light text-ink-light">
                    {quote.category}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/admin/edit/${quote.id}`}
                  className="px-3 py-1.5 rounded-lg border border-border text-ink-light font-sans text-xs hover:bg-cream-dark transition-colors"
                >
                  Edit
                </Link>
                <DeleteButton action={deleteQuote.bind(null, quote.id)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <footer className="mt-12 pt-8 border-t border-border">
        <div className="flex items-center justify-center gap-2 text-accent opacity-30">
          <BookMarked size={14} />
        </div>
        <p className="mt-3 text-center text-xs text-muted opacity-50 font-sans tracking-wide">
          Daily Dose · Admin panel
        </p>
      </footer>
    </main>
  );
}
