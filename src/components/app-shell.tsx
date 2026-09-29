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
  Wifi,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ParinaamLogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ROLE_LABELS,
  type Capability,
  can,
  type SessionUser,
} from "@/lib/roles";

const NAV: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  capability: Capability | null;
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

/** Official Government of India & NCB compliance footer. */
export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-3.5 text-[11px] text-slate-500">
      <div className="flex flex-wrap items-center justify-between gap-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          <span>
            © 2026 Parinaam — NDPS Field Test Review Portal · Narcotics Control
            Bureau, Ministry of Home Affairs, Government of India
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-500 font-medium">
          <span className="text-slate-400">BSA §63 / NDPS Rule 10(2)</span>
          <span className="hover:text-blue-600 cursor-pointer transition-colors">Privacy Policy</span>
          <span className="hover:text-blue-600 cursor-pointer transition-colors">Audit Standards</span>
        </div>
      </div>
    </footer>
  );
}

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const items = NAV.filter(
    (item) => !item.capability || can(user.role, item.capability)
  );

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white text-slate-700">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="text-[10.5px] uppercase tracking-wider font-bold text-slate-400">
          Navigation Menu
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
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                active
                  ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600 shadow-2xs pl-2.5"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <item.icon className={`h-4.5 w-4.5 ${active ? "text-blue-600" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Institutional Boundary Callout */}
      <div className="border-t border-slate-100 p-4">
        <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3 text-[11px] leading-relaxed text-slate-500">
          <div className="font-semibold text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5 mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Direct Supabase Ledger
          </div>
          Self-hosted environment. Invariant rule 8: zero network writes to SIMS, NIDAAN, NCORD or CCTNS.
        </div>
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
    <header className="flex flex-col border-b border-slate-200 bg-white">
      <TricolorStrip />
      <div className="flex items-center justify-between px-6 py-2.5">
        <div className="flex items-center gap-3.5">
          <ParinaamLogo size={38} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold leading-tight tracking-tight text-slate-900">
                PARINAAM
              </span>
              <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.2 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                Portal
              </span>
            </div>
            <div className="text-[10px] uppercase tracking-wider font-medium text-slate-500">
              Narcotics Control Bureau · Ministry of Home Affairs, Govt. of India
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          {/* Real-time Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Wifi className="h-3 w-3 text-emerald-700" />
            <span>ONLINE · CENTRAL LEDGER</span>
          </div>

          {/* Theme Toggle (Light / Dark) */}
          <ThemeToggle />

          {/* User Profile */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-2xs">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                {user.name}
              </div>
              <div className="text-[10.5px] text-slate-500">
                {ROLE_LABELS[user.role] ?? user.role}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-slate-500 hover:text-red-700 hover:bg-red-50 text-xs gap-1.5 px-2.5"
              title="Sign out of portal"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Topbar user={user} />
      <div className="flex flex-1">
        <Sidebar user={user} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
