import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function login(formData) {
  "use server";
  const password = formData.get("password");
  if (password === process.env.ADMIN_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set("admin_session", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    redirect("/admin");
  }
  redirect("/login?error=1");
}

export default async function LoginPage({ searchParams }) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-cream">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl font-semibold text-ink">Daily Dose</h1>
          <p className="mt-2 text-muted font-sans text-sm">Admin access</p>
        </div>

        <form action={login} className="space-y-4">
          <div>
            <label className="block text-sm font-sans text-ink-light mb-1.5">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              autoFocus
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-white font-sans text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="Enter admin password"
            />
          </div>

          {error && (
            <p className="text-sm font-sans text-red-600">Wrong password. Try again.</p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-accent text-cream font-sans font-medium hover:bg-ink transition-colors"
          >
            Sign in
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm font-sans text-muted hover:text-ink transition-colors">
            ← Back to site
          </Link>
        </div>
      </div>
    </main>
  );
}
