"use client";

import Link from "next/link";
import { MenuIcon } from "@/components/icons";

export function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-subtle/95 backdrop-blur border-b border-indigo-deep/10">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="w-10 h-10 -ml-2 flex items-center justify-center rounded-lg text-indigo-deep hover:bg-surface"
      >
        <MenuIcon className="w-6 h-6" />
      </button>
      <Link href="/" className="font-semibold text-indigo-deep">
        Gentle Pulse
      </Link>
      <div className="w-10" aria-hidden />
    </header>
  );
}
