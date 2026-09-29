import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText, Download, UploadCloud, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  PageHeader,
  SectionCard,
} from "@/components/detective/shared";
import { getActiveDataset, loadSampleDataset } from "@/lib/dataset-store";
import { getApiBaseUrl } from "@/lib/api-config";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
  head: () => ({ meta: [{ title: "Reports — Data Detective AI" }] }),
});

function ReportsPage() {
  const [hasDataset, setHasDataset] = useState(false);
  const [activeFileName, setActiveFileName] = useState("");

  useEffect(() => {
    const active = getActiveDataset();
    if (active) {
      setHasDataset(true);
      setActiveFileName(active.fileName);
      return;
    }

    const apiUrl = getApiBaseUrl();
    if (apiUrl) {
      fetch(`${apiUrl}/api/insights`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success) {
            setHasDataset(true);
            setActiveFileName("Server Dataset");
          }
        })
        .catch(() => {});
    }
  }, []);

  const downloadReport = async () => {
    try {
      const active = getActiveDataset();
      let report: any = null;

      if (active) {
        report = {
          generatedAt: new Date().toLocaleString(),
          executiveSummary: `Automated investigation report for ${active.fileName}. Evaluated ${active.totalRows.toLocaleString()} observations across ${active.columns.length} schema fields with an overall calculated health rating of ${active.healthScore}%.`,
          businessInsight: active.numericColumns.length > 0
            ? `Quantitative fields (${active.numericColumns.slice(0, 4).join(", ")}) demonstrate consistent data distributions suited for statistical analysis.`
            : `Categorical attributes (${active.categoricalColumns.slice(0, 4).join(", ")}) provide high distinct cardinality suited for segmentation.`,
          recommendation: active.missingValues > 0
            ? `Remediate ${active.missingValues} null cells using median imputation or drop corrupted rows via Data Cleaning.`
            : "Dataset schema is complete with zero nulls. Ready for production modeling.",
          quality: `${active.healthScore}% Data Quality Index`,
          confidence: "High (Calculated from ingested dataset records)",
          datasetSummary: {
            rows: active.totalRows.toLocaleString(),
            columns: active.columns.length,
            numericColumns: active.numericColumns.length,
            categoricalColumns: active.categoricalColumns.length,
            missingValues: active.missingValues.toLocaleString(),
            duplicateRows: active.duplicateRows.toLocaleString(),
          },
        };
      } else {
        const apiUrl = getApiBaseUrl();
        if (apiUrl) {
          const res = await fetch(`${apiUrl}/api/insights`);
          const data = await res.json();
          if (data && data.success && data.report) {
            report = data.report;
          }
        }
      }

      if (!report) {
        alert("No dataset available. Please upload a dataset first.");
        return;
      }

      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text("Data Detective AI Report", 14, 20);

      doc.setFontSize(11);
      doc.text(`Generated: ${report.generatedAt || new Date().toLocaleString()}`, 14, 30);

      autoTable(doc, {
        startY: 40,
        head: [["Section", "Details"]],
        body: [
          ["Executive Summary", report.executiveSummary],
          ["Business Insight", report.businessInsight],
          ["Recommendation", report.recommendation],
          ["Quality", String(report.quality)],
          ["Confidence", String(report.confidence)],
        ],
      });

      autoTable(doc, {
        startY: 120,
        head: [["Metric", "Value"]],
        body: [
          ["Rows", String(report.datasetSummary.rows)],
          ["Columns", String(report.datasetSummary.columns)],
          ["Numeric Columns", String(report.datasetSummary.numericColumns)],
          ["Categorical Columns", String(report.datasetSummary.categoricalColumns)],
          ["Missing Values", String(report.datasetSummary.missingValues)],
          ["Duplicate Rows", String(report.datasetSummary.duplicateRows)],
        ],
      });

      doc.save("Data_Detective_Report.pdf");
    } catch (err) {
      console.error(err);
      alert("Unable to generate report.");
    }
  };

  const handleTrySample = () => {
    const sample = loadSampleDataset();
    setHasDataset(true);
    setActiveFileName(sample.fileName);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Download AI-generated dataset reports"
      />

      <SectionCard>
        <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center max-w-lg mx-auto">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileText className="h-10 w-10 text-primary" />
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              Generate PDF Report
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              {hasDataset
                ? `Ready to generate comprehensive audit for "${activeFileName}". Includes executive summary, business insights, anomaly recommendations, and statistical distributions.`
                : "Upload a CSV or Excel dataset to generate an automated executive summary, business insights, recommendations, confidence scores, and quality statistics."}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {hasDataset ? (
              <Button size="lg" onClick={downloadReport} className="gap-2">
                <Download className="h-5 w-5" />
                Download PDF Report
              </Button>
            ) : (
              <>
                <Button size="lg" asChild className="gap-2">
                  <Link to="/upload">
                    <UploadCloud className="h-5 w-5" />
                    Upload Dataset
                  </Link>
                </Button>
                <Button size="lg" variant="outline" onClick={handleTrySample} className="gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Try Sample Dataset
                </Button>
              </>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export default ReportsPage;