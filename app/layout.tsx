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

  // Set the theme before first paint to avoid a light-mode flash on reload.
  const themeScript = `(function(){try{var t=localStorage.getItem('gp_theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <AppShell authed={!isDemo}>{children}</AppShell>
      </body>
    </html>
  );
}
