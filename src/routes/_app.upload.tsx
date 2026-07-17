import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  PageHeader,
  SectionCard,
} from "@/components/detective/shared";

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

  const [summary, setSummary] = useState<any>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setProgress(20);
    setFileName(file.name);

    const formData = new FormData();
    formData.append("dataset", file);

    try {
      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      setProgress(100);

      setSummary(data.summary);
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    }

    setUploading(false);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      <PageHeader
        title="Upload Dataset"
        subtitle="Upload CSV or Excel datasets."
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
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-14 text-center ${
          drag
            ? "border-primary bg-primary/5"
            : "border-border"
        }`}
      >
        <UploadCloud className="mx-auto h-12 w-12 text-primary" />

        <h2 className="mt-5 text-2xl font-bold">
          Drop CSV or Excel File
        </h2>

        <p className="mt-2 text-muted-foreground">
          Click here or drag your dataset.
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
        <SectionCard title="Uploading Dataset">

          <div className="flex items-center gap-3">

            <FileSpreadsheet className="text-primary" />

            <div className="flex-1">

              <div className="flex justify-between">

                <span>{fileName}</span>

                <span>{progress}%</span>

              </div>

              <div className="mt-2 h-2 rounded-full bg-muted">

                <div
                  className="h-2 rounded-full bg-primary"
                  style={{
                    width: `${progress}%`,
                  }}
                />

              </div>

            </div>

          </div>

        </SectionCard>
      )}

      {summary && (
        <SectionCard title="Dataset Summary">

          <div className="grid gap-5 md:grid-cols-3">

            <div className="rounded-xl border p-5">
              <h4 className="text-sm text-muted-foreground">
                Total Rows
              </h4>

              <p className="mt-2 text-3xl font-bold">
                {summary.totalRows}
              </p>
            </div>

            <div className="rounded-xl border p-5">
              <h4 className="text-sm text-muted-foreground">
                Total Columns
              </h4>

              <p className="mt-2 text-3xl font-bold">
                {summary.totalColumns}
              </p>
            </div>

            <div className="rounded-xl border p-5">
              <h4 className="text-sm text-muted-foreground">
                Filename
              </h4>

              <p className="mt-2 font-semibold">
                {summary.fileName}
              </p>
            </div>

          </div>

          <div className="mt-8">

            <h3 className="font-semibold">
              Columns
            </h3>

            <div className="mt-3 flex flex-wrap gap-2">

              {summary.columns.map((column: string) => (
                <span
                  key={column}
                  className="rounded-full bg-primary/10 px-3 py-1 text-sm"
                >
                  {column}
                </span>
              ))}

            </div>

          </div>

          <div className="mt-8 flex items-center gap-2 text-green-600">

            <CheckCircle2 className="h-5 w-5" />

            Dataset uploaded successfully.

          </div>

        </SectionCard>
      )}

    </div>
  );
}

export default UploadPage;