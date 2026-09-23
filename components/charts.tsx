"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #e3dacd",
  fontSize: 12,
};

export function StackedWeekChart({
  data,
}: {
  data: { day: string; Work: number; Life: number; Health: number; Sleep: number; Untracked: number }[];
}) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="#e3dacd" />
          <XAxis dataKey="day" tick={{ fill: "#6e665d", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#6e665d", fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="Work" stackId="day" fill="#1f7a62" />
          <Bar dataKey="Life" stackId="day" fill="#e15a2a" />
          <Bar dataKey="Health" stackId="day" fill="#2b6cb0" />
          <Bar dataKey="Sleep" stackId="day" fill="#6d4ea3" />
          <Bar dataKey="Untracked" stackId="day" fill="#b7ad9f" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SplitPie({ data }: { data: { name: string; hours: number; fill: string }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted">Nothing logged in this range yet.</p>;
  }
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="hours" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={2} stroke="#fffcf7">
            {data.map((slice) => (
              <Cell key={slice.name} fill={slice.fill} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GoalCompareChart({
  data,
}: {
  data: { name: string; Actual: number; Goal: number }[];
}) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid vertical={false} stroke="#e3dacd" />
          <XAxis dataKey="name" tick={{ fill: "#6e665d", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis unit="%" tick={{ fill: "#6e665d", fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Bar dataKey="Actual" fill="#1c1916" radius={[6, 6, 0, 0]} />
          <Bar dataKey="Goal" fill="#e8e0d4" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ScoreTrend({
  data,
}: {
  data: { day: string; Motivation: number | null; Sleep: number | null; Work: number | null; Life: number | null; Health: number | null }[];
}) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid vertical={false} stroke="#e3dacd" />
          <XAxis dataKey="day" tick={{ fill: "#6e665d", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 10]} tick={{ fill: "#6e665d", fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Line type="monotone" dataKey="Motivation" stroke="#1c1916" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="Sleep" stroke="#6d4ea3" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="Work" stroke="#1f7a62" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="Life" stroke="#e15a2a" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="Health" stroke="#2b6cb0" strokeWidth={2} dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
