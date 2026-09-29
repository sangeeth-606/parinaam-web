import { CaseTable, type Facets } from "@/components/cases/case-table";
import { PresumptiveBanner, StatutoryFootnote } from "@/components/presumptive-banner";
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
    <div className="space-y-6">
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Case Log &amp; Assay Register</h1>
        <p className="text-sm text-slate-500 mt-1">
          {ownOnly
            ? "Your submitted NDPS field test records — search, filter, and export scoped to your registered officer identity."
            : "All submitted NDPS field test records across the zonal jurisdiction. Click any entry to inspect the full evidentiary assay file."}
        </p>
      </div>

      <PresumptiveBanner compact />

      <CaseTable facets={facets} />

      <StatutoryFootnote />
    </div>
  );
}
