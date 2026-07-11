import Link from "next/link";

export function NavBar({ authed }: { authed: boolean }) {
  return (
    <nav className="flex items-center justify-between max-w-2xl mx-auto px-4 pt-6 pb-2">
      <Link href="/" className="font-semibold text-indigo-deep">
        Gentle Pulse
      </Link>
      <div className="flex items-center gap-4 text-sm">
        <Link href="/" className="text-indigo-deep/70 hover:text-indigo-deep">
          Home
        </Link>
        <Link
          href="/patterns"
          className="text-indigo-deep/70 hover:text-indigo-deep"
        >
          Patterns
        </Link>
        {authed ? (
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="text-indigo-deep/70 hover:text-indigo-deep"
            >
              Log out
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-lg bg-indigo-deep text-off-white hover:bg-indigo-deep-light transition"
          >
            Log in
          </Link>
        )}
      </div>
    </nav>
  );
}
