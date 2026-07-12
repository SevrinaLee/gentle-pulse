import { createClient } from "@/lib/supabase/server";
import { getScopeId } from "@/lib/auth";
import {
  getCheckInsWithTags,
  getTopPattern,
  getActiveSuggestionForPattern,
} from "@/lib/queries";
import { DemoBanner } from "@/components/DemoBanner";
import { CheckInForm } from "@/components/CheckInForm";
import { FrictionLog } from "@/components/FrictionLog";
import { InsightCard } from "@/components/InsightCard";
import { SighButton } from "@/components/SighButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { scopeId, isDemo } = await getScopeId(supabase);

  try {
    const checkIns = await getCheckInsWithTags(supabase, scopeId);
    const topPattern = await getTopPattern(supabase, scopeId);
    const suggestion = topPattern
      ? await getActiveSuggestionForPattern(supabase, topPattern.id, scopeId)
      : null;

    return (
      <main className="min-h-screen pb-24">
        <div className="max-w-2xl mx-auto px-4 space-y-6 pt-4 md:pt-6">
          {isDemo && <DemoBanner />}

          {topPattern && (
            <InsightCard
              pattern={topPattern}
              suggestion={suggestion}
              canWrite={!isDemo}
            />
          )}

          {isDemo ? null : <CheckInForm />}

          <div>
            <h2 className="text-sm font-medium text-indigo-deep/60 mb-3">
              Friction log
            </h2>
            <FrictionLog checkIns={checkIns} canWrite={!isDemo} />
          </div>
        </div>

        {!isDemo && <SighButton />}
      </main>
    );
  } catch {
    return (
      <main className="min-h-screen">
        <div className="max-w-2xl mx-auto px-4 pt-8">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-sm">
            Couldn&apos;t load your check-ins right now. Try refreshing the page.
          </div>
        </div>
      </main>
    );
  }
}
