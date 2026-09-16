"use client";

import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { OutcomeBadge, StatusBadge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Paginated } from "@/lib/types";
import type { EnrichedCase } from "@/lib/types";
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
        header: "Case ID",
        cell: (info) => (
          <span className="font-mono text-xs font-medium">{info.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Recorded",
        cell: (info) => (
          <span className="whitespace-nowrap text-xs">{formatDateTime(info.getValue<string>())}</span>
        ),
      },
      { accessorKey: "district", header: "District" },
      { accessorKey: "operatorName", header: "Officer" },
      { accessorKey: "department", header: "Department" },
      { id: "kitType", accessorFn: (row) => row.kit.kitType, header: "Kit Type" },
      {
        id: "batchNo",
        accessorFn: (row) => row.kit.batchNo,
        header: "Batch",
        cell: (info) => <span className="font-mono text-xs">{info.getValue<string>()}</span>,
      },
      {
        id: "outcome",
        accessorFn: (row) => row.classification.outcome,
        header: "Outcome",
        cell: (info) => (
          <OutcomeBadge outcome={info.getValue<EnrichedCase["classification"]["outcome"]>()} />
        ),
      },
      {
        id: "confidence",
        accessorFn: (row) => row.classification.confidence,
        header: "Confidence",
        cell: (info) => (
          <span className="tabular-nums text-xs">{formatConfidence(info.getValue<number>())}</span>
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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-2 gap-3 rounded-lg border bg-card p-4 md:grid-cols-4 xl:grid-cols-6">
        <div className="col-span-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="ID, officer, batch, panchnama…"
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={filters.status} onChange={(e) => setFilter("status", e.target.value)} className="mt-1">
            <option value="all">All</option>
            <option value="reported">Reported</option>
            <option value="under_review">Under Review</option>
            <option value="reviewed">Reviewed</option>
            <option value="escalated">Escalated</option>
          </Select>
        </div>
        <div>
          <Label>Outcome</Label>
          <Select value={filters.outcome} onChange={(e) => setFilter("outcome", e.target.value)} className="mt-1">
            <option value="all">All</option>
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
            <option value="inconclusive">Inconclusive</option>
          </Select>
        </div>
        <div>
          <Label>District</Label>
          <Select value={filters.district} onChange={(e) => setFilter("district", e.target.value)} className="mt-1">
            <option value="all">All</option>
            {facets.districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </div>
        <div>
          <Label>Department</Label>
          <Select value={filters.department} onChange={(e) => setFilter("department", e.target.value)} className="mt-1">
            <option value="all">All</option>
            {facets.departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </div>
        <div>
          <Label>Officer</Label>
          <Select value={filters.officer} onChange={(e) => setFilter("officer", e.target.value)} className="mt-1">
            <option value="all">All</option>
            {facets.officers.map((o) => <option key={o} value={o}>{o}</option>)}
          </Select>
        </div>
        <div>
          <Label>Kit Type</Label>
          <Select value={filters.kitType} onChange={(e) => setFilter("kitType", e.target.value)} className="mt-1">
            <option value="all">All</option>
            {facets.kitTypes.map((k) => <option key={k} value={k}>{k}</option>)}
          </Select>
        </div>
        <div>
          <Label>Batch No</Label>
          <Input placeholder="BATCH-…" value={filters.batchNo} onChange={(e) => setFilter("batchNo", e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>From</Label>
          <Input type="date" value={filters.from} onChange={(e) => setFilter("from", e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>To</Label>
          <Input type="date" value={filters.to} onChange={(e) => setFilter("to", e.target.value)} className="mt-1" />
        </div>
        <div className="col-span-2 flex items-end justify-end">
          <Button variant="outline" size="sm" onClick={() => { setFilters(EMPTY_FILTERS); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
            Reset filters
          </Button>
        </div>
      </div>

      {/* Exports for the filtered set */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {loading ? "Loading…" : `${data?.total ?? 0} case(s) match the current filters`}
        </div>
        <div className="flex items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Download className="h-3.5 w-3.5" /> Export filtered set:
          </span>
          {(["xlsx", "csv", "docx"] as const).map((ext) => (
            <a key={ext} href={`/api/export/${ext}?${queryString}`}>
              <Button variant="outline" size="sm">{ext.toUpperCase()}</Button>
            </a>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="cursor-pointer select-none"
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
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer"
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
            ))}
            {!loading && table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No cases match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Page {pagination.pageIndex + 1} of{" "}
          {data ? Math.max(1, Math.ceil(data.total / pagination.pageSize)) : 1}
        </div>
        <div className="flex items-center gap-2">
          <Select
            className="w-28"
            value={String(pagination.pageSize)}
            onChange={(e) => setPagination({ pageIndex: 0, pageSize: Number(e.target.value) })}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </Select>
          <Button variant="outline" size="sm" disabled={pagination.pageIndex === 0} onClick={() => table.previousPage()}>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
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




