"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { canReview, type Role } from "@/lib/roles";
import { CASE_STATUSES, STATUS_LABELS, type CaseStatus } from "@/lib/types";

// Reviewer-only mutation surface for a case: status changes + panchnama ref.
// The record fields themselves are never editable from this UI.
export function StatusActions({
  caseId,
  currentStatus,
  currentPanchnamaRef,
  role,
}: {
  caseId: string;
  currentStatus: CaseStatus;
  currentPanchnamaRef?: string;
  role: Role;
}) {
  const router = useRouter();
  const reviewer = canReview(role);
  const [status, setStatus] = useState<CaseStatus>(currentStatus);
  const [panchnamaRef, setPanchnamaRef] = useState(currentPanchnamaRef ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch(`/api/cases/${caseId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseStatus: status,
        ...(panchnamaRef ? { panchnamaRef } : {}),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setError(body.error ?? "Failed to update.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Case status</Label>
        <Select
          className="mt-1"
          value={status}
          disabled={!reviewer}
          onChange={(e) => {
            setStatus(e.target.value as CaseStatus);
            setSaved(false);
          }}
        >
          {CASE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Panchnama reference (optional)</Label>
        <Input
          className="mt-1"
          value={panchnamaRef}
          disabled={!reviewer}
          placeholder="PN/2026/JAI/3001"
          onChange={(e) => {
            setPanchnamaRef(e.target.value);
            setSaved(false);
          }}
        />
      </div>
      {reviewer ? (
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save review state"}
          </Button>
          {saved && <span className="text-xs text-emerald-700">Saved.</span>}
          {error && <span className="text-xs text-red-700">{error}</span>}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Read-only: only supervisors and administrators can change review state.
        </p>
      )}
    </div>
  );
}
