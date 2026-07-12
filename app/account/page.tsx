import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profile";
import { ProfileForm } from "@/components/account/ProfileForm";
import { EmailForm } from "@/components/account/EmailForm";
import { BillingSection } from "@/components/account/BillingSection";
import { DeleteAccountSection } from "@/components/account/DeleteAccountSection";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile(supabase, user.id);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-2 pb-24 space-y-6">
      <h1 className="text-lg font-semibold text-indigo-deep">Account</h1>

      <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-medium text-indigo-deep/60">Profile</h2>
        <ProfileForm initialName={profile?.display_name ?? ""} />
        <div className="h-px bg-indigo-deep/10" />
        <EmailForm currentEmail={user.email ?? ""} />
      </section>

      <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-medium text-indigo-deep/60">Billing</h2>
        <BillingSection />
      </section>

      <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-medium text-indigo-deep/60">Danger zone</h2>
        <DeleteAccountSection />
      </section>
    </div>
  );
}
