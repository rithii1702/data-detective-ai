import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Brain, Sparkles } from "lucide-react";

import { PageHeader, SectionCard } from "@/components/detective/shared";

export const Route = createFileRoute("/_app/detective")({
  component: DetectivePage,
});

function DetectivePage() {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/detective")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAnalysis(data.analysis);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto flex h-[70vh] items-center justify-center">
        <div className="text-lg font-medium">
          🕵️ Detective AI is analyzing your dataset...
        </div>
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
          <pre className="whitespace-pre-wrap text-base leading-7">
            {analysis}
          </pre>
        </div>

        <div className="mt-10 rounded-2xl border bg-primary/5 p-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-primary" />
            <h3 className="text-xl font-semibold">AI Recommendation</h3>
          </div>

          <p className="mt-4 text-muted-foreground">
            This analysis is generated automatically by Gemini AI.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}

export default DetectivePage;