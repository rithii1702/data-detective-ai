import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  History,
  Upload,
  FileText,
  Calendar,
  HardDrive,
  CheckCircle2,
  Eye,
  Download,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  PageHeader,
  SectionCard,
} from "@/components/detective/shared";

export const Route = createFileRoute("/_app/history")({
  component: HistoryPage,
  head: () => ({
    meta: [
      {
        title: "History — Data Detective AI",
      },
    ],
  }),
});

interface HistoryItem {
  fileName: string;
  uploadedAt: string;
  size: string;
  status: string;
}

function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Fetch analysis history
  useEffect(() => {
    fetch("http://localhost:5000/api/history")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setHistory(data.history);
        }
      })
      .catch((err) => {
        console.error("History fetch error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Delete dataset
  const deleteDataset = async (fileName: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${fileName}"?`
    );

    if (!confirmDelete) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/delete/${encodeURIComponent(fileName)}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (data.success) {
        setHistory((prev) =>
          prev.filter((item) => item.fileName !== fileName)
        );

        alert("Dataset deleted successfully.");
      } else {
        alert(data.message || "Unable to delete dataset.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Unable to delete dataset.");
    }
  };

  // Download dataset
  const downloadDataset = (fileName: string) => {
    window.open(
      `http://localhost:5000/api/download/${encodeURIComponent(fileName)}`,
      "_blank"
    );
  };

  // View dataset
  const viewDataset = () => {
    navigate({
      to: "/dataset",
    });
  };

  // Upload new dataset
  const uploadDataset = () => {
    navigate({
      to: "/upload",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-lg font-medium">
          Loading History...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="📂 Analysis History"
        subtitle="All uploaded datasets and investigations"
        actions={
          <Button onClick={uploadDataset}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Dataset
          </Button>
        }
      />

      {history.length === 0 ? (
        <SectionCard>
          <div className="flex min-h-[450px] flex-col items-center justify-center text-center">
            <History className="h-16 w-16 text-primary" />

            <h2 className="mt-5 text-3xl font-bold">
              No Analysis History
            </h2>

            <p className="mt-3 max-w-xl text-muted-foreground">
              Upload a dataset to start building your analysis history.
            </p>

            <Button
              className="mt-6"
              onClick={uploadDataset}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Dataset
            </Button>
          </div>
        </SectionCard>
      ) : (
        <div className="grid gap-5">
          {history.map((item, index) => (
            <SectionCard key={`${item.fileName}-${index}`}>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                {/* Dataset information */}
                <div>
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-600" />

                    <h2 className="break-all text-2xl font-bold">
                      {item.fileName}
                    </h2>
                  </div>

                  <div className="mt-5 space-y-3 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />

                      {new Date(item.uploadedAt).toLocaleString()}
                    </div>

                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />

                      {item.size}
                    </div>

                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />

                      {item.status}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={viewDataset}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() =>
                      downloadDataset(item.fileName)
                    }
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() =>
                      deleteDataset(item.fileName)
                    }
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}

export default HistoryPage;