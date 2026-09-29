import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  FileText,
  Lightbulb,
  Target,
  Calendar,
  BarChart3,
  UploadCloud,
  Sparkles,
} from "lucide-react";

import {
  PageHeader,
  SectionCard,
} from "@/components/detective/shared";
import { Button } from "@/components/ui/button";
import { getActiveDataset, loadSampleDataset } from "@/lib/dataset-store";
import { getApiBaseUrl } from "@/lib/api-config";

export const Route = createFileRoute("/_app/story")({
  component: StoryPage,
  head: () => ({ meta: [{ title: "AI Story — Data Detective AI" }] }),
});

function StoryPage() {
  const [story, setStory] = useState<any>(null);

  const initFromDataset = (active: any) => {
    setStory({
      title: `The Story of ${active.fileName}`,
      overview: `Data Detective ingested and audited all ${active.totalRows.toLocaleString()} observations across ${active.columns.length} schema fields. The dataset spans key attributes with categorical dimensions (${active.categoricalColumns.slice(0, 4).join(", ") || "none"}) and continuous metrics (${active.numericColumns.slice(0, 4).join(", ") || "none"}).`,
      executiveSummary: `Through algorithmic scanning of ${active.fileName}, the data pipeline recorded ${active.totalRows.toLocaleString()} valid rows. Structural validation calculated an overall data health score of ${active.healthScore}%, reflecting ${active.missingValues} null cells and ${active.duplicateRows} duplicate rows.`,
      keyFindings: [
        `Processed ${active.totalRows.toLocaleString()} observations without schema degradation.`,
        `Identified ${active.numericColumns.length} continuous metrics primed for distribution and correlation modeling.`,
        `Detected ${active.categoricalColumns.length} categorical attributes providing diverse cohort segmentation.`,
        `Overall data quality score confirmed at ${active.healthScore}%.`,
      ],
      businessImpact: active.missingValues > 0
        ? `Remediating the ${active.missingValues} detected null cells will enhance downstream modeling accuracy and prevent skewed aggregations.`
        : "Complete cell integrity guarantees high precision in automated EDA, statistical charting, and predictive regressions.",
      recommendation: active.missingValues > 0
        ? "Run the automated Data Cleaning module to deduplicate records and impute missing values before final export."
        : "The dataset is ready for deep exploratory analysis, PDF reporting, and conversational AI queries.",
      confidence: `${active.healthScore}%`,
      generatedAt: active.uploadedAt || new Date().toLocaleString(),
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
      fetch(`${apiUrl}/api/story`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && data.story) {
            setStory(data.story);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleTrySample = () => {
    const sample = loadSampleDataset();
    initFromDataset(sample);
  };

  if (!story) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="📖 AI Storytelling"
          subtitle="Understand the story behind your data."
        />

        <SectionCard>
          <div className="py-16 text-center max-w-md mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <UploadCloud className="h-7 w-7" />
            </div>

            <h2 className="text-xl font-bold">No Dataset Available for Storytelling</h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Upload a CSV or Excel dataset to generate a narrative walkthrough, executive findings, and business impact analysis.
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
        title="📖 AI Storytelling"
        subtitle="Understand the story behind your data."
      />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <SectionCard>
          <div className="flex items-center gap-4">
            <Brain className="h-12 w-12 text-primary" />
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                {story.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                AI Generated Data Narrative
              </p>
            </div>
          </div>
        </SectionCard>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard>
          <div className="mb-4 flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-bold">Executive Summary</h3>
          </div>
          <p className="leading-relaxed text-sm text-muted-foreground">{story.executiveSummary}</p>
        </SectionCard>

        <SectionCard>
          <div className="mb-4 flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-bold">Dataset Overview</h3>
          </div>
          <p className="leading-relaxed text-sm text-muted-foreground">{story.overview}</p>
        </SectionCard>

        <SectionCard>
          <div className="mb-4 flex items-center gap-3">
            <Lightbulb className="h-6 w-6 text-yellow-500" />
            <h3 className="text-lg font-bold">Key Findings</h3>
          </div>
          <ul className="space-y-3">
            {story.keyFindings?.map((item: string, index: number) => (
              <li key={index} className="flex items-start gap-3 rounded-xl border p-3.5 bg-muted/20">
                <Target className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard>
          <div className="mb-4 flex items-center gap-3">
            <Brain className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-bold">Business Impact</h3>
          </div>
          <p className="leading-relaxed text-sm text-muted-foreground">{story.businessImpact}</p>
        </SectionCard>

        <SectionCard>
          <div className="mb-4 flex items-center gap-3">
            <Lightbulb className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-bold">AI Recommendation</h3>
          </div>
          <p className="leading-relaxed text-sm text-muted-foreground">{story.recommendation}</p>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">AI Confidence Score</h3>
              <p className="text-xs text-muted-foreground">Confidence in generated data story</p>
            </div>
            <span className="text-2xl font-bold text-green-600">{story.confidence}</span>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{ width: story.confidence?.includes("%") ? story.confidence : "90%" }}
            />
          </div>
        </SectionCard>
      </div>

      <SectionCard>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Calendar className="h-5 w-5 text-orange-500" />
          <div>
            <span className="font-semibold text-foreground">Generated On: </span>
            {story.generatedAt}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export default StoryPage;