import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { getScopeId } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Gentle Pulse",
  description: "Log daily friction, spot the pattern, get one fix.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { isDemo } = await getScopeId(supabase);

  return (
    <html lang="en">
      <body className="antialiased">
        <AppShell authed={!isDemo}>{children}</AppShell>
      </body>
    </html>
  );
}
