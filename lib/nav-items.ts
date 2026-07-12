export interface NavItem {
  href: string;
  label: string;
  icon: "home" | "patterns" | "account" | "login";
}

export function getNavItems(authed: boolean): NavItem[] {
  const items: NavItem[] = [
    { href: "/", label: "Home", icon: "home" },
    { href: "/patterns", label: "Patterns", icon: "patterns" },
  ];
  if (authed) {
    items.push({ href: "/account", label: "Account", icon: "account" });
  } else {
    items.push({ href: "/login", label: "Log in", icon: "login" });
  }
  return items;
}
