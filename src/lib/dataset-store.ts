import * as XLSX from "xlsx";

export interface DatasetMetricSummary {
  fileName: string;
  totalRows: number;
  columns: string[];
  numericColumns: string[];
  categoricalColumns: string[];
  missingValues: number;
  duplicateRows: number;
  healthScore: number;
  data: Record<string, any>[];
  uploadedAt: string;
  chartData: {
    categoryTitle: string;
    categoryDescription: string;
    categoryData: { name: string; value: number }[];
    seriesTitle: string;
    seriesDescription: string;
    seriesData: { label: string; value: number; secondary?: number }[];
  };
  recommendations: {
    type: "success" | "warning" | "info";
    text: string;
  }[];
}

const STORAGE_KEY = "ddai-active-dataset";

export function getActiveDataset(): DatasetMetricSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.totalRows) {
      return null;
    }
    return parsed;
  } catch (err) {
    console.error("Error reading active dataset:", err);
    return null;
  }
}

export function setActiveDataset(dataset: DatasetMetricSummary): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
    window.dispatchEvent(new Event("ddai-dataset-changed"));
  } catch (err) {
    console.error("Error saving active dataset:", err);
  }
}

export function clearActiveDataset(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("ddai-dataset-changed"));
  } catch (err) {
    console.error("Error clearing active dataset:", err);
  }
}

export function calculateDatasetFromRows(
  rows: Record<string, any>[],
  fileName: string
): DatasetMetricSummary {
  if (!rows || rows.length === 0) {
    return {
      fileName,
      totalRows: 0,
      columns: [],
      numericColumns: [],
      categoricalColumns: [],
      missingValues: 0,
      duplicateRows: 0,
      healthScore: 100,
      data: [],
      uploadedAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      chartData: {
        categoryTitle: "Category Distribution",
        categoryDescription: "Category Analysis",
        categoryData: [],
        seriesTitle: "Numeric Trend",
        seriesDescription: "Trend Analysis",
        seriesData: [],
      },
      recommendations: [],
    };
  }

  const columns = Object.keys(rows[0]);
  let missingValues = 0;
  const seenRows = new Set<string>();
  let duplicateRows = 0;

  for (const row of rows) {
    const rowStr = JSON.stringify(row);
    if (seenRows.has(rowStr)) {
      duplicateRows++;
    } else {
      seenRows.add(rowStr);
    }

    for (const col of columns) {
      const val = row[col];
      if (
        val === "" ||
        val === null ||
        val === undefined ||
        (typeof val === "string" && val.trim() === "")
      ) {
        missingValues++;
      }
    }
  }

  const numericColumns = columns.filter((col) => {
    let numericCount = 0;
    let validCount = 0;
    const sampleLimit = Math.min(rows.length, 50);
    for (let i = 0; i < sampleLimit; i++) {
      const val = rows[i][col];
      if (val !== "" && val !== null && val !== undefined) {
        validCount++;
        if (!isNaN(Number(val))) {
          numericCount++;
        }
      }
    }
    return validCount > 0 && numericCount / validCount >= 0.8;
  });

  const categoricalColumns = columns.filter((col) => !numericColumns.includes(col));

  const totalCells = rows.length * columns.length || 1;
  const missingRatio = missingValues / totalCells;
  const duplicateRatio = duplicateRows / (rows.length || 1);
  const healthScore = Math.max(
    5,
    Math.min(
      100,
      Math.round(100 - (missingRatio * 60 + duplicateRatio * 40) * 100)
    )
  );

  // Dynamic Chart 1: Categorical Distribution
  let categoryData: { name: string; value: number }[] = [];
  let categoryTitle = "Category Distribution";
  let categoryDescription = "Distribution Analysis";

  const targetCatCol =
    categoricalColumns.find((c) => {
      const distinct = new Set(
        rows.map((r) => String(r[c] || "").trim()).filter(Boolean)
      );
      return distinct.size >= 2 && distinct.size <= 20;
    }) ||
    categoricalColumns[0] ||
    columns[0];

  if (targetCatCol) {
    categoryTitle = `${targetCatCol} Distribution`;
    categoryDescription = `Frequency breakdown across ${targetCatCol}`;
    const counts: Record<string, number> = {};
    rows.forEach((r) => {
      const rawVal = r[targetCatCol];
      const key =
        rawVal !== "" && rawVal !== null && rawVal !== undefined
          ? String(rawVal).trim()
          : "N/A";
      counts[key] = (counts[key] || 0) + 1;
    });
    categoryData = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }

  // Dynamic Chart 2: Numeric Trend / Series
  let seriesData: { label: string; value: number; secondary?: number }[] = [];
  let seriesTitle = "Metric Trends";
  let seriesDescription = "Values across observations";

  const numCol1 = numericColumns[0];
  const numCol2 = numericColumns[1];

  if (numCol1) {
    seriesTitle = numCol2 ? `${numCol1} vs ${numCol2}` : `${numCol1} Overview`;
    seriesDescription = `Sample observations for ${numCol1}${numCol2 ? ` and ${numCol2}` : ""}`;
    const step = Math.max(1, Math.floor(rows.length / 10));
    for (let i = 0; i < rows.length && seriesData.length < 10; i += step) {
      const r = rows[i];
      const label =
        targetCatCol && r[targetCatCol]
          ? String(r[targetCatCol]).slice(0, 10)
          : `#${i + 1}`;
      seriesData.push({
        label,
        value: Number(r[numCol1]) || 0,
        secondary: numCol2 ? Number(r[numCol2]) || 0 : undefined,
      });
    }
  }

  // Dynamic AI Recommendations based on REAL dataset
  const recommendations: { type: "success" | "warning" | "info"; text: string }[] = [];

  recommendations.push({
    type: "success",
    text: `Dataset '${fileName}' loaded with ${rows.length.toLocaleString()} rows and ${columns.length} columns.`,
  });

  if (missingValues > 0) {
    recommendations.push({
      type: "warning",
      text: `Found ${missingValues} missing values (${((missingValues / totalCells) * 100).toFixed(1)}% of cells). Visit Data Cleaning to handle them.`,
    });
  } else {
    recommendations.push({
      type: "success",
      text: "No missing values detected. Dataset schema is clean.",
    });
  }

  if (duplicateRows > 0) {
    recommendations.push({
      type: "warning",
      text: `Identified ${duplicateRows} duplicate rows. Consider deduplicating before downstream modeling.`,
    });
  }

  if (numericColumns.length > 0) {
    recommendations.push({
      type: "info",
      text: `${numericColumns.length} numeric columns (${numericColumns.slice(0, 3).join(", ")}) available for statistical correlation and EDA.`,
    });
  }

  recommendations.push({
    type: "info",
    text: "Use Detective AI to ask context-grounded natural language questions about this dataset.",
  });

  return {
    fileName,
    totalRows: rows.length,
    columns,
    numericColumns,
    categoricalColumns,
    missingValues,
    duplicateRows,
    healthScore,
    data: rows,
    uploadedAt: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    chartData: {
      categoryTitle,
      categoryDescription,
      categoryData,
      seriesTitle,
      seriesDescription,
      seriesData,
    },
    recommendations,
  };
}

