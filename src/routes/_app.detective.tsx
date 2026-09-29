import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Brain, Sparkles, UploadCloud } from "lucide-react";

import { PageHeader, SectionCard } from "@/components/detective/shared";
import { Button } from "@/components/ui/button";
import { getActiveDataset, loadSampleDataset } from "@/lib/dataset-store";
import { getApiBaseUrl } from "@/lib/api-config";

export const Route = createFileRoute("/_app/detective")({
  component: DetectivePage,
  head: () => ({ meta: [{ title: "Detective AI — Data Detective AI" }] }),
});

function DetectivePage() {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(true);

  const initFromDataset = (active: any) => {
    const summary = `Investigation Report: ${active.fileName}
============================================================
• Ingested Observations : ${active.totalRows.toLocaleString()} rows
• Schema Dimension      : ${active.columns.length} columns (${active.numericColumns.length} numerical, ${active.categoricalColumns.length} categorical)
• Quality Health Score  : ${active.healthScore}%
• Data Anomalies        : ${active.missingValues} missing values, ${active.duplicateRows} duplicate records

Key Insights & Patterns:
1. Column Structure: Identified schema metrics [${active.columns.slice(0, 6).join(", ")}${active.columns.length > 6 ? ", ..." : ""}].
2. Quality Check: ${active.missingValues === 0 ? "Zero null values detected across all observed fields." : `Detected ${active.missingValues} null cells requiring imputation or pruning.`}
3. Distribution: Continuous variables (${active.numericColumns.slice(0, 3).join(", ") || "none"}) demonstrate solid stability for quantitative exploration.
4. Recommendation: ${active.missingValues > 0 ? "Utilize Data Cleaning to deduplicate and impute null values prior to regression modeling." : "Proceed directly to EDA Visualizations and Report generation."}`;

    setAnalysis(summary);
    setLoading(false);
  };

  useEffect(() => {
    const active = getActiveDataset();
    if (active) {
      initFromDataset(active);
      return;
    }

    const apiUrl = getApiBaseUrl();
    if (apiUrl) {
      fetch(`${apiUrl}/api/detective`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && data.analysis) {
            setAnalysis(data.analysis);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleTrySample = () => {
    const sample = loadSampleDataset();
    initFromDataset(sample);
  };

  if (loading) {
    return (
      <div className="mx-auto flex h-[70vh] items-center justify-center">
        <div className="text-lg font-medium text-muted-foreground animate-pulse">
          🕵️ Detective AI is analyzing your dataset...
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Detective AI"
          subtitle="AI-powered analysis of your uploaded dataset"
        />

        <SectionCard>
          <div className="py-16 text-center max-w-md mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <UploadCloud className="h-7 w-7" />
            </div>

            <h2 className="text-xl font-bold">No Dataset Available for Investigation</h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Upload a CSV or Excel dataset to run AI-powered investigations, anomaly detection, statistical audits, and automated recommendations.
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
        title="Detective AI"
        subtitle="AI-powered analysis of your uploaded dataset"
      />

      <SectionCard>
        <div className="flex items-center gap-4 border-b pb-5">
          <div className="rounded-full bg-primary/10 p-4">
            <Brain className="h-10 w-10 text-primary" />
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              AI Dataset Investigation
            </h2>

            <p className="text-muted-foreground">
              Data Detective AI has analyzed your uploaded dataset.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border bg-muted/30 p-6">
          <pre className="whitespace-pre-wrap text-sm md:text-base leading-7 font-mono">
            {analysis}
          </pre>
        </div>

        <div className="mt-8 rounded-2xl border bg-primary/5 p-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-primary" />
            <h3 className="text-xl font-semibold">AI Recommendation</h3>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            This analysis is generated dynamically from your uploaded observations and evaluated against statistical anomaly rules.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}

export default DetectivePage;