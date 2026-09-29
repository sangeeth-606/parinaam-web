import { CaseTable, type Facets } from "@/components/cases/case-table";
import { PresumptiveBanner } from "@/components/presumptive-banner";
import { getSession } from "@/lib/session";
import { recordScope, type Role } from "@/lib/roles";
import { distinctFacets } from "@/lib/store";

export default async function CaseLogPage() {
  const session = (await getSession())!;
  // RBAC: facets are scope-derived so field officer dropdowns only offer
  // values present in their own corpus.
  const { districts, departments, officers, kitTypes } = await distinctFacets(session);
  const facets: Facets = { districts, departments, officers, kitTypes };
  const ownOnly = recordScope(session.role as Role) === "own";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Case Log</h1>
        <p className="text-sm text-muted-foreground">
          {ownOnly
            ? "Your submitted NDPS field test records — search, filters and exports are scoped to your own records only. Click a row to open the read-only case file."
            : "All submitted NDPS field test records. Click a row to open the read-only case file."}
        </p>
      </div>
      <PresumptiveBanner compact />
      <CaseTable facets={facets} />
    </div>
  );
}
