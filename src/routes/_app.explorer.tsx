import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UploadCloud, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/detective/shared";
import { Button } from "@/components/ui/button";
import {
  getActiveDataset,
  loadSampleDataset,
  type DatasetMetricSummary,
} from "@/lib/dataset-store";

export const Route = createFileRoute("/_app/explorer")({
  component: ExplorerPage,
});

function ExplorerPage() {
  const [dataset, setDataset] = useState<{
    fileName: string;
    totalRows: number;
    totalColumns: number;
    columns: string[];
    data: Record<string, any>[];
  } | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    // 1. Check local dataset store
    const active = getActiveDataset();
    if (active && active.data?.length > 0) {
      setDataset({
        fileName: active.fileName,
        totalRows: active.totalRows,
        totalColumns: active.columns.length,
        columns: active.columns,
        data: active.data,
      });
      return;
    }

    // 2. Fallback to backend API
    fetch("http://localhost:5000/api/explorer")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success) {
          setDataset(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleTrySample = () => {
    const sample = loadSampleDataset();
    setDataset({
      fileName: sample.fileName,
      totalRows: sample.totalRows,
      totalColumns: sample.columns.length,
      columns: sample.columns,
      data: sample.data,
    });
  };

  if (!dataset || !dataset.data || dataset.data.length === 0) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Data Explorer"
          subtitle="Browse and inspect individual rows of your dataset"
        />

        <SectionCard>
          <div className="py-16 text-center max-w-md mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <UploadCloud className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold">No Dataset Uploaded</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Upload a CSV dataset or explore our sample dataset to inspect records and schemas in the Data Explorer.
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

  const totalPages = Math.ceil(dataset.data.length / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const currentRows = dataset.data.slice(startIndex, startIndex + pageSize);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Data Explorer"
        subtitle={`Browsing ${dataset.fileName} • ${dataset.totalRows.toLocaleString()} total rows`}
        actions={
          <Button asChild size="sm">
            <Link to="/upload">Upload Another</Link>
          </Button>
        }
      />

      <SectionCard>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">{dataset.fileName}</h2>
            <p className="text-xs text-muted-foreground">
              Showing rows {startIndex + 1}–{Math.min(startIndex + pageSize, dataset.data.length)} of{" "}
              {dataset.data.length.toLocaleString()} | {dataset.totalColumns} Columns
            </p>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted/60 text-muted-foreground border-b border-border">
              <tr>
                <th className="p-2.5 text-left font-medium w-12 text-center">#</th>
                {dataset.columns.map((col: string) => (
                  <th key={col} className="p-2.5 text-left font-semibold text-foreground whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {currentRows.map((row: any, index: number) => (
                <tr key={index} className="hover:bg-muted/30 transition">
                  <td className="p-2.5 text-center text-muted-foreground font-mono">
                    {startIndex + index + 1}
                  </td>
                  {dataset.columns.map((col: string) => (
                    <td key={col} className="p-2.5 whitespace-nowrap text-foreground/90">
                      {row[col] !== "" && row[col] !== null && row[col] !== undefined
                        ? String(row[col])
                        : <span className="text-muted-foreground/50 italic">null</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

export default ExplorerPage;