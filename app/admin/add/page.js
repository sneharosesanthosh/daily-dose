import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import CategoryPicker from "../CategoryPicker";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_session")?.value !== "1") redirect("/login");
}

async function addQuote(formData) {
  "use server";
  const text = formData.get("text")?.trim();
  const author = formData.get("author")?.trim() || null;
  const source = formData.get("source")?.trim() || null;
  const category = formData.get("category")?.trim();
  if (!text || !category) return;
  await prisma.quote.create({ data: { text, author, source, category } });
  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export default async function AddQuotePage() {
  await requireAdmin();
  const cats = await prisma.quote.findMany({ distinct: ["category"], select: { category: true }, orderBy: { category: "asc" } });
  const categories = cats.map((c) => c.category);

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-10">
        <Link href="/admin" className="text-sm font-sans text-muted hover:text-ink transition-colors">
          ← Back to admin
        </Link>
        <h1 className="font-serif text-3xl font-semibold text-ink mt-4">Add quote</h1>
      </div>

      <form action={addQuote} className="space-y-6">
        <div>
          <label className="block text-sm font-sans text-ink-light mb-1.5">Quote *</label>
          <textarea
            name="text"
            required
            rows={4}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-white font-serif text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
            placeholder="Enter the quote text…"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-sans text-ink-light mb-1.5">Author</label>
            <input
              type="text"
              name="author"
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-white font-sans text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="e.g. Maya Angelou"
            />
          </div>
          <div>
            <label className="block text-sm font-sans text-ink-light mb-1.5">Source</label>
            <input
              type="text"
              name="source"
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-white font-sans text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="e.g. I Know Why the Caged Bird Sings"
            />
          </div>
        </div>

        <CategoryPicker categories={categories} />

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-accent text-cream font-sans font-medium hover:bg-ink transition-colors"
          >
            Save quote
          </button>
          <Link
            href="/admin"
            className="px-6 py-2.5 rounded-lg border border-border text-muted font-sans text-sm hover:text-ink transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
