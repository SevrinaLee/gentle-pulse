"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavItems } from "@/lib/nav-items";
import {
  HomeIcon,
  PatternsIcon,
  UserIcon,
  LoginIcon,
  LogoutIcon,
} from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";

const ICONS = {
  home: HomeIcon,
  patterns: PatternsIcon,
  account: UserIcon,
  login: LoginIcon,
};

export function Sidebar({ authed }: { authed: boolean }) {
  const pathname = usePathname();
  const items = getNavItems(authed);

  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:h-screen md:w-56 border-r border-indigo-deep/10 bg-surface px-4 py-6">
      <Link href="/" className="font-semibold text-indigo-deep px-2 mb-6">
        Gentle Pulse
      </Link>

      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${
                active
                  ? "bg-rose-gold-light text-indigo-deep font-medium"
                  : "text-indigo-deep/70 hover:bg-subtle"
              }`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 space-y-3">
        <ThemeToggle />
        {authed && (
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-indigo-deep/60 hover:bg-subtle w-full"
            >
              <LogoutIcon className="w-[18px] h-[18px] shrink-0" />
              Log out
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}
