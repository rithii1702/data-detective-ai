import { createFileRoute } from "@tanstack/react-router";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  PageHeader,
  SectionCard,
} from "@/components/detective/shared";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const downloadReport = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/insights");
      const data = await res.json();

      if (!data.success) {
        alert("No report found.");
        return;
      }

      const report = data.report;

      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text("Data Detective AI Report", 14, 20);

      doc.setFontSize(11);
      doc.text(`Generated: ${report.generatedAt}`, 14, 30);

      autoTable(doc, {
        startY: 40,
        head: [["Section", "Details"]],
        body: [
          ["Executive Summary", report.executiveSummary],
          ["Business Insight", report.businessInsight],
          ["Recommendation", report.recommendation],
          ["Quality", report.quality],
          ["Confidence", report.confidence],
        ],
      });

      autoTable(doc, {
        startY: 120,
        head: [["Metric", "Value"]],
        body: [
          ["Rows", report.datasetSummary.rows],
          ["Columns", report.datasetSummary.columns],
          ["Numeric Columns", report.datasetSummary.numericColumns],
          ["Categorical Columns", report.datasetSummary.categoricalColumns],
          ["Missing Values", report.datasetSummary.missingValues],
          ["Duplicate Rows", report.datasetSummary.duplicateRows],
        ],
      });

      doc.save("Data_Detective_Report.pdf");
    } catch (err) {
      console.error(err);
      alert("Unable to generate report.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Download AI-generated dataset reports"
      />

      <SectionCard>
        <div className="flex flex-col items-center justify-center py-16 space-y-6">
          <FileText className="h-20 w-20 text-blue-600" />

          <h2 className="text-2xl font-bold">
            Generate PDF Report
          </h2>

          <p className="text-center text-muted-foreground max-w-lg">
            Download a professional AI-generated report with
            executive summary, business insights, recommendations,
            confidence score and dataset statistics.
          </p>

          <Button size="lg" onClick={downloadReport}>
            Download PDF Report
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}

export default ReportsPage;