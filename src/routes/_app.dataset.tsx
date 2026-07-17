import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Database,
  BarChart3,
  Brain,
  BookOpen,
  FileText,
} from "lucide-react";

import {
  PageHeader,
  SectionCard,
} from "@/components/detective/shared";

export const Route = createFileRoute("/_app/dataset")({
  component: DatasetPage,
});

function DatasetPage() {
  const [eda, setEda] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [story, setStory] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:5000/api/eda").then((r) => r.json()),
      fetch("http://localhost:5000/api/insights").then((r) => r.json()),
      fetch("http://localhost:5000/api/story").then((r) => r.json()),
    ]).then(([edaData, insightData, storyData]) => {
      setEda(edaData);
      setReport(insightData.report);
      setStory(storyData.story);
    });
  }, []);

  if (!eda || !report || !story) {
    return (
      <div className="p-10 text-center">
        Loading Dataset...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      <PageHeader
        title="Dataset Details"
        subtitle="Complete analysis of the uploaded dataset"
      />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

        <SectionCard>
          <Database className="mb-3 h-8 w-8 text-blue-600" />
          <h3 className="font-semibold">Rows</h3>
          <p className="mt-2 text-3xl font-bold">
            {report.datasetSummary.rows}
          </p>
        </SectionCard>

        <SectionCard>
          <Database className="mb-3 h-8 w-8 text-green-600" />
          <h3 className="font-semibold">Columns</h3>
          <p className="mt-2 text-3xl font-bold">
            {report.datasetSummary.columns}
          </p>
        </SectionCard>

        <SectionCard>
          <BarChart3 className="mb-3 h-8 w-8 text-purple-600" />
          <h3 className="font-semibold">Numeric Columns</h3>
          <p className="mt-2 text-3xl font-bold">
            {report.datasetSummary.numericColumns}
          </p>
        </SectionCard>

        <SectionCard>
          <BarChart3 className="mb-3 h-8 w-8 text-orange-600" />
          <h3 className="font-semibold">Categorical Columns</h3>
          <p className="mt-2 text-3xl font-bold">
            {report.datasetSummary.categoricalColumns}
          </p>
        </SectionCard>

      </div>

      <SectionCard>

        <div className="flex items-center gap-3 mb-4">
          <Brain className="h-7 w-7 text-blue-600" />
          <h2 className="text-2xl font-bold">
            AI Executive Summary
          </h2>
        </div>

        <p className="leading-8">
          {report.executiveSummary}
        </p>

      </SectionCard>

      <SectionCard>

        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-7 w-7 text-green-600" />
          <h2 className="text-2xl font-bold">
            Business Insight
          </h2>
        </div>

        <p className="leading-8">
          {report.businessInsight}
        </p>

      </SectionCard>

      <SectionCard>

        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="h-7 w-7 text-purple-600" />
          <h2 className="text-2xl font-bold">
            AI Story
          </h2>
        </div>

        <h3 className="text-xl font-bold mb-4">
          {story.title}
        </h3>

        <p className="leading-8">
          {story.overview}
        </p>

        <div className="mt-6">

          <h4 className="font-semibold mb-3">
            Key Findings
          </h4>

          <ul className="list-disc pl-6 space-y-2">

            {story.keyFindings.map(
              (item: string, index: number) => (
                <li key={index}>
                  {item}
                </li>
              )
            )}

          </ul>

        </div>

      </SectionCard>

      <SectionCard>

        <div className="flex items-center gap-3 mb-4">
          <Brain className="h-7 w-7 text-orange-600" />
          <h2 className="text-2xl font-bold">
            Recommendation
          </h2>
        </div>

        <p>{report.recommendation}</p>

        <div className="mt-5">

          <strong>Confidence:</strong>{" "}
          {report.confidence}

        </div>

      </SectionCard>

    </div>
  );
}

export default DatasetPage;