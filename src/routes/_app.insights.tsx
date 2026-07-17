import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Brain,
  CheckCircle2,
  Database,
  Lightbulb,
  ShieldCheck,
  Target,
} from "lucide-react";

import {
  PageHeader,
  SectionCard,
} from "@/components/detective/shared";

export const Route = createFileRoute("/_app/insights")({
  component: InsightsPage,
});

function InsightsPage() {
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/insights")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setReport(data.report);
        }
      })
      .catch(console.error);
  }, []);

  if (!report) {
    return (
      <div className="p-10 text-center text-lg">
        Loading AI Insights...
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

          <p>{report.executiveSummary}</p>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-7 w-7 text-green-600" />
            <h2 className="text-xl font-bold">
              Dataset Summary
            </h2>
          </div>

          <div className="space-y-2">
            <p>Rows : {report.datasetSummary.rows}</p>
            <p>Columns : {report.datasetSummary.columns}</p>
            <p>Numeric Columns : {report.datasetSummary.numericColumns}</p>
            <p>Categorical Columns : {report.datasetSummary.categoricalColumns}</p>
            <p>Missing Values : {report.datasetSummary.missingValues}</p>
            <p>Duplicate Rows : {report.datasetSummary.duplicateRows}</p>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="h-7 w-7 text-yellow-500" />
            <h2 className="text-xl font-bold">
              Business Insight
            </h2>
          </div>

          <p>{report.businessInsight}</p>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="h-7 w-7 text-green-600" />
            <h2 className="text-xl font-bold">
              Recommendation
            </h2>
          </div>

          <p>{report.recommendation}</p>
        </SectionCard>

      </div>

      <SectionCard>

        <div className="flex items-center gap-3 mb-5">

          <Target className="h-7 w-7 text-purple-600" />

          <h2 className="text-xl font-bold">
            AI Confidence
          </h2>

        </div>

        <div className="h-4 overflow-hidden rounded-full bg-gray-200">

          <div
            className="h-full rounded-full bg-green-500"
            style={{
              width: report.confidence,
            }}
          />

        </div>

        <p className="mt-3 font-semibold">
          {report.confidence}
        </p>

      </SectionCard>

      <SectionCard>

        <div className="flex items-center gap-3">

          <CheckCircle2 className="h-6 w-6 text-blue-600" />

          <p>{report.quality}</p>

        </div>

      </SectionCard>

    </div>
  );
}

export default InsightsPage;