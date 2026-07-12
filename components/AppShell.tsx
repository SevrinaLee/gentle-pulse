"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileDrawer } from "@/components/MobileDrawer";

// Routes that render full-screen with no sidebar/header chrome.
const BARE_ROUTES = ["/login", "/forgot-password", "/reset-password"];

export function AppShell({
  authed,
  children,
}: {
  authed: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (BARE_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="md:min-h-screen">
      <Sidebar authed={authed} />
      <MobileDrawer
        open={drawerOpen}
        authed={authed}
        onClose={() => setDrawerOpen(false)}
      />
      <div className="md:ml-56">
        <MobileHeader onMenuClick={() => setDrawerOpen(true)} />
        {children}
      </div>
    </div>
  );
}
