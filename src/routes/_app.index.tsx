import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
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
  Eye,
  ArrowRight,
  Activity,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  PageHeader,
  SectionCard,
  StatusPill,
} from "@/components/detective/shared";

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
  const [dashboard, setDashboard] = useState({
    rows: 0,
    columns: 0,
    missing: 0,
    duplicates: 0,
  });

  useEffect(() => {
    fetch("http://localhost:5000/api/eda")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDashboard({
            rows: data.totalRows || 0,
            columns: data.columns?.length || 0,
            missing: data.missingValues || 0,
            duplicates: data.duplicateRows || 0,
          });
        }
      })
      .catch(console.error);
  }, []);

  const kpis = [
    {
      label: "Rows",
      value: dashboard.rows,
      trend: "+0%",
      trendUp: true,
      spark: [5, 6, 7, 8, 7, 8],
    },
    {
      label: "Columns",
      value: dashboard.columns,
      trend: "+0%",
      trendUp: true,
      spark: [4, 5, 5, 6, 6, 7],
    },
    {
      label: "Missing",
      value: dashboard.missing,
      trend: "0%",
      trendUp: false,
      spark: [3, 2, 2, 2, 1, 1],
    },
    {
      label: "Duplicates",
      value: dashboard.duplicates,
      trend: "0%",
      trendUp: false,
      spark: [1, 1, 1, 1, 1, 1],
    },
  ];

  const revenueSeries = [
    { month: "Jan", revenue: 1200, cost: 800 },
    { month: "Feb", revenue: 1800, cost: 1200 },
    { month: "Mar", revenue: 1600, cost: 1100 },
    { month: "Apr", revenue: 2200, cost: 1400 },
    { month: "May", revenue: 2600, cost: 1700 },
  ];

  const categoryData = [
    { name: "Sales", value: 40 },
    { name: "Marketing", value: 20 },
    { name: "Finance", value: 25 },
    { name: "HR", value: 15 },
  ];

  const recentInvestigations = [
    {
      dataset: "Latest Dataset",
      date: "Today",
      status: "Completed",
      quality: 96,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden card-soft p-6 md:p-10"
      >
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative">

          <p className="text-sm font-medium text-muted-foreground">
            Welcome back 👋
          </p>

          <h2 className="mt-2 text-4xl font-bold">
            Data Detective Dashboard
          </h2>

          <p className="mt-3 max-w-2xl text-muted-foreground">
            Explore datasets, discover insights, chat with AI,
            and generate professional reports.
          </p>

          <div className="mt-6 flex gap-3">

            <Button asChild>
              <Link to="/upload">
                <Plus className="h-4 w-4" />
                Upload Dataset
              </Link>
            </Button>

            <Button variant="outline" asChild>
              <Link to="/chat">
                Detective AI
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

          </div>

        </div>

      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {kpis.map((k, i) => {

          const Icon = icons[i];

          const data = k.spark.map((v, x) => ({
            x,
            v,
          }));

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
                  className={`inline-flex items-center gap-1 text-xs font-medium ${
                    k.trendUp
                      ? "text-green-600"
                      : "text-red-600"
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

              <div className="mt-4 text-2xl font-bold">
                {k.value}
              </div>

              <div className="text-xs text-muted-foreground">
                {k.label}
              </div>

              <div className="mt-3 h-12">

                <ResponsiveContainer width="100%" height="100%">

                  <AreaChart data={data}>

                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke="var(--color-primary)"
                      fill="var(--color-primary)"
                      fillOpacity={0.2}
                    />

                  </AreaChart>

                </ResponsiveContainer>

              </div>

            </motion.div>
          );

        })}

      </div>
            {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">

        <SectionCard
          title="Revenue vs Cost"
          description="Business Performance"
          className="lg:col-span-2"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8B5E3C"
                  strokeWidth={3}
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="#D4A373"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Category Distribution"
          description="Department Analysis"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill="#8B5E3C"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

      </div>

      {/* Dataset Health + AI */}
      <div className="grid gap-4 lg:grid-cols-2">

        <SectionCard
          title="Dataset Health"
          description="Quality Overview"
        >
          <div className="space-y-5">

            <div>
              <div className="flex justify-between text-sm">
                <span>Health Score</span>
                <span>96%</span>
              </div>

              <div className="mt-2 h-3 rounded-full bg-muted">
                <div
                  className="h-3 rounded-full bg-green-500"
                  style={{ width: "96%" }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">

              <div className="rounded-xl border p-4">
                <h4 className="font-semibold">
                  Missing Values
                </h4>

                <p className="mt-2 text-3xl font-bold">
                  {dashboard.missing}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <h4 className="font-semibold">
                  Duplicate Rows
                </h4>

                <p className="mt-2 text-3xl font-bold">
                  {dashboard.duplicates}
                </p>
              </div>

            </div>

          </div>
        </SectionCard>

        <SectionCard
          title="AI Recommendation"
          description="Detective AI Suggestions"
        >

          <div className="space-y-4">

            <div className="flex gap-3">
              <Activity className="text-green-600" />
              <span>
                Dataset uploaded successfully.
              </span>
            </div>

            <div className="flex gap-3">
              <Lightbulb className="text-yellow-500" />
              <span>
                Dataset ready for analysis.
              </span>
            </div>

            <div className="flex gap-3">
              <Gauge className="text-blue-600" />
              <span>
                Generate AI Insights for better decisions.
              </span>
            </div>

            <Button
              asChild
              className="mt-3 w-full"
            >
              <Link to="/chat">
                Open Detective AI
              </Link>
            </Button>

          </div>

        </SectionCard>

      </div>

      {/* Recent Investigations */}
      <SectionCard
        title="Recent Investigation"
        description="Latest Dataset"
      >

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>

              <tr className="border-b">

                <th className="py-3 text-left">
                  Dataset
                </th>

                <th className="text-left">
                  Date
                </th>

                <th className="text-left">
                  Status
                </th>

                <th className="text-left">
                  Quality
                </th>

              </tr>

            </thead>

            <tbody>

              {recentInvestigations.map((item) => (

                <tr
                  key={item.dataset}
                  className="border-b"
                >

                  <td className="py-4">
                    {item.dataset}
                  </td>

                  <td>
                    {item.date}
                  </td>

                  <td>
                    <StatusPill
                      status={item.status}
                    />
                  </td>

                  <td>
                    {item.quality}%
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </SectionCard>

    </div>
  );
}

export default DashboardPage;