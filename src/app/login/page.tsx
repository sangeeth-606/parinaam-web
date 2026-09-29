"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Wifi, User, KeyRound, Scale } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { ParinaamLogo } from "@/components/ui/logo";
import { TricolorStrip } from "@/components/app-shell";

const DEMO_ACCOUNTS = [
  { username: "admin", role: "Administrator", unit: "NCB Headquarters, New Delhi" },
  { username: "supervisor", role: "Supervisor", unit: "NCB Zonal Office, Mumbai" },
  { username: "sharma", role: "Senior Officer", unit: "NCB Zonal Office, Delhi" },
  { username: "reddy", role: "Judiciary", unit: "Fast Track Court, Hyderabad" },
  { username: "gill", role: "Field Officer", unit: "NCB Zonal Office, Delhi" },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("Parinaam#2026");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setError(body.error ?? "Sign-in failed. Please verify credentials.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md border border-slate-200/90 shadow-sm overflow-hidden rounded-2xl bg-white">
      <TricolorStrip />
      <CardHeader className="items-center text-center pt-6 pb-4">
        <ParinaamLogo size={68} className="mb-2" />
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          Parinaam
        </CardTitle>
        <CardDescription className="text-xs text-slate-500 max-w-xs leading-relaxed">
          Narcotics Control Bureau · Ministry of Home Affairs
          <span className="block text-[11px] font-medium text-slate-400 mt-0.5">
            Presumptive Field Assay Review &amp; Central Evidence Ledger
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        <form onSubmit={submit} className="space-y-3.5">
          <div>
            <Label htmlFor="email" className="text-slate-700">Officer Username or ID</Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="email"
                type="text"
                autoComplete="username"
                placeholder="e.g. admin, sharma, supervisor"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-slate-700">Official Password</Label>
            <div className="relative mt-1">
              <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full h-10 shadow-xs text-sm font-semibold" disabled={loading}>
            {loading ? "Authenticating Officer…" : "Sign In to Central Terminal"}
          </Button>
        </form>

        {/* Quick Demo Credentials Box */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900">
              Demo Officers (Evaluation)
            </span>
            <span className="font-mono text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded font-medium">
              Parinaam#2026
            </span>
          </div>

          <div className="space-y-1">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.username}
                type="button"
                onClick={() => {
                  setEmail(a.username);
                  setPassword("Parinaam#2026");
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                  email === a.username ? "bg-blue-100/80 font-bold text-blue-900" : "hover:bg-blue-100/50 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold">{a.username}</span>
                  <span className="text-[11px] text-slate-500 font-normal">({a.role})</span>
                </div>
                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{a.unit}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Statutory Citation Footer */}
        <div className="pt-2 text-center text-[10px] uppercase tracking-wide text-slate-400 flex items-center justify-center gap-1.5 font-medium">
          <Scale className="h-3 w-3 text-slate-400" />
          <span>NDPS Rule 10(2) · BSA §63 Compliant · Zero-Write Sim</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      {/* Top Terminal Status Header */}
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>PORTAL #8841-K</span>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-2xs">
          <Wifi className="h-3 w-3 text-emerald-700" />
          <span>ONLINE · SUPABASE CONNECTED</span>
        </div>
      </div>

      <Suspense>
        <LoginForm />
      </Suspense>

      <footer className="mt-8 text-center text-xs text-slate-400">
        Government of India · Ministry of Home Affairs · Narcotics Control Bureau
      </footer>
    </main>
  );
}
