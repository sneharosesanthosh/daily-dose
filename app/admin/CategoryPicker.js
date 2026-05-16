"use client";
import { useState } from "react";

export default function CategoryPicker({ categories, defaultValue = "" }) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div>
      <label className="block text-sm font-sans text-ink-light mb-1.5">Category *</label>
      <input
        type="text"
        name="category"
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border border-border bg-white font-sans text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        placeholder="e.g. Courage, Gratitude, Growth…"
      />
      {categories.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setValue(cat)}
              className={`px-3 py-1 rounded-full text-xs font-sans transition-colors ${
                value === cat
                  ? "bg-accent text-cream"
                  : "bg-accent-light text-ink-light hover:bg-border"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
