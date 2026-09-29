import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Database,
  BarChart3,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  PageHeader,
  SectionCard,
} from "@/components/detective/shared";
import {
  parseFileToDataset,
  loadSampleDataset,
  clearActiveDataset,
  type DatasetMetricSummary,
} from "@/lib/dataset-store";
import { getApiBaseUrl } from "@/lib/api-config";

export const Route = createFileRoute("/_app/upload")({
  component: UploadPage,
  head: () => ({
    meta: [{ title: "Upload Dataset — Data Detective AI" }],
  }),
});

function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [datasetSummary, setDatasetSummary] = useState<DatasetMetricSummary | null>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setProgress(30);
    setFileName(file.name);

    try {
      // Client-side parser calculates schema, health score, charts & recommendations
      const parsed = await parseFileToDataset(file);
      setProgress(85);

      // Attempt optional backend upload if server is active
      try {
        const apiUrl = getApiBaseUrl();
        if (apiUrl) {
          const formData = new FormData();
          formData.append("dataset", file);
          await fetch(`${apiUrl}/api/upload`, {
            method: "POST",
            body: formData,
          });
        }
      } catch {
        // Silently pass if backend is offline on static deployment
      }

      setProgress(100);
      setDatasetSummary(parsed);
    } catch (err) {
      console.error("Upload / Parse error:", err);
      alert("Could not parse dataset file. Please ensure it is a valid CSV or Excel file.");
    } finally {
      setUploading(false);
    }
  };

  const handleTrySample = () => {
    const sample = loadSampleDataset();
    setFileName(sample.fileName);
    setDatasetSummary(sample);
  };

  const handleReset = () => {
    clearActiveDataset();
    setDatasetSummary(null);
    setFileName("");
    setProgress(0);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Upload Dataset"
        subtitle="Upload a CSV or Excel file to analyze metrics, detect missing values & duplicates, and explore with AI."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleTrySample}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            Try Sample Dataset
          </Button>
        }
      />

      <motion.div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files.length > 0) {
            uploadFile(e.dataTransfer.files[0]);
          }
        }}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition ${
          drag
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/60 hover:bg-card/80"
        }`}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UploadCloud className="h-8 w-8" />
        </div>

        <h2 className="mt-4 text-2xl font-bold">
          Drop CSV or Excel File
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Click to browse or drag and drop your dataset here (.csv, .xlsx, .xls)
        </p>

        <input
          hidden
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => {
            if (e.target.files?.length) {
              uploadFile(e.target.files[0]);
            }
          }}
        />
      </motion.div>

      {uploading && (
        <SectionCard title="Processing Dataset">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="text-primary h-6 w-6 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{fileName}</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-2 rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {datasetSummary && (
        <SectionCard
          title="Dataset Successfully Loaded"
          description="Summary metrics computed directly from uploaded records."
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground hover:text-destructive gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Upload Another
            </Button>
          }
        >
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4">
            <div className="rounded-xl border p-4 bg-card/60">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Rows
              </h4>
              <p className="mt-2 text-3xl font-bold">
                {datasetSummary.totalRows.toLocaleString()}
              </p>
            </div>

            <div className="rounded-xl border p-4 bg-card/60">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Columns
              </h4>
              <p className="mt-2 text-3xl font-bold">
                {datasetSummary.columns.length}
              </p>
            </div>

            <div className="rounded-xl border p-4 bg-card/60">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Health Score
              </h4>
              <p className="mt-2 text-3xl font-bold text-emerald-600">
                {datasetSummary.healthScore}%
              </p>
            </div>

            <div className="rounded-xl border p-4 bg-card/60">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Filename
              </h4>
              <p className="mt-2 text-lg font-semibold truncate" title={datasetSummary.fileName}>
                {datasetSummary.fileName}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Detected Schema Columns ({datasetSummary.columns.length})
            </h4>
            <div className="mt-3 flex flex-wrap gap-2 max-h-36 overflow-y-auto">
              {datasetSummary.columns.map((column: string) => (
                <span
                  key={column}
                  className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary"
                >
                  {column}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 pt-4 border-t">
            <Button asChild size="lg" className="gap-2">
              <Link to="/">
                Open Live Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button variant="outline" asChild>
              <Link to="/explorer">
                <Database className="mr-2 h-4 w-4" />
                Browse Data Explorer
              </Link>
            </Button>

            <Button variant="outline" asChild>
              <Link to="/eda">
                <BarChart3 className="mr-2 h-4 w-4" />
                EDA Visualizations
              </Link>
            </Button>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

export default UploadPage;