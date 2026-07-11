import Link from "next/link";

export function DemoBanner() {
  return (
    <div className="bg-rose-gold-light/60 border border-rose-gold/30 rounded-2xl p-4 flex items-center justify-between gap-3">
      <p className="text-sm text-indigo-deep">
        You&apos;re viewing the <span className="font-medium">demo</span>. Log in
        to start your own private friction log.
      </p>
      <Link
        href="/login"
        className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-deep text-off-white text-sm font-medium hover:bg-indigo-deep-light transition"
      >
        Log in
      </Link>
    </div>
  );
}
