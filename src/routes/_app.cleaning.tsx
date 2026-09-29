import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  UploadCloud,
  Sparkles,
  CheckCircle2,
  Trash2,
  Filter,
  Download,
  RotateCcw,
  Check,
  FileSpreadsheet,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { PageHeader, SectionCard } from "@/components/detective/shared";
import { Button } from "@/components/ui/button";
import {
  getActiveDataset,
  setActiveDataset,
  calculateDatasetFromRows,
  loadSampleDataset,
  type DatasetMetricSummary,
} from "@/lib/dataset-store";
import { getApiBaseUrl } from "@/lib/api-config";

export const Route = createFileRoute("/_app/cleaning")({
  component: CleaningPage,
  head: () => ({
    meta: [{ title: "Data Cleaning — Data Detective AI" }],
  }),
});

interface CleaningReport {
  fileName: string;
  originalRows: number;
  cleanedRows: number;
  removedRows: number;
  emptyRowsRemoved: number;
  duplicateRowsRemoved: number;
  totalColumns: number;
  columns: string[];
  missingValues: Record<string, number>;
  data: Record<string, any>[];
}

function CleaningPage() {
  const [activeDataset, setActiveDatasetState] = useState<DatasetMetricSummary | null>(null);
  const [cleaningReport, setCleaningReport] = useState<CleaningReport | null>(null);
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [removeEmptyRows, setRemoveEmptyRows] = useState(true);
  const [fillMissingWithNA, setFillMissingWithNA] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Process rows and generate a clean report
  const processCleaning = (
    rawRows: Record<string, any>[],
    fileName: string,
    opts: { dedupe: boolean; pruneEmpty: boolean; fillNA: boolean }
  ): CleaningReport => {
    if (!rawRows || rawRows.length === 0) {
      return {
        fileName,
        originalRows: 0,
        cleanedRows: 0,
        removedRows: 0,
        emptyRowsRemoved: 0,
        duplicateRowsRemoved: 0,
        totalColumns: 0,
        columns: [],
        missingValues: {},
        data: [],
      };
    }

    const originalRows = rawRows.length;
    const columns = Object.keys(rawRows[0] || {});

    // 1. Remove completely empty rows if enabled
    let workingRows = rawRows;
    let emptyRowsRemoved = 0;
    if (opts.pruneEmpty) {
      const nonEmpty = workingRows.filter((row) =>
        Object.values(row).some((val) => val !== null && val !== undefined && String(val).trim() !== "")
      );
      emptyRowsRemoved = workingRows.length - nonEmpty.length;
      workingRows = nonEmpty;
    }

    // 2. Remove duplicate rows if enabled
    let duplicateRowsRemoved = 0;
    if (opts.dedupe) {
      const seen = new Set<string>();
      const deduped: Record<string, any>[] = [];
      for (const row of workingRows) {
        const key = JSON.stringify(row);
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(row);
        } else {
          duplicateRowsRemoved++;
        }
      }
      workingRows = deduped;
    }

    // 3. Fill missing values if enabled
    if (opts.fillNA) {
      workingRows = workingRows.map((row) => {
        const copy = { ...row };
        for (const col of columns) {
          if (copy[col] === null || copy[col] === undefined || String(copy[col]).trim() === "") {
            copy[col] = "N/A";
          }
        }
        return copy;
      });
    }

    // 4. Calculate missing values per column
    const missingValues: Record<string, number> = {};
    for (const col of columns) {
      missingValues[col] = workingRows.filter(
        (r) => r[col] === null || r[col] === undefined || String(r[col]).trim() === "" || r[col] === "N/A"
      ).length;
    }

    const removedRows = originalRows - workingRows.length;

    return {
      fileName,
      originalRows,
      cleanedRows: workingRows.length,
      removedRows,
      emptyRowsRemoved,
      duplicateRowsRemoved,
      totalColumns: columns.length,
      columns,
      missingValues,
      data: workingRows,
    };
  };

  // Sync with active dataset store on mount
  useEffect(() => {
    const active = getActiveDataset();
    if (active && active.data?.length > 0) {
      setActiveDatasetState(active);
      const report = processCleaning(active.data, active.fileName, {
        dedupe: removeDuplicates,
        pruneEmpty: removeEmptyRows,
        fillNA: fillMissingWithNA,
      });
      setCleaningReport(report);
      return;
    }

    // Try optional backend if available and local store is empty
    const apiBase = getApiBaseUrl();
    if (apiBase) {
      fetch(`${apiBase}/api/clean`)
        .then((res) => {
          if (!res.ok) throw new Error("Backend clean not found");
          return res.json();
        })
        .then((result) => {
          if (result && result.success && Array.isArray(result.data) && result.data.length > 0) {
            setCleaningReport({
              fileName: result.fileName || "uploaded_dataset.csv",
              originalRows: result.originalRows || result.data.length,
              cleanedRows: result.cleanedRows || result.data.length,
              removedRows: result.removedRows || 0,
              emptyRowsRemoved: result.emptyRowsRemoved || 0,
              duplicateRowsRemoved: result.duplicateRowsRemoved || 0,
              totalColumns: result.totalColumns || (result.columns ? result.columns.length : 0),
              columns: result.columns || Object.keys(result.data[0] || {}),
              missingValues: result.missingValues || {},
              data: result.data,
            });
          }
        })
        .catch(() => {
          // Gracefully handled: no dataset found
        });
    }
  }, []);

  // Re-run cleaning when options change
  const handleRecalculate = (dedupe: boolean, pruneEmpty: boolean, fillNA: boolean) => {
    if (!activeDataset || !activeDataset.data) return;
    const report = processCleaning(activeDataset.data, activeDataset.fileName, {
      dedupe,
      pruneEmpty,
      fillNA,
    });
    setCleaningReport(report);
    setIsApplied(false);
    setPage(1);
  };

  const handleToggleDedupe = () => {
    const next = !removeDuplicates;
    setRemoveDuplicates(next);
    handleRecalculate(next, removeEmptyRows, fillMissingWithNA);
  };

  const handleTogglePruneEmpty = () => {
    const next = !removeEmptyRows;
    setRemoveEmptyRows(next);
    handleRecalculate(removeDuplicates, next, fillMissingWithNA);
  };

  const handleToggleFillNA = () => {
    const next = !fillMissingWithNA;
    setFillMissingWithNA(next);
    handleRecalculate(removeDuplicates, removeEmptyRows, next);
  };

  const handleApplyCleanedToApp = () => {
    if (!cleaningReport || !cleaningReport.data || cleaningReport.data.length === 0) return;
    const updated = calculateDatasetFromRows(cleaningReport.data, cleaningReport.fileName);
    setActiveDataset(updated);
    setActiveDatasetState(updated);
    setIsApplied(true);
  };

  const handleDownloadCSV = () => {
    if (!cleaningReport || !cleaningReport.data || cleaningReport.data.length === 0) return;
    const headers = cleaningReport.columns.join(",");
    const rows = cleaningReport.data.map((row) =>
      cleaningReport.columns
        .map((col) => {
          const val = String(row[col] ?? "").replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${cleaningReport.fileName.replace(/\.[^/.]+$/, "")}_cleaned.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTrySample = () => {
    const sample = loadSampleDataset();
    setActiveDatasetState(sample);
    const report = processCleaning(sample.data, sample.fileName, {
      dedupe: removeDuplicates,
      pruneEmpty: removeEmptyRows,
      fillNA: fillMissingWithNA,
    });
    setCleaningReport(report);
    setPage(1);
    setIsApplied(false);
  };

  // -----------------------------------------------------------------
  // 1. EMPTY STATE (When no dataset has been uploaded or selected)
  // -----------------------------------------------------------------
  if (!activeDataset && (!cleaningReport || !cleaningReport.data || cleaningReport.data.length === 0)) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Data Cleaning"
          subtitle="Clean, deduplicate, and validate your dataset"
        />

        <SectionCard>
          <div className="py-16 text-center max-w-md mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <UploadCloud className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold">No Dataset Available for Cleaning</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Upload a CSV or Excel dataset to inspect data quality, eliminate duplicate records, prune empty rows, and validate schemas.
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

  // Fallback while dataset report is finalizing
  if (!cleaningReport) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Data Cleaning"
          subtitle="Clean and validate your dataset"
        />
        <div className="p-12 text-center text-sm text-muted-foreground">
          Analyzing dataset quality and cleaning metrics...
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil((cleaningReport.data?.length || 0) / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const paginatedRows = cleaningReport.data.slice(startIndex, startIndex + pageSize);

  const totalMissingCells = Object.values(cleaningReport.missingValues || {}).reduce((sum, n) => sum + n, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <PageHeader
        title="Data Cleaning"
        subtitle={`Dataset: ${cleaningReport.fileName} • Clean, prune, deduplicate, and validate rows`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCSV}
              className="gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Clean CSV</span>
            </Button>
            <Button
              size="sm"
              onClick={handleApplyCleanedToApp}
              className="gap-1.5"
              disabled={isApplied}
            >
              {isApplied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-300" />
                  <span>Applied to Dashboard</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Apply Cleaned Dataset</span>
                </>
              )}
            </Button>
          </div>
        }
      />

      {/* 2. CLEANING CONTROLS & OPERATIONS */}
      <SectionCard title="Active Cleaning Operations">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant={removeDuplicates ? "default" : "outline"}
              size="sm"
              onClick={handleToggleDedupe}
              className="gap-1.5 text-xs"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Deduplicate Rows {removeDuplicates ? `(${cleaningReport.duplicateRowsRemoved} removed)` : "Off"}</span>
            </Button>

            <Button
              variant={removeEmptyRows ? "default" : "outline"}
              size="sm"
              onClick={handleTogglePruneEmpty}
              className="gap-1.5 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Prune Empty Rows {removeEmptyRows ? `(${cleaningReport.emptyRowsRemoved} removed)` : "Off"}</span>
            </Button>

            <Button
              variant={fillMissingWithNA ? "default" : "outline"}
              size="sm"
              onClick={handleToggleFillNA}
              className="gap-1.5 text-xs"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Impute Missing ({fillMissingWithNA ? 'Filled with "N/A"' : "Keep nulls"})</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRecalculate(true, true, false)}
            className="gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Rules</span>
          </Button>
        </div>
      </SectionCard>

      {/* 3. ROW & QUALITY METRIC KPI CARDS */}
      <SectionCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border p-5 bg-card">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Original Rows</h3>
            <p className="mt-2 text-3xl font-bold font-mono">
              {cleaningReport.originalRows.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Raw observations parsed</p>
          </div>

          <div className="rounded-xl border p-5 bg-card">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cleaned Rows</h3>
            <p className="mt-2 text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {cleaningReport.cleanedRows.toLocaleString()}
            </p>
            <p className="text-[11px] text-emerald-600/80 mt-1">Validated rows remaining</p>
          </div>

          <div className="rounded-xl border p-5 bg-card">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Removed Rows</h3>
            <p className="mt-2 text-3xl font-bold font-mono text-red-500">
              {cleaningReport.removedRows.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {cleaningReport.duplicateRowsRemoved} duplicates, {cleaningReport.emptyRowsRemoved} empty
            </p>
          </div>

          <div className="rounded-xl border p-5 bg-card">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Missing Values</h3>
            <p className="mt-2 text-3xl font-bold font-mono text-amber-500">
              {totalMissingCells.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Across {cleaningReport.totalColumns} schema columns
            </p>
          </div>
        </div>
      </SectionCard>

      {/* 4. CLEANED DATASET PREVIEW TABLE */}
      <SectionCard
        title="Cleaned Dataset Preview"
        description={`Showing rows ${startIndex + 1} to ${Math.min(startIndex + pageSize, cleaningReport.cleanedRows)} of ${cleaningReport.cleanedRows.toLocaleString()}`}
      >
        {cleaningReport.data && cleaningReport.data.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-lg border bg-background">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted border-b select-none">
                    <th className="px-3 py-2.5 w-12 font-mono font-bold text-muted-foreground border-r">#</th>
                    {cleaningReport.columns.map((col) => (
                      <th
                        key={col}
                        className="px-4 py-2.5 font-bold uppercase tracking-wider text-muted-foreground border-r last:border-r-0 whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {paginatedRows.map((row, index) => (
                    <tr key={index} className="hover:bg-muted/40 transition-colors">
                      <td className="px-3 py-2 text-muted-foreground font-mono border-r">
                        {startIndex + index + 1}
                      </td>
                      {cleaningReport.columns.map((col) => {
                        const val = row[col];
                        const isNull = val === "" || val === null || val === undefined;
                        return (
                          <td key={col} className="px-4 py-2 border-r last:border-r-0 font-mono whitespace-nowrap">
                            {isNull ? (
                              <span className="text-amber-500/70 italic text-[11px]">null</span>
                            ) : (
                              String(val)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                <span>
                  Page {page} of {totalPages} ({cleaningReport.cleanedRows.toLocaleString()} total rows)
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="h-8 px-2.5 gap-1"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Previous</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="h-8 px-2.5 gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No rows match the current cleaning criteria.
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export default CleaningPage;