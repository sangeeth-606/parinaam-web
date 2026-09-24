"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

// RBAC surface for `records.recompute_integrity` (field officer ✓).
// Calls POST /api/cases/:id/integrity — server re-derives the sealed hash,
// compares and audits the attempt. The button is only rendered to roles
// that hold the capability (see case detail page).
export function IntegrityActions({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<
    { ok: boolean; stored: string; recomputed: string } | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  async function recompute() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/integrity`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Recompute failed.");
        return;
      }
      setResult(body);
      router.refresh(); // surface the new audit event in recent activity
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={recompute}
        disabled={busy}
        className="w-full"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
        {busy ? "Recomputing…" : "Recompute integrity"}
      </Button>
      {result && (
        <div
          className={`rounded-md border p-2.5 text-xs ${
            result.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <p className="font-medium">
            {result.ok
              ? "Hash verified — recomputed value matches the sealed record hash."
              : "Hash MISMATCH — recomputed value differs from the stored record hash."}
          </p>
          <p className="mt-1 break-all font-mono text-[10px] opacity-70">
            stored: {result.stored}
            <br />
            recomputed: {result.recomputed}
          </p>
        </div>
      )}
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}