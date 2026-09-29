import { createFileRoute, Link } from "@tanstack/react-router";
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
  CartesianGrid,
} from "recharts";
import { UploadCloud, Sparkles } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/detective/shared";
import { Button } from "@/components/ui/button";
import {
  getActiveDataset,
  loadSampleDataset,
} from "@/lib/dataset-store";
import { getApiBaseUrl } from "@/lib/api-config";

export const Route = createFileRoute("/_app/eda")({
  component: EDAPage,
});

const COLORS = ["#3b82f6", "#22c55e", "#f97316", "#ef4444", "#8b5cf6", "#06b6d4"];

function EDAPage() {
  const [eda, setEda] = useState<any>(null);

  useEffect(() => {
    // 1. Check local active dataset
    const active = getActiveDataset();
    if (active && active.data?.length > 0) {
      setEda({
        success: true,
        fileName: active.fileName,
        totalRows: active.totalRows,
        columns: active.columns,
        numericColumns: active.numericColumns,
        categoricalColumns: active.categoricalColumns,
        data: active.data,
      });
      return;
    }

    // 2. Fallback to backend API
    const apiUrl = getApiBaseUrl();
    if (apiUrl) {
      fetch(`${apiUrl}/api/eda`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success) {
            setEda(data);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleTrySample = () => {
    const sample = loadSampleDataset();
    setEda({
      success: true,
      fileName: sample.fileName,
      totalRows: sample.totalRows,
      columns: sample.columns,
      numericColumns: sample.numericColumns,
      categoricalColumns: sample.categoricalColumns,
      data: sample.data,
    });
  };

  if (!eda || !eda.data || eda.data.length === 0) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="EDA Visualizations"
          subtitle="Explore your dataset visually with automated exploratory data analysis"
        />

        <SectionCard>
          <div className="py-16 text-center max-w-md mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <UploadCloud className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold">No Dataset Available</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Upload a CSV dataset to generate automatic exploratory charts, numeric distributions, and categorical breakdowns.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild>
                <Link to="/upload">Upload Dataset</Link>
              </Button>
              <Button variant="outline" onClick={handleTrySample} className="gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Try Sample Dataset
              </Button>
            </div>
          </div>
        </SectionCard>
      </div>
    );
  }

  const numericColumn = eda.numericColumns?.[0];
  const labelColumn = eda.columns?.[0];

  const chartData = numericColumn
    ? eda.data.slice(0, 15).map((row: any, i: number) => ({
        name: row[labelColumn] ? String(row[labelColumn]).slice(0, 12) : `#${i + 1}`,
        value: Number(row[numericColumn]) || 0,
      }))
    : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="EDA Visualizations"
        subtitle={`Exploratory analysis for ${eda.fileName || "Active Dataset"}`}
        actions={
          <Button asChild size="sm">
            <Link to="/upload">Upload Another</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <SectionCard>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Rows
          </h3>
          <p className="mt-2 text-3xl font-bold">{eda.totalRows.toLocaleString()}</p>
        </SectionCard>

        <SectionCard>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Columns
          </h3>
          <p className="mt-2 text-3xl font-bold">{eda.columns.length}</p>
        </SectionCard>

        <SectionCard>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Numeric Columns
          </h3>
          <p className="mt-2 text-3xl font-bold">
            {eda.numericColumns ? eda.numericColumns.length : 0}
          </p>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title={`Distribution Bar Chart (${numericColumn || "Metric"})`}
          description={`Sample distribution across ${labelColumn || "records"}`}
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={11} stroke="#888888" tickLine={false} />
                <YAxis fontSize={11} stroke="#888888" tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#8B5E3C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Composition Pie Chart"
          description="Relative breakdown by category"
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.slice(0, 6)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label
                >
                  {chartData.slice(0, 6).map((_: any, index: number) => (
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
      </div>

      <SectionCard
        title={`Trend Overview (${numericColumn || "Values"})`}
        description="Sequential observation line curve"
      >
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" fontSize={11} stroke="#888888" tickLine={false} />
              <YAxis fontSize={11} stroke="#888888" tickLine={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8B5E3C"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  );
}

export default EDAPage;