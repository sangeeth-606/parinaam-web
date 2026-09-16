import { Database, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";

// SIMS (NCB Seizure Information Management System) integration placeholder.
// The card is intentionally a first-class surface so the real integration
// drops in without any redesign: replace the body with a sync panel that
// pushes recordHash + payload to NCB SIMS and reports back the SIMS ref.
export function SimsPlaceholder({ caseId }: { caseId?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">NCB SIMS Integration</span>
          <Badge className="uppercase">Placeholder</Badge>
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {caseId
          ? `When connected, ${caseId}'s record hash and classification payload will sync to NCB SIMS from here, and the returned SIMS reference will appear on this card.`
          : "When connected, this panel will show SIMS sync state, pending queues and the last push per case."}
      </p>
    </div>
  );
}
