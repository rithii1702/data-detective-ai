import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, SectionCard } from "@/components/detective/shared";

export const Route = createFileRoute("/_app/explorer")({
  component: ExplorerPage,
});

function ExplorerPage() {
  const [dataset, setDataset] = useState<any>(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/explorer")
      .then((res) => res.json())
      .then((data) => setDataset(data))
      .catch((err) => console.log(err));
  }, []);

  if (!dataset || !dataset.success) {
    return (
      <div className="mx-auto max-w-7xl">
        <PageHeader
          title="Data Explorer"
          subtitle="Browse your uploaded dataset"
        />

        <SectionCard>
          <div className="py-20 text-center">
            <h2 className="text-2xl font-bold">
              No Dataset Uploaded
            </h2>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Data Explorer"
        subtitle="Browse your uploaded dataset"
      />

      <SectionCard>
        <div className="mb-6">
          <h2 className="text-xl font-bold">{dataset.fileName}</h2>

          <p>Total Rows: {dataset.totalRows}</p>
          <p>Total Columns: {dataset.totalColumns}</p>
        </div>

        <div className="overflow-auto">
          <table className="w-full border">
            <thead>
              <tr>
                {dataset.columns.map((col: string) => (
                  <th key={col} className="border p-2 bg-gray-100">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {dataset.data.map((row: any, index: number) => (
                <tr key={index}>
                  {dataset.columns.map((col: string) => (
                    <td key={col} className="border p-2">
                      {row[col]}
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