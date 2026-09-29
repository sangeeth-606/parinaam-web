"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface DailyPoint {
  date: string;
  total: number;
  positive: number;
  negative: number;
  inconclusive: number;
}

/**
 * Trilevel reagent vocabulary → display colour. Keys are the canonical
 * UPPERCASE values the store emits; the lowercase aliases are retained only
 * for legacy rows. An unknown outcome must never be coloured as a result, so
 * lookups fall through to a neutral slate.
 */
const OUTCOME_COLORS: Record<string, string> = {
  CONSISTENT_WITH_REAGENT_POSITIVE: "#dc2626",
  CONSISTENT_WITH_REAGENT_NEGATIVE: "#059669",
  INCONCLUSIVE: "#d97706",
  // Legacy aliases
  positive: "#dc2626",
  negative: "#059669",
  inconclusive: "#d97706",
};

export function outcomeColor(outcome: string | null | undefined): string {
  return OUTCOME_COLORS[(outcome ?? "").toUpperCase()] ?? "#64748b";
}

export function TrendChart({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="totalFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d355e" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#0d355e" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Area type="monotone" dataKey="positive" stackId="1" stroke={OUTCOME_COLORS.CONSISTENT_WITH_REAGENT_POSITIVE} fill={OUTCOME_COLORS.CONSISTENT_WITH_REAGENT_POSITIVE} fillOpacity={0.55} name="Reagent positive" />
        <Area type="monotone" dataKey="inconclusive" stackId="1" stroke={OUTCOME_COLORS.INCONCLUSIVE} fill={OUTCOME_COLORS.INCONCLUSIVE} fillOpacity={0.55} name="Inconclusive" />
        <Area type="monotone" dataKey="negative" stackId="1" stroke={OUTCOME_COLORS.CONSISTENT_WITH_REAGENT_NEGATIVE} fill={OUTCOME_COLORS.CONSISTENT_WITH_REAGENT_NEGATIVE} fillOpacity={0.55} name="Reagent negative" />
        <Area type="monotone" dataKey="total" stroke="#0d355e" strokeWidth={2} fill="url(#totalFill)" name="All cases" fillOpacity={0} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function OutcomePie({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={outcomeColor(entry.name)} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function DistrictBar({ data }: { data: { district: string; cases: number; positive: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="district" width={110} fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="cases" name="All cases" fill="#0d355e" radius={[0, 4, 4, 0]} barSize={12} />
        <Bar dataKey="positive" name="Positive" fill="#dc2626" radius={[0, 4, 4, 0]} barSize={12} />
      </BarChart>
    </ResponsiveContainer>
  );
}
