import { createClient } from "@/lib/supabase/server";
import { getPatternsRanked } from "@/lib/queries";
import { NavBar } from "@/components/NavBar";

export const dynamic = "force-dynamic";

export default async function PatternsPage() {
  const supabase = await createClient();

  try {
    const patterns = await getPatternsRanked(supabase);

    return (
      <main className="min-h-screen pb-24">
        <NavBar />
        <div className="max-w-2xl mx-auto px-4 pt-2 space-y-6">
          <h1 className="text-lg font-semibold text-indigo-deep">
            Your top frustrations
          </h1>

          {patterns.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center text-sm text-indigo-deep/60">
              Check in for 3+ days to see your patterns emerge
            </div>
          ) : (
            <ol className="space-y-3">
              {patterns.map((pattern, i) => (
                <li
                  key={pattern.id}
                  className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4"
                >
                  <span className="text-2xl font-bold text-rose-gold w-8 shrink-0">
                    #{i + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-medium text-indigo-deep">
                      {pattern.category}
                    </h3>
                    <p className="text-sm text-indigo-deep/60">
                      {pattern.occurrence_count} check-ins this week
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-semibold text-indigo-deep">
                      {pattern.estimated_hours_per_week ?? "?"}h
                    </p>
                    <p className="text-xs text-indigo-deep/40">per week</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </main>
    );
  } catch {
    return (
      <main className="min-h-screen">
        <NavBar />
        <div className="max-w-2xl mx-auto px-4 pt-8">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-sm">
            Couldn&apos;t load your patterns right now. Try refreshing the page.
          </div>
        </div>
      </main>
    );
  }
}
