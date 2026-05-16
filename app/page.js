import { BookOpen, Heart, Feather } from "lucide-react";
import { prisma } from "@/lib/prisma";
import QuoteGenerator from "./QuoteGenerator";

export default async function Home() {
  let categories = [];

  try {
    const cats = await prisma.quote.findMany({
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    });
    categories = cats.map((c) => c.category);
  } catch {
    // DB not connected yet
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-16 flex-1 flex flex-col">

      {/* Header */}
      <header className="text-center mb-14">
        <h1 className="font-serif text-5xl font-semibold text-ink tracking-tight">
          Daily Dose
        </h1>
        <p className="mt-3 text-muted font-sans text-lg">
          Words that uplift. Collected with care.
        </p>
        <div className="mt-8 h-px bg-border" />
      </header>

      {/* Generator */}
      <QuoteGenerator categories={categories} />

      {/* Footer */}
      <footer className="mt-auto pt-16 font-sans">
        <div className="h-px bg-border mb-8" />
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-4 text-accent opacity-40">
            <BookOpen size={15} />
            <Feather size={14} />
            <Heart size={13} />
          </div>
          <p className="text-base font-serif italic text-muted">Curated words, open hearts.</p>
          <p className="text-xs text-muted opacity-40 tracking-widest uppercase">Daily Dose</p>
        </div>
      </footer>
    </main>
  );
}
