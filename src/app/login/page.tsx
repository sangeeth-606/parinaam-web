"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

const DEMO_ACCOUNTS = [
  { email: "admin@parinaam.gov.in", password: "admin123", role: "Administrator" },
  { email: "supervisor@parinaam.gov.in", password: "supervisor123", role: "Supervisor" },
  { email: "io@parinaam.gov.in", password: "io123", role: "Investigating Officer" },
  { email: "judiciary@parinaam.gov.in", password: "judiciary123", role: "Judiciary" },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [email, setEmail] = useState("admin@parinaam.gov.in");
  const [password, setPassword] = useState("admin123");
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
      setError(body.error ?? "Sign-in failed.");
      return;
    }
    // HACKATHON NOTE: Supabase Auth will insert a TOTP MFA step here
    // (challenge + verify) before the dashboard session is issued.
    router.push(next);
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md border-t-4 border-t-gold shadow-lg">
      <CardHeader className="items-center text-center">
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-md bg-navy">
          <ShieldCheck className="h-7 w-7 text-gold" />
        </div>
        <CardTitle className="text-xl">Parinaam Dashboard</CardTitle>
        <CardDescription>
          Narcotics Control Bureau — NDPS field drug-test records: review,
          search &amp; export
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="email">Official email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          {error && <p className="text-xs text-red-700">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 rounded-md border border-gold/40 bg-gold/10 p-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-navy">
            Demo accounts (hackathon)
          </p>
          <div className="space-y-1">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => {
                  setEmail(a.email);
                  setPassword(a.password);
                }}
                className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs hover:bg-gold/30"
              >
                <span className="font-mono">{a.email}</span>
                <span className="text-muted-foreground">{a.role}</span>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-navy to-navy-deep p-6">
      <div className="mb-6 w-full max-w-md">
        <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full">
          <div className="flex h-full w-full">
            <div className="h-full flex-1 bg-[#ff9933]" />
            <div className="h-full flex-1 bg-white" />
            <div className="h-full flex-1 bg-[#138808]" />
          </div>
        </div>
        <div className="text-center text-white">
          <div className="text-lg font-semibold tracking-wide">
            Narcotics Control Bureau
          </div>
          <div className="text-xs uppercase tracking-widest text-gold">
            Ministry of Home Affairs · Government of India
          </div>
        </div>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="mt-6 w-full max-w-md text-center text-[11px] text-white/50">
        © 2026 Parinaam · NDPS Field Test Dashboard — official use only.
        Unauthorised access is prohibited.
      </p>
    </main>
  );
}
