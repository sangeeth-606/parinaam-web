"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROLE_LABELS, type SessionUser } from "@/lib/roles";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "supervisor", "io", "judiciary"] },
  { href: "/cases", label: "Case Log", icon: ClipboardList, roles: ["admin", "supervisor", "io", "judiciary"] },
  { href: "/analytics", label: "Analytics", icon: BarChart3, roles: ["admin", "supervisor", "io", "judiciary"] },
  { href: "/admin", label: "Accounts & Audit", icon: Users, roles: ["admin"] },
];

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const items = NAV.filter((item) => (item.roles as string[]).includes(user.role));

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-card">
      <div className="flex items-center gap-2 border-b px-5 py-4">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <div>
          <div className="text-sm font-bold tracking-tight">PARINAAM</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            NDPS Field Test Dashboard
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3 text-[11px] text-muted-foreground">
        SIMS sync: <span className="font-medium">placeholder ready</span>
      </div>
    </aside>
  );
}

export function Topbar({ user }: { user: SessionUser }) {
  const router = useRouter();
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b bg-card px-6 py-3">
      <div className="text-sm text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{ROLE_LABELS[user.role]}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right leading-tight">
          <div className="text-sm font-medium">{user.name}</div>
          <div className="text-xs text-muted-foreground">{user.department}</div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {initials}
        </div>
        <Button variant="ghost" size="icon" onClick={logout} title="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
