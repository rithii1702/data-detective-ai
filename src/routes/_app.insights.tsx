import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Brain,
  CheckCircle2,
  Database,
  Lightbulb,
  ShieldCheck,
  Target,
  UploadCloud,
  Sparkles,
} from "lucide-react";

import {
  PageHeader,
  SectionCard,
} from "@/components/detective/shared";
import { Button } from "@/components/ui/button";
import {
  getActiveDataset,
  loadSampleDataset,
} from "@/lib/dataset-store";
import { getApiBaseUrl } from "@/lib/api-config";

export const Route = createFileRoute("/_app/insights")({
  component: InsightsPage,
  head: () => ({ meta: [{ title: "Insights — Data Detective AI" }] }),
});

function InsightsPage() {
  const [report, setReport] = useState<any>(null);

  const initFromDataset = (active: any) => {
    setReport({
      datasetSummary: {
        rows: active.totalRows,
        columns: active.columns.length,
        numericColumns: active.numericColumns.length,
        categoricalColumns: active.categoricalColumns.length,
        missingValues: active.missingValues,
        duplicateRows: active.duplicateRows,
      },
      executiveSummary: `Automated audit of ${active.fileName} processed ${active.totalRows.toLocaleString()} observations across ${active.columns.length} schema fields. Dataset health index is rated at ${active.healthScore}%, reflecting ${active.missingValues} null cells and ${active.duplicateRows} duplicate rows.`,
      businessInsight: active.numericColumns.length > 0
        ? `Primary numerical distributions across metrics (${active.numericColumns.slice(0, 3).join(", ")}) indicate structural stability for quantitative modeling and exploratory trend analysis.`
        : `Categorical attributes (${active.categoricalColumns.slice(0, 4).join(", ")}) provide high distinct cardinality suited for segmentation and grouping.`,
      recommendation: active.missingValues > 0
        ? `Remediate ${active.missingValues} detected missing values using median/mean imputation or prune invalid rows via Data Cleaning before training downstream models.`
        : "Dataset schema is clean with 100% cell completeness. You can proceed directly to EDA visualizations and PDF report generation.",
      confidence: `${active.healthScore}%`,
      quality: `Audited ${active.columns.length} columns: ${active.numericColumns.length} numeric, ${active.categoricalColumns.length} categorical.`,
    });
  };

  useEffect(() => {
    const active = getActiveDataset();
    if (active) {
      initFromDataset(active);
      return;
    }

    const apiUrl = getApiBaseUrl();
    if (apiUrl) {
      fetch(`${apiUrl}/api/insights`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && data.report) {
            setReport(data.report);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleTrySample = () => {
    const sample = loadSampleDataset();
    initFromDataset(sample);
  };

  if (!report) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="🧠 AI Insights"
          subtitle="Automatically generated business insights"
        />

        <SectionCard>
          <div className="py-16 text-center max-w-md mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <UploadCloud className="h-7 w-7" />
            </div>

            <h2 className="text-xl font-bold">No Dataset Available for AI Insights</h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Upload a CSV or Excel dataset to generate automated executive summaries, business insights, confidence scores, and action recommendations.
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

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="🧠 AI Insights"
        subtitle="Automatically generated business insights"
      />

      <div className="grid gap-6 md:grid-cols-2">
        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-7 w-7 text-blue-600" />
            <h2 className="text-xl font-bold">
              Executive Summary
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{report.executiveSummary}</p>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-7 w-7 text-green-600" />
            <h2 className="text-xl font-bold">
              Dataset Summary
            </h2>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="font-semibold text-foreground">Rows :</span> {report.datasetSummary?.rows?.toLocaleString()}</p>
            <p><span className="font-semibold text-foreground">Columns :</span> {report.datasetSummary?.columns}</p>
            <p><span className="font-semibold text-foreground">Numeric Columns :</span> {report.datasetSummary?.numericColumns}</p>
            <p><span className="font-semibold text-foreground">Categorical Columns :</span> {report.datasetSummary?.categoricalColumns}</p>
            <p><span className="font-semibold text-foreground">Missing Values :</span> {report.datasetSummary?.missingValues?.toLocaleString()}</p>
            <p><span className="font-semibold text-foreground">Duplicate Rows :</span> {report.datasetSummary?.duplicateRows?.toLocaleString()}</p>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="h-7 w-7 text-yellow-500" />
            <h2 className="text-xl font-bold">
              Business Insight
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{report.businessInsight}</p>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="h-7 w-7 text-green-600" />
            <h2 className="text-xl font-bold">
              Recommendation
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{report.recommendation}</p>
        </SectionCard>
      </div>

      <SectionCard>
        <div className="flex items-center gap-3 mb-5">
          <Target className="h-7 w-7 text-purple-600" />
          <h2 className="text-xl font-bold">
            AI Confidence
          </h2>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500"
            style={{
              width: report.confidence?.includes("%") ? report.confidence : "92%",
            }}
          />
        </div>
        <p className="mt-3 font-semibold text-sm">
          {report.confidence}
        </p>
      </SectionCard>

      <SectionCard>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-blue-600 shrink-0" />
          <p className="text-sm text-muted-foreground">{report.quality}</p>
        </div>
      </SectionCard>
    </div>
  );
}

export default InsightsPage;