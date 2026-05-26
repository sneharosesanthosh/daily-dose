import { revalidatePath } from "next/cache";
import { createQuote, ValidationError } from "@/lib/quotes";

export async function POST(request) {
  const expected = process.env.AGENT_API_KEY;
  if (!expected) {
    return Response.json({ error: "Server is missing AGENT_API_KEY" }, { status: 500 });
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token || token !== expected) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const quote = await createQuote(body ?? {});
    revalidatePath("/");
    revalidatePath("/admin");
    return Response.json(quote, { status: 201 });
  } catch (err) {
    if (err instanceof ValidationError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    console.error("POST /api/quotes failed:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
