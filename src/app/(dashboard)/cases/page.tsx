import { CaseTable, type Facets } from "@/components/cases/case-table";
import { distinctFacets } from "@/lib/store";

export default async function CaseLogPage() {
  const { districts, departments, officers, kitTypes } = distinctFacets();
  const facets: Facets = { districts, departments, officers, kitTypes };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Case Log</h1>
        <p className="text-sm text-muted-foreground">
          All submitted NDPS field test records. Click a row to open the read-only case file.
        </p>
      </div>
      <CaseTable facets={facets} />
    </div>
  );
}
