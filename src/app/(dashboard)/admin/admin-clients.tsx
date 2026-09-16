"use client";

// Admin page interactive pieces: create-account form + approval actions.

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

const ROLES = [
  { value: "io", label: "Investigating Officer" },
  { value: "supervisor", label: "Supervisor" },
  { value: "judiciary", label: "Judiciary" },
  { value: "admin", label: "Administrator" },
];

export function CreateUserForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", role: "io", department: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(false);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setError(body.error ?? "Failed to create account.");
      return;
    }
    setOk(true);
    setForm({ name: "", email: "", role: "io", department: "" });
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-3">
      <div>
        <Label>Full name</Label>
        <Input
          required
          className="mt-1"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Officer name"
        />
      </div>
      <div>
        <Label>Official email</Label>
        <Input
          required
          type="email"
          className="mt-1"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="name@parinaam.gov.in"
        />
      </div>
      <div>
        <Label>Role</Label>
        <Select
          className="mt-1"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Department</Label>
        <Input
          required
          className="mt-1"
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
          placeholder="e.g. Excise Department"
        />
      </div>
      <div className="col-span-2 flex items-center gap-3">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? "Creating…" : "Create account (pending approval)"}
        </Button>
        {ok && <span className="text-xs text-emerald-700">Account created as pending.</span>}
        {error && <span className="text-xs text-red-700">{error}</span>}
      </div>
    </form>
  );
}

export function UserActions({
  userId,
  status,
}: {
  userId: string;
  status: "active" | "pending" | "suspended";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function update(next: "active" | "suspended") {
    setBusy(true);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex justify-end gap-2">
      {status !== "active" && (
        <Button size="sm" variant="outline" disabled={busy} onClick={() => update("active")}>
          {status === "pending" ? "Approve" : "Reactivate"}
        </Button>
      )}
      {status === "active" && (
        <Button size="sm" variant="destructive" disabled={busy} onClick={() => update("suspended")}>
          Suspend
        </Button>
      )}
    </div>
  );
}
