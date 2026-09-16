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

const OUTCOME_COLORS: Record<string, string> = {
  positive: "#dc2626",
  negative: "#059669",
  inconclusive: "#d97706",
};

export function TrendChart({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="totalFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e3a8a" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Area type="monotone" dataKey="positive" stackId="1" stroke={OUTCOME_COLORS.positive} fill={OUTCOME_COLORS.positive} fillOpacity={0.55} name="Positive" />
        <Area type="monotone" dataKey="inconclusive" stackId="1" stroke={OUTCOME_COLORS.inconclusive} fill={OUTCOME_COLORS.inconclusive} fillOpacity={0.55} name="Inconclusive" />
        <Area type="monotone" dataKey="negative" stackId="1" stroke={OUTCOME_COLORS.negative} fill={OUTCOME_COLORS.negative} fillOpacity={0.55} name="Negative" />
        <Area type="monotone" dataKey="total" stroke="#1e3a8a" strokeWidth={2} fill="url(#totalFill)" name="All cases" fillOpacity={0} />
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
            <Cell key={entry.name} fill={OUTCOME_COLORS[entry.name.toLowerCase()] ?? "#94a3b8"} />
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
        <Bar dataKey="cases" name="All cases" fill="#1e3a8a" radius={[0, 4, 4, 0]} barSize={12} />
        <Bar dataKey="positive" name="Positive" fill="#dc2626" radius={[0, 4, 4, 0]} barSize={12} />
      </BarChart>
    </ResponsiveContainer>
  );
}
