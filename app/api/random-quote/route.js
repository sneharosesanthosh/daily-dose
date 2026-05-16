import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const exclude = searchParams.get("exclude");
  const excludeId = exclude ? parseInt(exclude, 10) : null;

  const where = {
    ...(category ? { category } : {}),
    ...(excludeId ? { id: { not: excludeId } } : {}),
  };

  const count = await prisma.quote.count({ where });

  if (count === 0) return Response.json(null);

  const skip = Math.floor(Math.random() * count);
  const quotes = await prisma.quote.findMany({ where, skip, take: 1 });

  return Response.json(quotes[0] ?? null);
}