export function loadSampleDataset(): DatasetMetricSummary {
  const sampleRows = [
    { order_id: "ORD-101", region: "North", category: "Electronics", units: 12, revenue: 1200, cost: 780 },
    { order_id: "ORD-102", region: "South", category: "Furniture", units: 4, revenue: 840, cost: 520 },
    { order_id: "ORD-103", region: "East", category: "Technology", units: 8, revenue: 1950, cost: 1100 },
    { order_id: "ORD-104", region: "West", category: "Electronics", units: 15, revenue: 1600, cost: 950 },
    { order_id: "ORD-105", region: "North", category: "Office Supplies", units: 25, revenue: 620, cost: 310 },
    { order_id: "ORD-106", region: "Central", category: "Furniture", units: 6, revenue: 1180, cost: 740 },
    { order_id: "ORD-107", region: "East", category: "Electronics", units: 18, revenue: 2100, cost: 1250 },
    { order_id: "ORD-108", region: "West", category: "Office Supplies", units: 30, revenue: 750, cost: 380 },
    { order_id: "ORD-109", region: "North", category: "Technology", units: 11, revenue: 2400, cost: 1400 },
    { order_id: "ORD-110", region: "South", category: "Electronics", units: 9, revenue: 1150, cost: 690 },
  ];

  const dataset = calculateDatasetFromRows(sampleRows, "sample_sales_data.csv");
  setActiveDataset(dataset);
  return dataset;
}

export async function parseFileToDataset(file: File): Promise<DatasetMetricSummary> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, {
          defval: "",
        });
        const dataset = calculateDatasetFromRows(rows, file.name);
        setActiveDataset(dataset);
        resolve(dataset);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}
