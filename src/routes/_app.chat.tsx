import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Sparkles,
  Database,
  BarChart3,
  Brain,
  FileText,
  TrendingUp,
  AlertTriangle,
  Wand2,
  LineChart,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import DatasetHealth from "@/components/detective/DatasetHealth";
import {
  PageHeader,
  SectionCard,
} from "@/components/detective/shared";

export const Route = createFileRoute("/_app/chat")({
  component: ChatPage,
});

const actions = [
  {
    title: "Explain Dataset",
    icon: Sparkles,
    prompt: "Explain my dataset in simple words.",
  },
  {
    title: "Dataset Summary",
    icon: Database,
    prompt: "Give complete dataset summary.",
  },
  {
    title: "Business Insights",
    icon: Brain,
    prompt: "Give business insights.",
  },
  {
    title: "Find Trends",
    icon: TrendingUp,
    prompt: "Find important trends.",
  },
  {
    title: "Recommend Charts",
    icon: BarChart3,
    prompt: "Recommend charts.",
  },
  {
    title: "Generate Report",
    icon: FileText,
    prompt: "Generate detailed report.",
  },
  {
    title: "Clean Dataset",
    icon: Wand2,
    prompt: "Clean my dataset.",
  },
  {
    title: "Detect Outliers",
    icon: AlertTriangle,
    prompt: "Find outliers.",
  },
  {
    title: "Predict Trends",
    icon: LineChart,
    prompt: "Predict future trends.",
  },
];

function ChatPage() {
  const [datasetInfo, setDatasetInfo] = useState({
    rows: 0,
    columns: 0,
    missing: 0,
    duplicates: 0,
  });

  // Load dataset information
  useEffect(() => {
    fetch("http://localhost:5000/api/eda")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDatasetInfo({
            rows: data.totalRows || data.rows || 0,
            columns: data.columns?.length || 0,
            missing: data.missingValues || 0,
            duplicates: data.duplicateRows || 0,
          });
        }
      })
      .catch((error) => {
        console.error("Failed to load dataset information:", error);
      });
  }, []);

  const startInvestigation = (prompt: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("open-detective-assistant", {
          detail: { prompt },
        })
      );
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="🕵️ Data Detective AI"
        subtitle="Ask anything about your uploaded dataset."
      />

      <DatasetHealth
        rows={datasetInfo.rows}
        columns={datasetInfo.columns}
        missing={datasetInfo.missing}
        duplicates={datasetInfo.duplicates}
      />

      {/* Quick Investigation Actions */}
      <SectionCard>
        <h2 className="mb-5 text-2xl font-bold">
          ⚡ Start Investigation
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <Button
                key={action.title}
                variant="outline"
                className="h-24 justify-start gap-4 rounded-2xl transition hover:border-primary/50 hover:bg-muted/50"
                onClick={() => startInvestigation(action.prompt)}
              >
                <Icon size={28} className="text-primary" />

                <div className="text-left">
                  <div className="font-semibold text-foreground">
                    {action.title}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Click to investigate
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}

export default ChatPage;