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

function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/api/history")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setHistory(data.history);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const deleteDataset = async (fileName: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${fileName}"?`
    );

    if (!confirmDelete) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/delete/${fileName}`,
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
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Unable to delete dataset.");
    }
  };

  const downloadDataset = (fileName: string) => {
    window.open(
      `http://localhost:5000/api/download/${fileName}`,
      "_blank"
    );
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-lg">
        Loading History...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      <PageHeader
        title="📂 Analysis History"
        subtitle="All uploaded datasets and investigations"
        actions={
          <Button>
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

          </div>

        </SectionCard>

      ) : (

        <div className="grid gap-5">

          {history.map((item, index) => (

            <SectionCard key={index}>

              <div className="flex items-center justify-between">

                <div>

                  <div className="flex items-center gap-3">

                    <FileText className="h-8 w-8 text-blue-600" />

                    <h2 className="text-2xl font-bold">
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

                <div className="flex gap-3">

                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate({
                        to: "/dataset",
                      })
                    }
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