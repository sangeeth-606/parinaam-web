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
 * Parinaam Design Law:
 *  - Positive = Emerald (#15803D)
 *  - Negative = Slate (#64748B) (absence, never red)
 *  - Warning / Inconclusive = Amber (#D97706)
 *  - Total = Royal Blue (#2563EB)
 */
const OUTCOME_COLORS: Record<string, string> = {
  CONSISTENT_WITH_REAGENT_POSITIVE: "#15803D",
  CONSISTENT_WITH_REAGENT_NEGATIVE: "#64748B",
  INCONCLUSIVE: "#D97706",
  // Legacy aliases
  positive: "#15803D",
  negative: "#64748B",
  inconclusive: "#D97706",
};

export function outcomeColor(outcome: string | null | undefined): string {
  return OUTCOME_COLORS[(outcome ?? "").toUpperCase()] ?? "#64748B";
}

export function TrendChart({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="totalFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} stroke="#64748b" />
        <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} stroke="#64748b" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            borderColor: "#e2e8f0",
            borderRadius: "0.5rem",
            fontSize: "12px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: "8px" }} />
        <Area
          type="monotone"
          dataKey="positive"
          stackId="1"
          stroke={OUTCOME_COLORS.CONSISTENT_WITH_REAGENT_POSITIVE}
          fill={OUTCOME_COLORS.CONSISTENT_WITH_REAGENT_POSITIVE}
          fillOpacity={0.65}
          name="Reagent positive"
        />
        <Area
          type="monotone"
          dataKey="inconclusive"
          stackId="1"
          stroke={OUTCOME_COLORS.INCONCLUSIVE}
          fill={OUTCOME_COLORS.INCONCLUSIVE}
          fillOpacity={0.65}
          name="Inconclusive"
        />
        <Area
          type="monotone"
          dataKey="negative"
          stackId="1"
          stroke={OUTCOME_COLORS.CONSISTENT_WITH_REAGENT_NEGATIVE}
          fill={OUTCOME_COLORS.CONSISTENT_WITH_REAGENT_NEGATIVE}
          fillOpacity={0.65}
          name="Reagent negative"
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#2563eb"
          strokeWidth={2}
          fill="url(#totalFill)"
          name="All cases"
          fillOpacity={1}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function OutcomePie({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={outcomeColor(entry.name)} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            borderColor: "#e2e8f0",
            borderRadius: "0.5rem",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: "4px" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function DistrictBar({ data }: { data: { district: string; cases: number; positive: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} stroke="#64748b" />
        <YAxis type="category" dataKey="district" width={110} fontSize={11} tickLine={false} axisLine={false} stroke="#64748b" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            borderColor: "#e2e8f0",
            borderRadius: "0.5rem",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="cases" name="All cases" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={12} />
        <Bar dataKey="positive" name="Positive" fill="#15803d" radius={[0, 4, 4, 0]} barSize={12} />
      </BarChart>
    </ResponsiveContainer>
  );
}
