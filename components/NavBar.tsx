import Link from "next/link";

export function NavBar() {
  return (
    <nav className="flex items-center justify-between max-w-2xl mx-auto px-4 pt-6 pb-2">
      <span className="font-semibold text-indigo-deep">Gentle Pulse</span>
      <div className="flex gap-4 text-sm">
        <Link href="/" className="text-indigo-deep/70 hover:text-indigo-deep">
          Home
        </Link>
        <Link
          href="/patterns"
          className="text-indigo-deep/70 hover:text-indigo-deep"
        >
          Patterns
        </Link>
      </div>
    </nav>
  );
}
