import { createClient } from "@/lib/supabase/server";
import {
  getCheckInsWithTags,
  getTopPattern,
  getActiveSuggestionForPattern,
} from "@/lib/queries";
import { NavBar } from "@/components/NavBar";
import { CheckInForm } from "@/components/CheckInForm";
import { FrictionLog } from "@/components/FrictionLog";
import { InsightCard } from "@/components/InsightCard";
import { SighButton } from "@/components/SighButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();

  try {
    const checkIns = await getCheckInsWithTags(supabase);
    const topPattern = await getTopPattern(supabase);
    const suggestion = topPattern
      ? await getActiveSuggestionForPattern(supabase, topPattern.id)
      : null;

    return (
      <main className="min-h-screen pb-24">
        <NavBar />
        <div className="max-w-2xl mx-auto px-4 space-y-6 pt-2">
          {topPattern && <InsightCard pattern={topPattern} suggestion={suggestion} />}

          <CheckInForm />

          <div>
            <h2 className="text-sm font-medium text-indigo-deep/60 mb-3">
              Friction log
            </h2>
            <FrictionLog checkIns={checkIns} />
          </div>
        </div>

        <SighButton />
      </main>
    );
  } catch {
    return (
      <main className="min-h-screen">
        <NavBar />
        <div className="max-w-2xl mx-auto px-4 pt-8">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-sm">
            Couldn&apos;t load your check-ins right now. Try refreshing the page.
          </div>
        </div>
      </main>
    );
  }
}
