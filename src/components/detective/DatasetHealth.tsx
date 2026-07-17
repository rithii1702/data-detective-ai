import {
  CheckCircle2,
  Database,
  AlertTriangle,
  Copy,
  ShieldCheck,
} from "lucide-react";

type Props = {
  rows?: number;
  columns?: number;
  missing?: number;
  duplicates?: number;
};

export default function DatasetHealth({
  rows = 0,
  columns = 0,
  missing = 0,
  duplicates = 0,
}: Props) {
  const score = Math.max(
    0,
    100 - missing * 2 - duplicates * 3
  );

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm dark:bg-zinc-900">
      <div className="mb-5 flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-green-600" />
        <div>
          <h2 className="text-2xl font-bold">
            Dataset Health
          </h2>

          <p className="text-sm text-muted-foreground">
            Overall quality of your uploaded dataset
          </p>
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-semibold">
            Health Score
          </span>

          <span className="text-xl font-bold">
            {score}/100
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border p-4">
          <Database className="mb-2 h-6 w-6 text-blue-600" />
          <p className="text-sm text-muted-foreground">
            Rows
          </p>
          <h3 className="text-2xl font-bold">
            {rows}
          </h3>
        </div>

        <div className="rounded-2xl border p-4">
          <CheckCircle2 className="mb-2 h-6 w-6 text-green-600" />
          <p className="text-sm text-muted-foreground">
            Columns
          </p>
          <h3 className="text-2xl font-bold">
            {columns}
          </h3>
        </div>

        <div className="rounded-2xl border p-4">
          <AlertTriangle className="mb-2 h-6 w-6 text-orange-500" />
          <p className="text-sm text-muted-foreground">
            Missing Values
          </p>
          <h3 className="text-2xl font-bold">
            {missing}
          </h3>
        </div>

        <div className="rounded-2xl border p-4">
          <Copy className="mb-2 h-6 w-6 text-red-500" />
          <p className="text-sm text-muted-foreground">
            Duplicates
          </p>
          <h3 className="text-2xl font-bold">
            {duplicates}
          </h3>
        </div>

      </div>
    </div>
  );
}