"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavItems } from "@/lib/nav-items";
import {
  HomeIcon,
  PatternsIcon,
  UserIcon,
  LoginIcon,
  LogoutIcon,
  CloseIcon,
} from "@/components/icons";

const ICONS = {
  home: HomeIcon,
  patterns: PatternsIcon,
  account: UserIcon,
  login: LoginIcon,
};

export function MobileDrawer({
  open,
  authed,
  onClose,
}: {
  open: boolean;
  authed: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const items = getNavItems(authed);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  // Close automatically on route change.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute left-0 top-0 h-full w-72 max-w-[80vw] bg-white shadow-xl flex flex-col px-4 py-6">
        <div className="flex items-center justify-between mb-6 px-2">
          <span className="font-semibold text-indigo-deep">Gentle Pulse</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="w-10 h-10 flex items-center justify-center rounded-lg text-indigo-deep/60 hover:bg-off-white"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {items.map((item) => {
            const Icon = ICONS[item.icon];
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-base transition ${
                  active
                    ? "bg-rose-gold-light text-indigo-deep font-medium"
                    : "text-indigo-deep/70 hover:bg-off-white"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {authed && (
          <form action="/api/auth/logout" method="post" className="mt-auto">
            <button
              type="submit"
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-base text-indigo-deep/60 hover:bg-off-white w-full"
            >
              <LogoutIcon className="w-5 h-5 shrink-0" />
              Log out
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
