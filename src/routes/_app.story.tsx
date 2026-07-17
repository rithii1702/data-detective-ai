import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import {
  Brain,
  FileText,
  Lightbulb,
  Target,
  Calendar,
  BarChart3,
} from "lucide-react";

import {
  PageHeader,
  SectionCard,
} from "@/components/detective/shared";

export const Route = createFileRoute("/_app/story")({
  component: StoryPage,
});

function StoryPage() {
  const [story, setStory] = useState<any>(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/story")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStory(data.story);
        }
      })
      .catch(console.error);
  }, []);

  if (!story) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <h2 className="text-2xl font-semibold">
          Loading AI Story...
        </h2>
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

              <h2 className="text-3xl font-bold">
                {story.title}
              </h2>

              <p className="text-muted-foreground">
                AI Generated Story
              </p>

            </div>

          </div>

        </SectionCard>

      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">

        <SectionCard>

          <div className="mb-4 flex items-center gap-3">

            <FileText className="h-7 w-7 text-blue-600" />

            <h3 className="text-xl font-bold">
              Executive Summary
            </h3>

          </div>

          <p className="leading-8">
            {story.executiveSummary}
          </p>

        </SectionCard>

        <SectionCard>

          <div className="mb-4 flex items-center gap-3">

            <BarChart3 className="h-7 w-7 text-green-600" />

            <h3 className="text-xl font-bold">
              Dataset Overview
            </h3>

          </div>

          <p className="leading-8">
            {story.overview}
          </p>

        </SectionCard>
                <SectionCard>

          <div className="mb-4 flex items-center gap-3">

            <Lightbulb className="h-7 w-7 text-yellow-500" />

            <h3 className="text-xl font-bold">
              Key Findings
            </h3>

          </div>

          <ul className="space-y-3">

            {story.keyFindings.map(
              (item: string, index: number) => (

                <li
                  key={index}
                  className="flex items-start gap-3 rounded-xl border p-4"
                >

                  <Target className="mt-1 h-5 w-5 text-primary" />

                  <span>{item}</span>

                </li>

              )
            )}

          </ul>

        </SectionCard>

        <SectionCard>

          <div className="mb-4 flex items-center gap-3">

            <Brain className="h-7 w-7 text-purple-600" />

            <h3 className="text-xl font-bold">
              Business Impact
            </h3>

          </div>

          <p className="leading-8">
            {story.businessImpact}
          </p>

        </SectionCard>

        <SectionCard>

          <div className="mb-4 flex items-center gap-3">

            <Lightbulb className="h-7 w-7 text-green-600" />

            <h3 className="text-xl font-bold">
              AI Recommendation
            </h3>

          </div>

          <p className="leading-8">
            {story.recommendation}
          </p>

        </SectionCard>

      </div>

      <SectionCard>

        <div className="flex items-center justify-between">

          <div>

            <h3 className="text-xl font-bold">
              AI Confidence Score
            </h3>

            <p className="text-muted-foreground">
              Confidence in the generated story
            </p>

          </div>

          <span className="text-3xl font-bold text-green-600">
            {story.confidence}
          </span>

        </div>

        <div className="mt-5 h-4 overflow-hidden rounded-full bg-muted">

          <div
            className="h-full rounded-full bg-green-500"
            style={{
              width: story.confidence,
            }}
          />

        </div>

      </SectionCard>

      <SectionCard>

        <div className="flex items-center gap-3">

          <Calendar className="h-6 w-6 text-orange-500" />

          <div>

            <h3 className="font-semibold">
              Generated On
            </h3>

            <p className="text-muted-foreground">
              {story.generatedAt}
            </p>

          </div>

        </div>

      </SectionCard>

    </div>
  );
}

export default StoryPage;