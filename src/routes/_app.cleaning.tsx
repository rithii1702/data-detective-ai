import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, SectionCard } from "@/components/detective/shared";

export const Route = createFileRoute("/_app/cleaning")({
  component: CleaningPage,
});

function CleaningPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/clean")
      .then((res) => res.json())
      .then((result) => setData(result))
      .catch(console.error);
  }, []);

  if (!data) {
    return (
      <div className="p-8 text-center text-lg">
        Loading cleaning report...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Data Cleaning"
        subtitle="Clean and validate your dataset"
      />

      <SectionCard>
        <div className="grid grid-cols-3 gap-6">

          <div className="rounded-xl border p-6">
            <h3 className="text-sm text-muted-foreground">Original Rows</h3>
            <p className="mt-2 text-4xl font-bold">
              {data.originalRows}
            </p>
          </div>

          <div className="rounded-xl border p-6">
            <h3 className="text-sm text-muted-foreground">Cleaned Rows</h3>
            <p className="mt-2 text-4xl font-bold">
              {data.cleanedRows}
            </p>
          </div>

          <div className="rounded-xl border p-6">
            <h3 className="text-sm text-muted-foreground">Removed Rows</h3>
            <p className="mt-2 text-4xl font-bold text-red-500">
              {data.removedRows}
            </p>
          </div>

        </div>
      </SectionCard>

      <SectionCard title="Cleaned Dataset">
        <div className="overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {Object.keys(data.data[0]).map((col: string) => (
                  <th
                    key={col}
                    className="border px-4 py-2 text-left bg-muted"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data.data.map((row: any, index: number) => (
                <tr key={index}>
                  {Object.values(row).map((value: any, i: number) => (
                    <td key={i} className="border px-4 py-2">
                      {String(value)}
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

export default CleaningPage;