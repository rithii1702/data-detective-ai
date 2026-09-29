import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, TrendingUp, ScatterChart as ScatterIcon } from "lucide-react";

export type ChartType = "bar" | "line" | "pie" | "area" | "scatter";

export interface ChartDataPayload {
  type: ChartType;
  title?: string;
  xKey?: string;
  yKey?: string;
  data: Array<Record<string, any>>;
  description?: string;
}

export interface AIChartProps {
  chart: ChartDataPayload;
  className?: string;
}

const PALETTE = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#14b8a6", // Teal
];

// Helper to format large numbers compactly (e.g. 240,000 -> 240k)
function formatCompactNumber(value: any): string {
  const num = Number(value);
  if (isNaN(num)) return String(value ?? "");
  if (Math.abs(num) >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (Math.abs(num) >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return num.toLocaleString();
}

// Truncate long strings for axis labels
function truncateLabel(str: any, maxLen = 10): string {
  const s = String(str ?? "");
  return s.length > maxLen ? s.slice(0, maxLen - 1) + "…" : s;
}

export default function AIChart({ chart, className = "" }: AIChartProps) {
  if (!chart || !Array.isArray(chart.data) || chart.data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 p-3 text-center text-xs text-muted-foreground">
        No chart data available to display.
      </div>
    );
  }

  const { type = "bar", title, data } = chart;

  // Infer keys if not explicitly provided
  const sample = data[0] || {};
  const keys = Object.keys(sample);

  // xKey is usually the first string or non-numeric key, or the provided xKey
  let xKey = chart.xKey;
  if (!xKey || !keys.includes(xKey)) {
    xKey =
      keys.find((k) => typeof sample[k] === "string") ||
      keys.find((k) => k !== "value" && k !== "sales" && k !== "revenue") ||
      keys[0] ||
      "name";
  }

  // yKey is usually the first numeric key or provided yKey
  let yKey = chart.yKey;
  if (!yKey || !keys.includes(yKey)) {
    yKey =
      keys.find((k) => typeof sample[k] === "number") ||
      keys.find((k) => k === "value" || k === "sales" || k === "revenue") ||
      keys[1] ||
      "value";
  }

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0];
      const val = p.value;
      const formattedVal = typeof val === "number" ? val.toLocaleString() : val;
      const itemName = p.payload[xKey] ?? label ?? p.name;

      return (
        <div className="rounded-lg border bg-popover/95 px-2.5 py-1.5 text-xs text-popover-foreground shadow-md backdrop-blur-sm">
          <div className="font-semibold text-foreground">{itemName}</div>
          <div className="flex items-center gap-1 text-primary">
            <span className="capitalize">{yKey.replace(/_/g, " ")}:</span>
            <span className="font-mono font-bold">{formattedVal}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Get icon for chart type
  const getIcon = () => {
    switch (type) {
      case "line":
        return <LineChartIcon className="h-3.5 w-3.5 text-primary" />;
      case "pie":
        return <PieChartIcon className="h-3.5 w-3.5 text-primary" />;
      case "area":
        return <TrendingUp className="h-3.5 w-3.5 text-primary" />;
      case "scatter":
        return <ScatterIcon className="h-3.5 w-3.5 text-primary" />;
      case "bar":
      default:
        return <BarChart3 className="h-3.5 w-3.5 text-primary" />;
    }
  };

  return (
    <div
      className={`mt-2 flex flex-col rounded-xl border border-border/80 bg-card p-3 shadow-sm ${className}`}
      style={{ maxWidth: "100%", overflow: "hidden" }}
    >
      {/* Chart Title Header */}
      {title && (
        <div className="mb-2 flex items-center justify-between border-b border-border/50 pb-1.5">
          <div className="flex items-center gap-1.5">
            {getIcon()}
            <span className="text-xs font-semibold text-foreground tracking-tight">
              {title}
            </span>
          </div>
          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
            {type}
          </span>
        </div>
      )}

      {/* Chart Container */}
      <div className="h-[210px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          {type === "bar" ? (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
              <XAxis
                dataKey={xKey}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                tick={{ fontSize: 10, fill: "currentColor", opacity: 0.8 }}
                tickFormatter={(val) => truncateLabel(val, 9)}
                interval={0}
                angle={data.length > 4 ? -25 : 0}
                textAnchor={data.length > 4 ? "end" : "middle"}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 9, fill: "currentColor", opacity: 0.7 }}
                tickFormatter={formatCompactNumber}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey={yKey}
                radius={[4, 4, 0, 0]}
                fill="#3b82f6"
              >
                {data.map((_, index) => (
                  <Cell
                    key={`bar-cell-${index}`}
                    fill={PALETTE[index % PALETTE.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : type === "line" ? (
            <LineChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
              <XAxis
                dataKey={xKey}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                tick={{ fontSize: 10, fill: "currentColor", opacity: 0.8 }}
                tickFormatter={(val) => truncateLabel(val, 9)}
                interval={0}
                angle={data.length > 4 ? -25 : 0}
                textAnchor={data.length > 4 ? "end" : "middle"}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 9, fill: "currentColor", opacity: 0.7 }}
                tickFormatter={formatCompactNumber}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey={yKey}
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#3b82f6" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          ) : type === "area" ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
              <defs>
                <linearGradient id="detectiveAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
              <XAxis
                dataKey={xKey}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                tick={{ fontSize: 10, fill: "currentColor", opacity: 0.8 }}
                tickFormatter={(val) => truncateLabel(val, 9)}
                interval={0}
                angle={data.length > 4 ? -25 : 0}
                textAnchor={data.length > 4 ? "end" : "middle"}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 9, fill: "currentColor", opacity: 0.7 }}
                tickFormatter={formatCompactNumber}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={yKey}
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#detectiveAreaGradient)"
              />
            </AreaChart>
          ) : type === "pie" ? (
            <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={data}
                dataKey={yKey}
                nameKey={xKey}
                cx="50%"
                cy="48%"
                innerRadius={36}
                outerRadius={65}
                paddingAngle={3}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`pie-cell-${index}`}
                    fill={PALETTE[index % PALETTE.length]}
                  />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                height={28}
                iconSize={8}
                formatter={(val) => (
                  <span className="text-[10px] text-foreground font-medium">
                    {truncateLabel(val, 10)}
                  </span>
                )}
              />
            </PieChart>
          ) : type === "scatter" ? (
            <ScatterChart margin={{ top: 10, right: 10, left: -15, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey={xKey}
                name={xKey}
                tickLine={false}
                tick={{ fontSize: 9 }}
                tickFormatter={formatCompactNumber}
              />
              <YAxis
                dataKey={yKey}
                name={yKey}
                tickLine={false}
                tick={{ fontSize: 9 }}
                tickFormatter={formatCompactNumber}
              />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<CustomTooltip />} />
              <Scatter name={title || "Data"} data={data} fill="#3b82f6" />
            </ScatterChart>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Unsupported chart type: {type}
            </div>
          )}
        </ResponsiveContainer>
      </div>

      {/* Optional description footer */}
      {chart.description && (
        <p className="mt-1 text-[11px] text-muted-foreground italic">
          {chart.description}
        </p>
      )}
    </div>
  );
}
