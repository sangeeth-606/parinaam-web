"use client";

import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Search, Filter, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { OutcomeBadge, StatusBadge, IntegrityBadge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Paginated, EnrichedCase } from "@/lib/types";
import { formatConfidence, formatDateTime } from "@/lib/utils";

export interface Facets {
  districts: string[];
  departments: string[];
  officers: string[];
  kitTypes: string[];
}

interface Filters {
  search: string;
  status: string;
  outcome: string;
  district: string;
  department: string;
  officer: string;
  kitType: string;
  batchNo: string;
  from: string;
  to: string;
}

const EMPTY_FILTERS: Filters = {
  search: "",
  status: "all",
  outcome: "all",
  district: "all",
  department: "all",
  officer: "all",
  kitType: "all",
  batchNo: "",
  from: "",
  to: "",
};

function toQueryString(f: Filters, page: number, pageSize: number, sort: SortingState): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(f)) {
    if (value && value !== "all") params.set(key, value);
  }
  params.set("page", String(page + 1));
  params.set("pageSize", String(pageSize));
  const first = sort[0];
  if (first) {
    params.set("sort", first.id);
    params.set("dir", first.desc ? "desc" : "asc");
  }
  return params.toString();
}

export function CaseTable({ facets }: { facets: Facets }) {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const [data, setData] = useState<Paginated<EnrichedCase> | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(t);
  }, [filters.search]);

  const queryString = useMemo(
    () =>
      toQueryString(
        { ...filters, search: debouncedSearch },
        pagination.pageIndex,
        pagination.pageSize,
        sorting
      ),
    [filters, debouncedSearch, pagination, sorting]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/cases?${queryString}`)
      .then((r) => r.json())
      .then((json: Paginated<EnrichedCase>) => {
        if (!cancelled) setData(json);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [queryString]);

  const setFilter = useCallback((key: keyof Filters, value: string) => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    setFilters((f) => ({ ...f, [key]: value }));
  }, []);

  const columns = useMemo<ColumnDef<EnrichedCase>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Case Ref",
        cell: (info) => (
          <div className="font-mono text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            {info.getValue<string>()}
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Recorded (IST)",
        cell: (info) => (
          <span className="whitespace-nowrap font-mono text-xs text-slate-500">
            {formatDateTime(info.getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: "district",
        header: "District",
        cell: (info) => (
          <span className="text-xs font-medium text-slate-700">{info.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "operatorName",
        header: "Officer",
        cell: (info) => (
          <span className="text-xs font-medium text-slate-800">{info.getValue<string>()}</span>
        ),
      },
      {
        id: "kitType",
        accessorFn: (row) => row.kit.kitType,
        header: "Kit / Reagent",
        cell: (info) => (
          <span className="text-xs font-medium text-slate-600">{info.getValue<string>()}</span>
        ),
      },
      {
        id: "outcome",
        accessorFn: (row) => row.classification.outcome,
        header: "Assay Outcome",
        cell: (info) => (
          <OutcomeBadge outcome={info.getValue<EnrichedCase["classification"]["outcome"]>()} />
        ),
      },
      {
        id: "confidence",
        accessorFn: (row) => row.classification.confidence,
        header: "CIE Match",
        cell: (info) => (
          <span className="tabular-nums font-mono text-xs text-slate-600 font-medium">
            {formatConfidence(info.getValue<number>())}
          </span>
        ),
      },
      {
        id: "integrity",
        accessorFn: (row) => row.deviceAttestation,
        header: "Integrity",
        cell: (info) => (
          <IntegrityBadge deviceAttestation={info.getValue<string | null>()} />
        ),
      },
      {
        accessorKey: "caseStatus",
        header: "Status",
        cell: (info) => <StatusBadge status={info.getValue<EnrichedCase["caseStatus"]>()} />,
      },
    ],
    []
  );

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: data ? Math.max(1, Math.ceil(data.total / pagination.pageSize)) : 1,
    rowCount: data?.total ?? 0,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
  });

  // Quick Filter Pill definitions matching mobile app
  const currentOutcome = filters.outcome;
  const currentStatus = filters.status;

  return (
    <div className="space-y-4">
      {/* Mobile-Style Quick Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setFilter("outcome", "all");
              setFilter("status", "all");
            }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
              currentOutcome === "all" && currentStatus === "all"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            ALL TESTS
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter("outcome", "positive");
              setFilter("status", "all");
            }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
              currentOutcome === "positive"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            POSITIVE
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter("outcome", "inconclusive");
              setFilter("status", "all");
            }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
              currentOutcome === "inconclusive"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
            }`}
          >
            INCONCLUSIVE
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter("status", "under_review");
              setFilter("outcome", "all");
            }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
              currentStatus === "under_review"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            UNDER REVIEW
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter("status", "reviewed");
              setFilter("outcome", "all");
            }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
              currentStatus === "reviewed"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            REVIEWED
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="gap-1.5 text-xs font-semibold"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>{showAdvanced ? "Hide Filters" : "More Filters"}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            className="text-xs text-slate-500 hover:text-slate-800 gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </Button>
        </div>
      </div>

      {/* Search & Advanced Filters Panel */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            id="search"
            placeholder="Search by Case ID, Officer Name, Batch, Panchnama reference…"
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 md:grid-cols-4 xl:grid-cols-6">
            <div>
              <Label>District</Label>
              <Select value={filters.district} onChange={(e) => setFilter("district", e.target.value)} className="mt-1">
                <option value="all">All Districts</option>
                {facets.districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </div>
            <div>
              <Label>Department</Label>
              <Select value={filters.department} onChange={(e) => setFilter("department", e.target.value)} className="mt-1">
                <option value="all">All Departments</option>
                {facets.departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </div>
            <div>
              <Label>Officer</Label>
              <Select value={filters.officer} onChange={(e) => setFilter("officer", e.target.value)} className="mt-1">
                <option value="all">All Officers</option>
                {facets.officers.map((o) => <option key={o} value={o}>{o}</option>)}
              </Select>
            </div>
            <div>
              <Label>Kit Type</Label>
              <Select value={filters.kitType} onChange={(e) => setFilter("kitType", e.target.value)} className="mt-1">
                <option value="all">All Kits</option>
                {facets.kitTypes.map((k) => <option key={k} value={k}>{k}</option>)}
              </Select>
            </div>
            <div>
              <Label>From Date</Label>
              <Input type="date" value={filters.from} onChange={(e) => setFilter("from", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>To Date</Label>
              <Input type="date" value={filters.to} onChange={(e) => setFilter("to", e.target.value)} className="mt-1" />
            </div>
          </div>
        )}
      </div>

      {/* Table Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {loading ? "Refreshing ledger…" : `${data?.total ?? 0} ASSAYS MATCHING LEDGER QUERY`}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <Download className="h-3.5 w-3.5 text-slate-400" /> Export:
          </span>
          <a href={`/api/export/csv?${queryString}`}>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">CSV</Button>
          </a>
          <a href={`/api/export/xlsx?${queryString}`}>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">XLSX</Button>
          </a>
          <a href={`/api/export/docx?${queryString}`}>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">DOCX</Button>
          </a>
        </div>
      </div>

      {/* Evidentiary Table with left indicator accents */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-slate-50/90">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="cursor-pointer select-none text-slate-600 font-bold"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {String(header.column.columnDef.header ?? "")}
                    {{ asc: " ↑", desc: " ↓" }[header.column.getIsSorted() as string] ?? ""}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              const outcome = row.original.classification.outcome;
              const isPos = outcome === "CONSISTENT_WITH_REAGENT_POSITIVE";
              const isNeg = outcome === "CONSISTENT_WITH_REAGENT_NEGATIVE";
              const borderLeftClass = isPos
                ? "border-l-4 border-l-emerald-600"
                : isNeg
                ? "border-l-4 border-l-slate-400"
                : "border-l-4 border-l-amber-500";

              return (
                <TableRow
                  key={row.id}
                  className={`cursor-pointer transition-colors group hover:bg-slate-50/80 ${borderLeftClass}`}
                  onClick={() => router.push(`/cases/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {typeof cell.column.columnDef.cell === "function"
                        ? cell.column.columnDef.cell(cell.getContext())
                        : String(cell.getValue() ?? "—")}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
            {!loading && table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-slate-400 text-sm">
                  No cases found matching these search criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Bar */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500">
        <div>
          Showing Page <strong className="font-semibold text-slate-700">{pagination.pageIndex + 1}</strong> of{" "}
          <strong className="font-semibold text-slate-700">{data ? Math.max(1, Math.ceil(data.total / pagination.pageSize)) : 1}</strong>
        </div>
        <div className="flex items-center gap-2">
          <Select
            className="w-28 h-8 text-xs"
            value={String(pagination.pageSize)}
            onChange={(e) => setPagination({ pageIndex: 0, pageSize: Number(e.target.value) })}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>{n} per page</option>
            ))}
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={pagination.pageIndex === 0}
            onClick={() => table.previousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={!data || (pagination.pageIndex + 1) * pagination.pageSize >= data.total}
            onClick={() => table.nextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
