import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import CategoryPicker from "../../CategoryPicker";
import SubmitButton from "../../SubmitButton";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_session")?.value !== "1") redirect("/login");
}

async function updateQuote(id, formData) {
  "use server";
  const text = formData.get("text")?.trim();
  const author = formData.get("author")?.trim() || null;
  const source = formData.get("source")?.trim() || null;
  const category = formData.get("category")?.trim();
  if (!text || !category) return;
  await prisma.quote.update({ where: { id }, data: { text, author, source, category } });
  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export default async function EditQuotePage({ params }) {
  await requireAdmin();

  const { id } = await params;
  const [quote, cats] = await Promise.all([
    prisma.quote.findUnique({ where: { id: parseInt(id, 10) } }),
    prisma.quote.findMany({ distinct: ["category"], select: { category: true }, orderBy: { category: "asc" } }),
  ]);
  if (!quote) notFound();
  const categories = cats.map((c) => c.category);

  const action = updateQuote.bind(null, quote.id);

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-10">
        <Link href="/admin" className="text-sm font-sans text-muted hover:text-ink transition-colors">
          ← Back to admin
        </Link>
        <h1 className="font-serif text-3xl font-semibold text-ink mt-4">Edit quote</h1>
      </div>

      <form action={action} className="space-y-6">
        <div>
          <label className="block text-sm font-sans text-ink-light mb-1.5">Quote *</label>
          <textarea
            name="text"
            required
            rows={4}
            defaultValue={quote.text}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-white font-serif text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-sans text-ink-light mb-1.5">Author</label>
            <input
              type="text"
              name="author"
              defaultValue={quote.author ?? ""}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-white font-sans text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="e.g. Maya Angelou"
            />
          </div>
          <div>
            <label className="block text-sm font-sans text-ink-light mb-1.5">Source</label>
            <input
              type="text"
              name="source"
              defaultValue={quote.source ?? ""}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-white font-sans text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="e.g. I Know Why the Caged Bird Sings"
            />
          </div>
        </div>

        <CategoryPicker categories={categories} defaultValue={quote.category} />

        <div className="flex items-center gap-3 pt-2">
          <SubmitButton
            className="px-6 py-2.5 rounded-lg bg-accent text-cream font-sans font-medium hover:bg-ink transition-colors"
            pendingLabel="Saving…"
          >
            Save changes
          </SubmitButton>
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
