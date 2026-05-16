"use client";
import { useState } from "react";
import { Sparkles } from "lucide-react";

export default function QuoteGenerator({ categories }) {
  const [active, setActive] = useState("all");
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quoteKey, setQuoteKey] = useState(0);
  const [empty, setEmpty] = useState(false);

  function selectCategory(cat) {
    if (cat !== active) {
      setActive(cat);
      setQuote(null);
      setEmpty(false);
    }
  }

  async function generate() {
    setLoading(true);
    setEmpty(false);
    try {
      const params = new URLSearchParams();
      if (active !== "all") params.set("category", active);
      if (quote) params.set("exclude", quote.id);
      const res = await fetch(`/api/random-quote?${params}`);
      const data = await res.json();
      if (!data) {
        setEmpty(true);
        setQuote(null);
      } else {
        setQuote(data);
        setQuoteKey((k) => k + 1);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Category pills */}
      {categories.length > 0 && (
        <nav className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => selectCategory("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-sans transition-colors ${
              active === "all"
                ? "bg-accent text-cream font-medium"
                : "bg-cream-dark text-ink-light hover:bg-border"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => selectCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-sans transition-colors ${
                active === cat
                  ? "bg-accent text-cream font-medium"
                  : "bg-cream-dark text-ink-light hover:bg-border"
              }`}
            >
              {cat}
            </button>
          ))}
        </nav>
      )}

      {/* Generate button */}
      <div className="flex justify-center mb-14">
        <button
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-accent text-cream font-sans font-medium text-base hover:bg-ink transition-colors disabled:opacity-60 shadow-sm"
        >
          <Sparkles size={16} />
          {loading ? "Finding…" : quote ? "Generate another" : "Generate a quote"}
        </button>
      </div>

      {/* Quote area — fixed height, overflow scroll, fully isolated from layout above */}
      <div className="h-64 overflow-y-auto">
        {quote && (
          <article key={quoteKey} className="quote-appear text-center px-4 w-full">
            <blockquote className="font-serif text-2xl md:text-3xl leading-relaxed italic text-ink">
              &ldquo;{quote.text}&rdquo;
            </blockquote>
            <footer className="mt-6 flex items-center justify-center gap-3 flex-wrap font-sans text-sm text-muted">
              {quote.author && <span>— {quote.author}</span>}
              {quote.source && <span>· {quote.source}</span>}
              <span className="px-2.5 py-0.5 rounded-full bg-accent-light text-ink-light text-xs">
                {quote.category}
              </span>
            </footer>
          </article>
        )}

        {!quote && !loading && !empty && (
          <div className="text-center text-muted font-sans pt-10">
            <p className="text-3xl mb-4 opacity-20">✦</p>
            <p className="text-sm">Pick a category above and hit generate.</p>
          </div>
        )}

        {empty && (
          <p className="text-center text-muted font-sans text-sm pt-10">
            No quotes in this category yet.
          </p>
        )}
      </div>
    </div>
  );
}
