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
    <Card className="w-full max-w-md">
      <CardHeader className="items-center text-center">
        <ShieldCheck className="mb-1 h-10 w-10 text-primary" />
        <CardTitle className="text-xl">Parinaam Dashboard</CardTitle>
        <CardDescription>
          NDPS field drug-test records — review, search & export
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

        <div className="mt-6 rounded-md border bg-muted/50 p-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
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
                className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs hover:bg-accent"
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
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
