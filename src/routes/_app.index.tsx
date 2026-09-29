import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Bar,
  BarChart,
  Line,
  LineChart,
} from "recharts";

import {
  ArrowUpRight,
  ArrowDownRight,
  Database,
  FileSearch,
  Lightbulb,
  Gauge,
  Plus,
  ArrowRight,
  Activity,
  UploadCloud,
  Sparkles,
  BarChart3,
  Brain,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  PageHeader,
  SectionCard,
  StatusPill,
} from "@/components/detective/shared";
import {
  getActiveDataset,
  loadSampleDataset,
  clearActiveDataset,
  parseFileToDataset,
  type DatasetMetricSummary,
} from "@/lib/dataset-store";
import { getApiBaseUrl } from "@/lib/api-config";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
  head: () => ({
    meta: [{ title: "Dashboard — Data Detective AI" }],
  }),
});

const icons = [
  Database,
  FileSearch,
  Lightbulb,
  Gauge,
];

function DashboardPage() {
  const [dataset, setDataset] = useState<DatasetMetricSummary | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with active dataset store and backend if available
  useEffect(() => {
    const loadState = () => {
      const active = getActiveDataset();
      if (active) {
        setDataset(active);
      } else {
        const apiUrl = getApiBaseUrl();
        if (apiUrl) {
          fetch(`${apiUrl}/api/eda`)
            .then((res) => res.json())
            .then((data) => {
              if (data.success && data.totalRows) {
                // Convert backend eda to dataset summary if needed
              }
            })
            .catch(() => {});
        }
      }
    };

    loadState();

    const handleDatasetChange = () => {
      setDataset(getActiveDataset());
    };

    window.addEventListener("ddai-dataset-changed", handleDatasetChange);
    return () => {
      window.removeEventListener("ddai-dataset-changed", handleDatasetChange);
    };
  }, []);

  const handleSampleClick = () => {
    const sample = loadSampleDataset();
    setDataset(sample);
  };

  const handleReset = () => {
    clearActiveDataset();
    setDataset(null);
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const parsed = await parseFileToDataset(file);
      setDataset(parsed);
      const apiUrl = getApiBaseUrl();
      if (apiUrl) {
        const formData = new FormData();
        formData.append("dataset", file);
        fetch(`${apiUrl}/api/upload`, {
          method: "POST",
          body: formData,
        }).catch(() => {});
      }
    } catch (err) {
      console.error("Failed to parse file:", err);
    } finally {
      setIsUploading(false);
    }
  };

  // -------------------------------------------------------------
  // EMPTY STATE (When no dataset has been uploaded or selected)
  // -------------------------------------------------------------
  if (!dataset) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 pb-12">
        {/* Hero Welcome Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card/90 to-primary/5 p-8 md:p-14 shadow-sm"
        >
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Data Detective AI • Workspace Ready</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Welcome to Data Detective AI
            </h1>

            <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
              Upload a CSV or Excel dataset to start exploring, analyzing, visualizing,
              and interacting with your data using our grounded RAG AI assistant.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button asChild size="lg" className="gap-2 shadow-sm font-semibold px-6">
                <Link to="/upload">
                  <UploadCloud className="h-5 w-5" />
                  Upload Dataset
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={handleSampleClick}
                className="gap-2 border-primary/20 hover:bg-primary/5 transition font-semibold"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                Try Sample Dataset
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Quick Drop Area */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-2xl border-2 border-dashed border-border/80 hover:border-primary/60 hover:bg-primary/5 p-8 text-center transition group bg-card/40"
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-105 transition">
            <UploadCloud className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">
            {isUploading ? "Processing Dataset..." : "Quick Upload: Drop CSV or Excel File Here"}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Supports CSV, XLSX, and XLS formats • Analyzed securely in your browser
          </p>
        </motion.div>

        {/* Feature Capabilities Preview (Educational / Informational) */}
        <div>
          <div className="mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Platform Capabilities
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card-soft p-5 border border-border/60">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Database className="h-5 w-5" />
              </div>
              <h4 className="mt-4 font-semibold text-foreground">Automated EDA</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Calculates row counts, column types, statistical distributions, and variance automatically upon upload.
              </p>
            </div>

            <div className="card-soft p-5 border border-border/60">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <Gauge className="h-5 w-5" />
              </div>
              <h4 className="mt-4 font-semibold text-foreground">Dataset Health Score</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Scans for missing values, duplicates, and format inconsistencies to generate an overall quality score.
              </p>
            </div>

            <div className="card-soft p-5 border border-border/60">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h4 className="mt-4 font-semibold text-foreground">Dynamic Visualizations</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Generates responsive categorical breakdowns and numeric trend lines customized to your dataset schema.
              </p>
            </div>

            <div className="card-soft p-5 border border-border/60">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600">
                <Brain className="h-5 w-5" />
              </div>
              <h4 className="mt-4 font-semibold text-foreground">RAG Detective AI</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Interact with your data through natural language inquiries, outlier detection, and actionable business insights.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // DYNAMIC POPULATED STATE (Calculated strictly from uploaded dataset)
  // -------------------------------------------------------------
  const kpis = [
    {
      label: "Total Rows",
      value: dataset.totalRows.toLocaleString(),
      subtext: `${dataset.numericColumns.length} numeric, ${dataset.categoricalColumns.length} categorical`,
      trend: "Analyzed",
      trendUp: true,
      spark: [4, 6, 8, 9, 10, 12],
    },
    {
      label: "Total Columns",
      value: dataset.columns.length,
      subtext: dataset.columns.slice(0, 2).join(", ") + (dataset.columns.length > 2 ? "..." : ""),
      trend: "Schema Ready",
      trendUp: true,
      spark: [3, 4, 5, 5, 6, 6],
    },
    {
      label: "Missing Values",
      value: dataset.missingValues.toLocaleString(),
      subtext: dataset.missingValues === 0 ? "100% complete cells" : "Action required",
      trend: dataset.missingValues === 0 ? "Clean" : "Nulls detected",
      trendUp: dataset.missingValues === 0,
      spark: [1, 1, 1, 1, 1, 1],
    },
    {
      label: "Duplicate Rows",
      value: dataset.duplicateRows.toLocaleString(),
      subtext: dataset.duplicateRows === 0 ? "Zero duplicates" : "Deduplication suggested",
      trend: dataset.duplicateRows === 0 ? "Unique" : "Duplicates found",
      trendUp: dataset.duplicateRows === 0,
      spark: [1, 1, 1, 1, 1, 1],
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Dynamic Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden card-soft p-6 md:p-8"
      >
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Dataset
              </span>
              <span className="text-xs text-muted-foreground">Uploaded {dataset.uploadedAt}</span>
            </div>

            <h2 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight">
              {dataset.fileName}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              Calculated live: {dataset.totalRows.toLocaleString()} records across {dataset.columns.length} columns.
              Explore charts, automated health metrics, and AI recommendations below.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="sm" className="gap-2">
              <Link to="/upload">
                <Plus className="h-4 w-4" />
                Upload New
              </Link>
            </Button>

            <Button variant="outline" size="sm" asChild className="gap-2">
              <Link to="/chat">
                <Brain className="h-4 w-4 text-primary" />
                Detective AI
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground hover:text-destructive gap-1"
              title="Reset dashboard and clear loaded dataset"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Dynamic KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => {
          const Icon = icons[i];
          const data = k.spark.map((v, x) => ({ x, v }));

          return (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-soft p-5"
            >
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>

                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                    k.trendUp
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-amber-500/10 text-amber-600"
                  }`}
                >
                  {k.trendUp ? (
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5" />
                  )}
                  {k.trend}
                </span>
              </div>

              <div className="mt-4 text-2xl font-bold tracking-tight">
                {k.value}
              </div>

              <div className="text-xs font-medium text-foreground">
                {k.label}
              </div>

              <div className="mt-1 text-[11px] text-muted-foreground truncate">
                {k.subtext}
              </div>

              <div className="mt-3 h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke="var(--color-primary)"
                      fill="var(--color-primary)"
                      fillOpacity={0.15}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Dynamic Charts Generated from Uploaded Columns */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Dynamic Metric Trend / Series Chart */}
        <SectionCard
          title={dataset.chartData.seriesTitle}
          description={dataset.chartData.seriesDescription}
          className="lg:col-span-2"
        >
          <div className="h-72">
            {dataset.chartData.seriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataset.chartData.seriesData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" stroke="#888888" fontSize={12} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#8B5E3C"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                  {dataset.chartData.seriesData[0]?.secondary !== undefined && (
                    <Line
                      type="monotone"
                      dataKey="secondary"
                      stroke="#D4A373"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                No numeric columns detected for continuous trend plotting.
              </div>
            )}
          </div>
        </SectionCard>

        {/* Dynamic Categorical Distribution Chart */}
        <SectionCard
          title={dataset.chartData.categoryTitle}
          description={dataset.chartData.categoryDescription}
        >
          <div className="h-72">
            {dataset.chartData.categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataset.chartData.categoryData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} />
                  <Tooltip />
                  <Bar
                    dataKey="value"
                    fill="#8B5E3C"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                No categorical breakdown available.
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Dataset Health + AI Recommendations */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Dataset Health"
          description="Quality & Integrity Overview"
        >
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm font-medium">
                <span>Calculated Health Score</span>
                <span
                  className={
                    dataset.healthScore >= 80
                      ? "text-emerald-600 font-bold"
                      : dataset.healthScore >= 60
                      ? "text-amber-600 font-bold"
                      : "text-red-600 font-bold"
                  }
                >
                  {dataset.healthScore}%
                </span>
              </div>

              <div className="mt-2 h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    dataset.healthScore >= 80
                      ? "bg-emerald-500"
                      : dataset.healthScore >= 60
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${dataset.healthScore}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border p-4 bg-card/60">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Missing Values
                </h4>
                <p className="mt-2 text-2xl font-bold">
                  {dataset.missingValues}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {dataset.missingValues === 0 ? "Zero null cells detected" : "Columns have empty entries"}
                </p>
              </div>

              <div className="rounded-xl border p-4 bg-card/60">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Duplicate Rows
                </h4>
                <p className="mt-2 text-2xl font-bold">
                  {dataset.duplicateRows}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {dataset.duplicateRows === 0 ? "All rows are unique" : "Duplicate records detected"}
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="AI Recommendations"
          description="Detective AI Insights"
        >
          <div className="space-y-3">
            {dataset.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm">
                {rec.type === "success" && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                )}
                {rec.type === "warning" && (
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                )}
                {rec.type === "info" && (
                  <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                )}
                <span className="text-foreground/90">{rec.text}</span>
              </div>
            ))}

            <Button
              asChild
              className="mt-4 w-full"
            >
              <Link to="/chat">
                Open Detective AI Chat
              </Link>
            </Button>
          </div>
        </SectionCard>
      </div>

      {/* Real Investigation / Dataset Registry */}
      <SectionCard
        title="Active Investigation"
        description="Current Analyzed Dataset"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground uppercase">
                <th className="py-3 text-left">Dataset File</th>
                <th className="text-left">Uploaded</th>
                <th className="text-left">Status</th>
                <th className="text-left">Quality Score</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-4 font-semibold text-foreground flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  {dataset.fileName}
                </td>
                <td className="text-muted-foreground">{dataset.uploadedAt}</td>
                <td>
                  <StatusPill status={dataset.healthScore >= 70 ? "Completed" : "Cleaning"} />
                </td>
                <td className="font-semibold">{dataset.healthScore}%</td>
                <td className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/explorer">Browse Rows →</Link>
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

export default DashboardPage;