---
name: seed-quotes
description: Generate curated sample quotes for the Daily Dose app, formatted for quick copy-paste into the admin UI. Use when the user wants to bulk-add quotes or populate a new category.
---

# Seed Quotes

When invoked, help the user add high-quality quotes to their Daily Dose database.

## Steps

1. **Ask** the user:
   - Which category? (e.g. "motivation", "gratitude", "courage", "growth", or "mixed" for a variety)
   - How many quotes? (default: 5)

2. **Generate** quotes that match Daily Dose's curated, literary style:
   - Prefer real, attributed quotes from real authors (Maya Angelou, Rumi, Audre Lorde, Toni Morrison, James Baldwin, Mary Oliver, Hafiz, Khalil Gibran, etc.)
   - Include `source` when the work is known (e.g. "I Know Why the Caged Bird Sings", "The Book of Hours")
   - Avoid overused quotes you'd find on a generic motivation poster
   - Tone: warm, reflective, uplifting — not aggressive "hustle" energy

3. **Output** in this exact format so the user can paste each into the `/admin/add` form:

```
─────────────────────────
Text:     "Quote text here."
Author:   Author Name
Source:   Title of Work (optional, leave blank if unknown)
Category: motivation
─────────────────────────
```

4. **Confirm** if the user wants more from a different category, or stop.

## Project context

- Quote model fields: `text` (required), `author?`, `source?`, `category` (required)
- Categories are free-text strings stored on each quote; existing categories automatically become filter pills on the home page
- Keep category names lowercase and consistent (e.g. `motivation` not `Motivation` or `motivational`) to avoid duplicate pills

## Don't

- Don't connect to the database or write a script to insert. Let the user use the admin UI — it's the source of truth.
- Don't generate generic LinkedIn-style platitudes. If a quote feels like it could be on a cubicle poster, replace it.
