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
import {
  ROLE_LABELS,
  recordScope,
  type Capability,
  can,
  type SessionUser,
} from "@/lib/roles";

// Sidebar entries are gated by CAPABILITY, not role lists, so the nav
// automatically tracks the RBAC matrix in lib/roles.ts.
const NAV: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  capability: Capability | null; // null = every authenticated session
}[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, capability: null },
  { href: "/cases", label: "Case Log", icon: ClipboardList, capability: "records.view_own" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, capability: "records.view_unit" },
  { href: "/admin", label: "Accounts & Audit", icon: Users, capability: "admin.users" },
];

/** Saffron–white–green strip that tops every official Government of India portal. */
export function TricolorStrip({ className = "" }: { className?: string }) {
  return (
    <div className={`flex h-1.5 w-full ${className}`} aria-hidden>
      <div className="h-full flex-1 bg-[#ff9933]" />
      <div className="h-full flex-1 bg-white" />
      <div className="h-full flex-1 bg-[#138808]" />
    </div>
  );
}

/** Government-style footer matching NCB's .footer-dark (flat #0d355e, faint top hairline). */
export function Footer() {
  // NCB .footer-dark: background:#0d355e; border-top:1px solid #ffffff0d
  return (
    <footer className="border-t border-white/5 bg-navy px-6 py-3 text-[11px] text-white/60">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>
          © 2026 Parinaam — NDPS Field Test Dashboard · Narcotics Control
          Bureau, Ministry of Home Affairs, Government of India
        </span>
        <span className="flex gap-4">
          <span className="transition-colors hover:text-gold">Terms of use</span>
          <span className="transition-colors hover:text-gold">Privacy policy</span>
          <span className="transition-colors hover:text-gold">Help</span>
        </span>
      </div>
    </footer>
  );
}

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const items = NAV.filter(
    (item) => !item.capability || can(user.role, item.capability)
  );

  // NCB .ncb-mobile-sidebar recipe: linear-gradient(#0d355e 0%, #072540 100%) —
  // starts at the exact header blue so there is no seam at the top.
  return (
    <aside className="flex w-60 shrink-0 flex-col bg-gradient-to-b from-navy to-navy-deep text-white">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="text-[10px] uppercase tracking-widest text-gold">
          Navigation
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
                  ? "bg-gold text-navy-deep shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3 text-[11px] text-white/50">
        SIMS sync: <span className="font-medium text-gold">placeholder ready</span>
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
    <header className="flex items-center justify-between border-b border-white/10 bg-navy px-6 py-3 text-white">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-gold/50 bg-white/5">
          <ShieldCheck className="h-6 w-6 text-gold" />
        </div>
        <div>
          <div className="text-base font-bold leading-tight tracking-wide">
            PARINAAM
          </div>
          <div className="text-[10px] uppercase tracking-widest text-gold">
            Narcotics Control Bureau · Ministry of Home Affairs, Govt. of India
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right leading-tight sm:block">
          <div className="text-sm font-medium">{user.name}</div>
          <div className="text-xs text-white/60">{user.department}</div>
        </div>
        <span className="rounded bg-white/10 px-2 py-1 text-[11px] font-medium text-gold">
          {ROLE_LABELS[user.role]}
        </span>
        {recordScope(user.role) === "own" && (
          <span
            className="rounded border border-gold/50 bg-gold/15 px-2 py-1 text-[11px] font-medium text-gold"
            title="RBAC scope: you can only see and export records you operate."
          >
            Own records only
          </span>
        )}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-xs font-semibold text-navy-deep">
          {initials}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          title="Sign out"
          className="text-white hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
