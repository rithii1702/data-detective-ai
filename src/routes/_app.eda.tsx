import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { PageHeader, SectionCard } from "@/components/detective/shared";

export const Route = createFileRoute("/_app/eda")({
  component: EDAPage,
});

const COLORS = ["#3b82f6", "#22c55e", "#f97316", "#ef4444", "#8b5cf6"];

function EDAPage() {
  const [eda, setEda] = useState<any>(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/eda")
      .then((res) => res.json())
      .then((data) => setEda(data))
      .catch(console.error);
  }, []);

  if (!eda) {
    return <div className="p-8 text-center">Loading EDA...</div>;
  }

  const numericColumn = eda.numericColumns[0];

  const chartData = numericColumn
    ? eda.data.map((row: any) => ({
        name: row[eda.columns[0]],
        value: Number(row[numericColumn]),
      }))
    : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="EDA Visualizations"
        subtitle="Explore your dataset visually"
      />

      <div className="grid grid-cols-3 gap-6">
        <SectionCard>
          <h3 className="font-semibold">Rows</h3>
          <p className="mt-2 text-4xl font-bold">{eda.totalRows}</p>
        </SectionCard>

        <SectionCard>
          <h3 className="font-semibold">Columns</h3>
          <p className="mt-2 text-4xl font-bold">{eda.columns.length}</p>
        </SectionCard>

        <SectionCard>
          <h3 className="font-semibold">Numeric Columns</h3>
          <p className="mt-2 text-4xl font-bold">
            {eda.numericColumns.length}
          </p>
        </SectionCard>
      </div>

      <SectionCard title="Bar Chart">
        <div style={{ width: "100%", height: 350 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard title="Pie Chart">
        <div style={{ width: "100%", height: 350 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                outerRadius={120}
                label
              >
                {chartData.map((_: any, index: number) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard title="Line Chart">
        <div style={{ width: "100%", height: 350 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  );
}

export default EDAPage;