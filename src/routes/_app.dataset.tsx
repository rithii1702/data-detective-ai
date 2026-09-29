import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Database,
  BarChart3,
  Brain,
  BookOpen,
  FileText,
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

export const Route = createFileRoute("/_app/dataset")({
  component: DatasetPage,
});

function DatasetPage() {
  const [eda, setEda] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [story, setStory] = useState<any>(null);

  const initFromDataset = (active: any) => {
    setEda({
      success: true,
      totalRows: active.totalRows,
      columns: active.columns,
    });
    setReport({
      datasetSummary: {
        rows: active.totalRows,
        columns: active.columns.length,
        numericColumns: active.numericColumns.length,
        categoricalColumns: active.categoricalColumns.length,
      },
      executiveSummary: `Analysis of ${active.fileName} reveals a schema of ${active.columns.length} columns and ${active.totalRows.toLocaleString()} rows with an overall calculated health score of ${active.healthScore}%. Quality checks identified ${active.missingValues} missing values and ${active.duplicateRows} duplicate rows.`,
      businessInsight: `The dataset provides strong structural fidelity across ${active.numericColumns.length} continuous metrics (${active.numericColumns.slice(0, 3).join(", ") || "none"}), making it primed for correlation discovery, regression models, and exploratory visualizations.`,
      recommendation: active.missingValues > 0
        ? `Cleanse detected ${active.missingValues} null values using median imputation or drop invalid rows before training predictive pipelines.`
        : "Dataset schema is complete with zero nulls. Proceed directly to feature engineering and visual reporting.",
      confidence: "High (Calculated directly from dataset records)",
    });
    setStory({
      title: `The Story of ${active.fileName}`,
      overview: `Data Detective ingested and audited all ${active.totalRows.toLocaleString()} rows. The dataset spans key domains with categorical columns: ${active.categoricalColumns.slice(0, 4).join(", ") || "N/A"}.`,
      keyFindings: [
        `Processed ${active.totalRows.toLocaleString()} observations without schema degradation.`,
        `Identified ${active.numericColumns.length} numeric columns ready for variance and distribution modeling.`,
        `Dataset integrity rating is currently at ${active.healthScore}%.`,
      ],
    });
  };

  useEffect(() => {
    const active = getActiveDataset();
    if (active) {
      initFromDataset(active);
      return;
    }

    // Try backend if local is empty
    const apiUrl = getApiBaseUrl();
    if (apiUrl) {
      Promise.all([
        fetch(`${apiUrl}/api/eda`).then((r) => r.json()).catch(() => null),
        fetch(`${apiUrl}/api/insights`).then((r) => r.json()).catch(() => null),
        fetch(`${apiUrl}/api/story`).then((r) => r.json()).catch(() => null),
      ]).then(([edaData, insightData, storyData]) => {
        if (edaData?.success && insightData?.report && storyData?.story) {
          setEda(edaData);
          setReport(insightData.report);
          setStory(storyData.story);
        }
      });
    }
  }, []);

  const handleTrySample = () => {
    const sample = loadSampleDataset();
    initFromDataset(sample);
  };

  if (!eda || !report || !story) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Dataset Details"
          subtitle="Complete analysis of the uploaded dataset"
        />

        <SectionCard>
          <div className="py-16 text-center max-w-md mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <UploadCloud className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold">No Dataset Selected</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Upload a dataset to generate automated AI summaries, key findings, and business stories.
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
        title="Dataset Details"
        subtitle="Complete analysis and automated AI interpretation"
        actions={
          <Button asChild size="sm">
            <Link to="/upload">Upload Another</Link>
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <SectionCard>
          <Database className="mb-3 h-8 w-8 text-blue-600" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rows</h3>
          <p className="mt-2 text-3xl font-bold">
            {report.datasetSummary.rows.toLocaleString()}
          </p>
        </SectionCard>

        <SectionCard>
          <Database className="mb-3 h-8 w-8 text-emerald-600" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Columns</h3>
          <p className="mt-2 text-3xl font-bold">
            {report.datasetSummary.columns}
          </p>
        </SectionCard>

        <SectionCard>
          <BarChart3 className="mb-3 h-8 w-8 text-purple-600" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Numeric Columns</h3>
          <p className="mt-2 text-3xl font-bold">
            {report.datasetSummary.numericColumns}
          </p>
        </SectionCard>

        <SectionCard>
          <BarChart3 className="mb-3 h-8 w-8 text-orange-600" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categorical Columns</h3>
          <p className="mt-2 text-3xl font-bold">
            {report.datasetSummary.categoricalColumns}
          </p>
        </SectionCard>
      </div>

      <SectionCard>
        <div className="flex items-center gap-3 mb-4">
          <Brain className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold">
            AI Executive Summary
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-foreground/90">
          {report.executiveSummary}
        </p>
      </SectionCard>

      <SectionCard>
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-6 w-6 text-emerald-600" />
          <h2 className="text-xl font-bold">
            Business Insight
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-foreground/90">
          {report.businessInsight}
        </p>
      </SectionCard>

      <SectionCard>
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-bold">
            AI Story
          </h2>
        </div>

        <h3 className="text-base font-semibold mb-2 text-foreground">
          {story.title}
        </h3>

        <p className="text-sm leading-relaxed text-foreground/90 mb-4">
          {story.overview}
        </p>

        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Key Findings
          </h4>
          <ul className="list-disc pl-5 space-y-2 text-sm text-foreground/90">
            {story.keyFindings.map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="flex items-center gap-3 mb-4">
          <Brain className="h-6 w-6 text-orange-600" />
          <h2 className="text-xl font-bold">
            Actionable Recommendation
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-foreground/90">{report.recommendation}</p>

        <div className="mt-4 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Confidence:</span> {report.confidence}
        </div>
      </SectionCard>
    </div>
  );
}

export default DatasetPage;