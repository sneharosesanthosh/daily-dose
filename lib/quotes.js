import { prisma } from "@/lib/prisma";

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

export async function createQuote(input) {
  const text = clean(input?.text);
  const author = clean(input?.author);
  const source = clean(input?.source);
  const category = clean(input?.category);

  if (!text) throw new ValidationError("text is required");
  if (!category) throw new ValidationError("category is required");
  if (text.length > 2000) throw new ValidationError("text must be 2000 characters or fewer");
  if (category.length > 100) throw new ValidationError("category must be 100 characters or fewer");

  return prisma.quote.create({
    data: {
      text,
      author: author || null,
      source: source || null,
      category,
    },
  });
}
