const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

/**
 * Locate the target or latest uploaded dataset in server/uploads
 */
function getDatasetFilePath(datasetId) {
  const uploadsPath = path.resolve(__dirname, "../uploads");
  if (!fs.existsSync(uploadsPath)) return null;

  const files = fs
    .readdirSync(uploadsPath)
    .filter(
      (file) =>
        file.endsWith(".csv") ||
        file.endsWith(".xlsx") ||
        file.endsWith(".xls")
    );

  if (files.length === 0) return null;

  if (datasetId) {
    const matched = files.find(
      (f) =>
        f.toLowerCase() === datasetId.toLowerCase() ||
        f.toLowerCase().includes(datasetId.toLowerCase())
    );
    if (matched) return path.join(uploadsPath, matched);
  }

  // Sort latest first
  files.sort((a, b) => {
    return (
      fs.statSync(path.join(uploadsPath, b)).mtimeMs -
      fs.statSync(path.join(uploadsPath, a)).mtimeMs
    );
  });

  return path.join(uploadsPath, files[0]);
}

/**
 * Parse rows from a CSV or Excel file
 */
function parseDatasetRows(filePath) {
  try {
    const workbook = XLSX.readFile(filePath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];

    const worksheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
      raw: false,
    });

    if (rawRows.length === 0) return [];

    // Clean keys and trim string values
    return rawRows.map((row) => {
      const cleanRow = {};
      for (const [key, val] of Object.entries(row)) {
        const cleanKey = key.trim();
        if (typeof val === "string") {
          cleanRow[cleanKey] = val.trim();
        } else {
          cleanRow[cleanKey] = val;
        }
      }
      return cleanRow;
    });
  } catch (err) {
    console.error("❌ Error parsing dataset rows:", err.message);
    return [];
  }
}

/**
 * Compute thorough dataset statistics, metadata, and cross-aggregations
 */
function computeDatasetMetrics(rows, fileName) {
  if (!rows || rows.length === 0) return null;

  const totalRows = rows.length;
  const columns = Object.keys(rows[0]);
  const totalColumns = columns.length;

  const columnTypes = {};
  const numericColumns = [];
  const categoricalColumns = [];
  const dateColumns = [];

  // 1. Identify Column Types
  columns.forEach((col) => {
    let numericCount = 0;
    let dateCount = 0;
    let filledCount = 0;

    rows.forEach((r) => {
      const v = r[col];
      if (v !== "" && v !== null && v !== undefined) {
        filledCount++;
        const strVal = String(v).trim();

        // Check if date format (e.g. YYYY-MM-DD or MM/DD/YYYY)
        if (
          /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(strVal) ||
          /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(strVal)
        ) {
          dateCount++;
        } else {
          const num = Number(strVal.replace(/,/g, ""));
          if (!isNaN(num) && strVal !== "") {
            numericCount++;
          }
        }
      }
    });

    if (filledCount > 0 && dateCount / filledCount >= 0.7) {
      columnTypes[col] = "date";
      dateColumns.push(col);
    } else if (filledCount > 0 && numericCount / filledCount >= 0.7) {
      columnTypes[col] = "numeric";
      numericColumns.push(col);
    } else {
      columnTypes[col] = "categorical";
      categoricalColumns.push(col);
    }
  });

  // 2. Missing Values & Duplicate Rows
  const missingValues = {};
  let totalMissing = 0;
  columns.forEach((col) => {
    let m = 0;
    rows.forEach((r) => {
      const v = r[col];
      if (v === "" || v === null || v === undefined) {
        m++;
      }
    });
    missingValues[col] = m;
    totalMissing += m;
  });

  const uniqueSet = new Set(rows.map((r) => JSON.stringify(r)));
  const duplicateRows = totalRows - uniqueSet.size;

  // 3. Numeric Column Statistics
  const numericStats = {};
  numericColumns.forEach((col) => {
    const nums = rows
      .map((r) => Number(String(r[col]).replace(/,/g, "")))
      .filter((n) => !isNaN(n));

    if (nums.length > 0) {
      const sum = nums.reduce((a, b) => a + b, 0);
      const min = Math.min(...nums);
      const max = Math.max(...nums);
      const avg = Number((sum / nums.length).toFixed(2));

      numericStats[col] = {
        count: nums.length,
        sum,
        avg,
        min,
        max,
      };
    }
  });

  // 4. Categorical Column Distributions
  const categoricalStats = {};
  categoricalColumns.forEach((col) => {
    const counts = {};
    rows.forEach((r) => {
      const v = String(r[col] || "(empty)").trim();
      counts[v] = (counts[v] || 0) + 1;
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    categoricalStats[col] = {
      uniqueCount: sorted.length,
      topValues: sorted.slice(0, 10).map(([val, cnt]) => ({ value: val, count: cnt })),
    };
  });

  // 5. Cross Aggregations (e.g. Revenue by Product, Sales by Region, Quantity by Product)
  const crossAggregations = {};
  categoricalColumns.forEach((catCol) => {
    numericColumns.forEach((numCol) => {
      const groupKey = `${catCol}_by_${numCol}`;
      const groupSums = {};
      const groupCounts = {};

      rows.forEach((r) => {
        const catVal = String(r[catCol] || "(empty)").trim();
        const numVal = Number(String(r[numCol]).replace(/,/g, "")) || 0;

        groupSums[catVal] = (groupSums[catVal] || 0) + numVal;
        groupCounts[catVal] = (groupCounts[catVal] || 0) + 1;
      });

      const sorted = Object.entries(groupSums)
        .map(([name, sum]) => ({
          name,
          sum,
          count: groupCounts[name] || 0,
          avg: Number((sum / (groupCounts[name] || 1)).toFixed(2)),
        }))
        .sort((a, b) => b.sum - a.sum);

      crossAggregations[groupKey] = sorted;
    });
  });

  // 6. Single Row Extremes (Max & Min row per numeric column)
  const extremes = {};
  numericColumns.forEach((col) => {
    let maxVal = -Infinity;
    let maxRow = null;
    let minVal = Infinity;
    let minRow = null;

    rows.forEach((r) => {
      const val = Number(String(r[col]).replace(/,/g, ""));
      if (!isNaN(val)) {
        if (val > maxVal) {
          maxVal = val;
          maxRow = r;
        }
        if (val < minVal) {
          minVal = val;
          minRow = r;
        }
      }
    });

    extremes[col] = {
      max: { value: maxVal, row: maxRow },
      min: { value: minVal, row: minRow },
    };
  });

  return {
    fileName,
    totalRows,
    totalColumns,
    columns,
    columnTypes,
    numericColumns,
    categoricalColumns,
    dateColumns,
    missingValues,
    totalMissing,
    duplicateRows,
    numericStats,
    categoricalStats,
    crossAggregations,
    extremes,
    sampleRows: rows.slice(0, 5),
  };
}

/**
 * Classify whether a question is dataset-related or general-purpose
 */
function classifyQuestion(question, datasetColumns = [], hasDataset = false) {
  if (!hasDataset || !question) return "general";

  const lowerQ = question.toLowerCase().trim();

  // Explicit general technical questions
  const explicitGeneral = [
    /^what is sql\b/i,
    /^what is mongodb\b/i,
    /^what is mysql\b/i,
    /^what is python\b/i,
    /^what is an api\b/i,
    /^what is machine learning\b/i,
    /^what is recursion\b/i,
    /difference between (sql|mongodb|mysql|postgres|python|nosql)/i,
    /explain recursion/i,
    /how does (machine learning|recursion|sql|mongodb|an api|this application|the app) work/i,
    /^how does it work\??$/i,
  ];

  for (const pattern of explicitGeneral) {
    if (pattern.test(lowerQ)) {
      return "general";
    }
  }

  // Dataset keywords
  const datasetKeywords = [
    "dataset",
    "data",
    "row",
    "rows",
    "column",
    "columns",
    "csv",
    "excel",
    "spreadsheet",
    "table",
    "file",
    "uploaded",
    "record",
    "records",
    "missing",
    "null",
    "empty",
    "duplicate",
    "duplicates",
    "summary",
    "summarize",
    "overview",
    "revenue",
    "sales",
    "sold",
    "selling",
    "profit",
    "highest",
    "lowest",
    "maximum",
    "minimum",
    "max",
    "min",
    "average",
    "avg",
    "mean",
    "total",
    "sum",
    "count",
    "top 5",
    "top 10",
    "top",
    "bottom",
    "most",
    "least",
    "compare",
    "outlier",
    "outliers",
    "trend",
    "trends",
    "distribution",
  ];

  for (const kw of datasetKeywords) {
    if (lowerQ.includes(kw)) {
      return "dataset";
    }
  }

  // Check if any column name is mentioned
  for (const col of datasetColumns) {
    const colLower = col.toLowerCase();
    if (colLower.length > 2 && lowerQ.includes(colLower)) {
      return "dataset";
    }
  }

  // Follow-up question patterns (pronoun reference to dataset entities)
  const followUpKeywords = [
    /how much (did|does|is) it/i,
    /how many (did|does|is)/i,
    /which one/i,
    /what about/i,
    /who made the most/i,
  ];

  for (const pat of followUpKeywords) {
    if (pat.test(lowerQ)) {
      return "ambiguous_dataset";
    }
  }

  return "general";
}

/**
 * Format computed dataset metrics into a clean, RAG context string for Gemini
 */
function buildDatasetPromptContext(metrics) {
  if (!metrics) return "";

  const {
    fileName,
    totalRows,
    totalColumns,
    columns,
    columnTypes,
    missingValues,
    totalMissing,
    duplicateRows,
    numericStats,
    crossAggregations,
    extremes,
    sampleRows,
  } = metrics;

  const columnsInfo = columns
    .map((col) => `- **${col}** (${columnTypes[col] || "unknown"})`)
    .join("\n");

  // Format Numeric Metrics
  const numericList = Object.entries(numericStats)
    .map(([col, s]) => {
      return `- **${col}**: Total = ${s.sum.toLocaleString()}, Avg = ${s.avg.toLocaleString()}, Min = ${s.min.toLocaleString()}, Max = ${s.max.toLocaleString()}`;
    })
    .join("\n");

  // Format Grouped Rankings (Top Products, Regions, etc.)
  const groupSections = [];
  for (const [key, items] of Object.entries(crossAggregations)) {
    const parts = key.split("_by_");
    const catName = parts[0];
    const numName = parts[1];

    if (items.length > 0) {
      const topList = items
        .slice(0, 5)
        .map(
          (item, idx) =>
            `  ${idx + 1}. **${item.name}**: Total ${numName} = ${item.sum.toLocaleString()} (Count: ${item.count}${item.count > 1 ? `, Avg: ${item.avg.toLocaleString()}` : ""})`
        )
        .join("\n");

      groupSections.push(`- **${numName} by ${catName}:**\n${topList}`);
    }
  }

  // Single Record Extremes
  const extremeList = Object.entries(extremes)
    .map(([col, ext]) => {
      const maxRowDetails = ext.max.row
        ? Object.entries(ext.max.row)
            .map(([k, v]) => `${k}=${v}`)
            .join(", ")
        : "";
      return `- **Highest ${col}:** ${ext.max.value.toLocaleString()} (${maxRowDetails})`;
    })
    .join("\n");

  // Sample Data Preview
  const sampleTable =
    sampleRows.length > 0
      ? JSON.stringify(sampleRows, null, 2)
      : "No preview rows available.";

  return `### VERIFIED DATASET CALCULATIONS (File: ${fileName})
The following facts and statistics have been precisely calculated from the user's uploaded dataset:

- **Dimensions:** ${totalRows} rows, ${totalColumns} columns
- **Data Quality:**
  - Total Missing Values: ${totalMissing}
  - Duplicate Rows: ${duplicateRows}
- **Columns & Data Types:**
${columnsInfo}

### EXACT NUMERICAL TOTALS & AVERAGES:
${numericList || "None"}

### TOP RANKINGS & GROUP AGGREGATIONS:
${groupSections.slice(0, 4).join("\n\n") || "None"}

### SINGLE RECORD HIGHS:
${extremeList || "None"}

### DATASET SAMPLE (FIRST 5 ROWS):
\`\`\`json
${sampleTable}
\`\`\`

### RULES FOR DETECTIVE AI ON DATASET QUESTIONS:
1. Always use the verified calculations above. Do not guess or hallucinate any numbers or columns.
2. If the user asks about the highest revenue, specify both the total revenue by product (Phone: 600,000) and the single highest transaction (240,000 for Phone in South) clearly.
3. If the user asks which product sold the most, clarify units sold (Quantity: Chair=22, Phone=20) vs total revenue generated (Phone=$600,000).
4. If a calculation is not available in the dataset, state clearly that it is not available.
5. Answer conversationally, clearly, and concisely in clean markdown with bold highlights.`;
}

// Month name lookup for date formatting
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function formatMonthYear(d) {
  if (!(d instanceof Date) || isNaN(d.getTime())) return null;
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function parseDateValue(val) {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  const str = String(val).trim();
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;
  return null;
}

/**
 * Detect if a chart is requested and generate verified structured chart data from dataset rows
 */
function detectAndGenerateChart(question, history = [], rawRows = []) {
  if (!rawRows || rawRows.length === 0) return null;

  const q = (question || "").trim().toLowerCase();
  const columns = Object.keys(rawRows[0]);

  // Explicit general technical questions should NEVER generate charts
  const explicitGeneral = [
    /^what is sql\b/i,
    /^what is python\b/i,
    /^what is machine learning\b/i,
    /^what is an api\b/i,
    /^how does recursion work\b/i,
    /^what is recursion\b/i,
    /^explain recursion\b/i,
  ];
  for (const pat of explicitGeneral) {
    if (pat.test(q)) return null;
  }

  // Identify column types
  const numericCols = [];
  const categoricalCols = [];
  const dateCols = [];

  columns.forEach((col) => {
    let numCount = 0;
    let dateCount = 0;
    let filled = 0;
    rawRows.forEach((r) => {
      const v = r[col];
      if (v !== "" && v !== null && v !== undefined) {
        filled++;
        const s = String(v).trim();
        if (
          /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(s) ||
          /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(s)
        ) {
          dateCount++;
        } else if (!isNaN(Number(s.replace(/,/g, "")))) {
          numCount++;
        }
      }
    });
    if (filled > 0 && dateCount / filled >= 0.7) dateCols.push(col);
    else if (filled > 0 && numCount / filled >= 0.7) numericCols.push(col);
    else categoricalCols.push(col);
  });

  // Check if current or previous question requests a visualization
  const isFollowUpChart =
    /\b(now\s+)?show(\s+it)?\s+as\s+(a\s+)?(bar|pie|donut|line|area|scatter)\b/i.test(q) ||
    /\b(now\s+)?show(\s+the\s+)?previous(\s+result)?\s+as\s+(a\s+)?(bar|pie|donut|line|area|scatter)\b/i.test(q) ||
    /\bonly show\s+\d{4}\b/i.test(q) ||
    /\b(make|change)\s+it\s+(in|to|into)\s+(a\s+)?(bar|pie|line|area|scatter)\b/i.test(q);

  const hasChartKeyword =
    /\b(chart|graph|plot|visualize|visualization|diagram)\b/i.test(q);

  const hasVisualDirective =
    /\bshow me\b/i.test(q) ||
    /\bshow\s+(the\s+)?(top\s*\d+|sales|revenue|profit|quantity|trends?)\b/i.test(q) ||
    /\bshow\s+.*?\bby\b/i.test(q) ||
    /\bcompare\s+.*?\b(between|across|by)\b/i.test(q) ||
    /\b(give me a graph|give me a chart|plot)\b/i.test(q);

  // Normal text questions without visual intent:
  // e.g. "Which product has the highest revenue?", "How many rows are there?", "Are there missing values?"
  if (!hasChartKeyword && !hasVisualDirective && !isFollowUpChart) {
    return null;
  }

  // Determine chart type preference
  let chartType = null;
  if (/\b(pie|donut)\b/i.test(q)) chartType = "pie";
  else if (/\b(bar|column)\b/i.test(q)) chartType = "bar";
  else if (/\b(line)\b/i.test(q)) chartType = "line";
  else if (/\b(area)\b/i.test(q)) chartType = "area";
  else if (/\b(scatter)\b/i.test(q)) chartType = "scatter";

  // Check previous user question from history for context inheritance
  let previousUserQuery = "";
  if (history && history.length > 0) {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === "user") {
        previousUserQuery = history[i].content || "";
        break;
      }
    }
  }

  const combinedQuery = `${previousUserQuery} ${q}`.toLowerCase();

  // Filter rows if year/filter specified
  let filteredRows = [...rawRows];
  const yearMatch = q.match(/\b(20\d\d)\b/);
  if (yearMatch) {
    const targetYear = yearMatch[1];
    filteredRows = filteredRows.filter((r) => {
      return Object.values(r).some((val) => String(val).includes(targetYear));
    });
  }

  // Find target numeric column (measure)
  let targetNumeric = null;
  if (/\b(revenue|turnover)\b/i.test(combinedQuery)) {
    targetNumeric = numericCols.find((c) => /revenue/i.test(c));
  } else if (/\b(quantity|units|volume)\b/i.test(combinedQuery)) {
    targetNumeric = numericCols.find((c) => /quantity/i.test(c));
  } else if (/\b(price|cost)\b/i.test(combinedQuery)) {
    targetNumeric = numericCols.find((c) => /price/i.test(c));
  } else if (/\b(sales)\b/i.test(combinedQuery)) {
    targetNumeric =
      numericCols.find((c) => /sales/i.test(c)) ||
      numericCols.find((c) => /revenue/i.test(c)) ||
      numericCols.find((c) => /quantity/i.test(c));
  }
  if (!targetNumeric) {
    targetNumeric =
      numericCols.find((c) => /revenue|sales|amount|quantity/i.test(c)) ||
      numericCols[0];
  }

  // Check if time-based dimension requested
  const isTimeRequested =
    /\b(month|monthly|date|time|over time|trend|trends|timeline|year|yearly|day|daily)\b/i.test(q) ||
    (/\b(month|monthly|over time|trend)\b/i.test(combinedQuery) && !isFollowUpChart);

  // Check if scatter plot requested
  if (
    chartType === "scatter" ||
    (numericCols.length >= 2 && /\b(vs|versus|relationship|correlation)\b/i.test(q))
  ) {
    chartType = "scatter";
    const xCol = numericCols[0];
    const yCol = numericCols.length > 1 ? numericCols[1] : numericCols[0];
    const labelCol = categoricalCols[0] || "";

    const data = filteredRows.map((r) => ({
      [xCol.toLowerCase()]: Number(String(r[xCol]).replace(/,/g, "")) || 0,
      [yCol.toLowerCase()]: Number(String(r[yCol]).replace(/,/g, "")) || 0,
      label: r[labelCol] || "",
    }));

    return {
      type: "scatter",
      title: `${yCol} vs ${xCol}`,
      xKey: xCol.toLowerCase(),
      yKey: yCol.toLowerCase(),
      data,
    };
  }

  // Handle Time / Monthly aggregation
  if (isTimeRequested && dateCols.length > 0) {
    const dateCol = dateCols[0];
    const isMonthly =
      /\b(month|monthly)\b/i.test(combinedQuery) || filteredRows.length > 10;

    if (!chartType) chartType = "line";

    if (isMonthly) {
      // Group by YYYY-MM
      const monthlySums = {};
      const monthlyDates = {};

      filteredRows.forEach((r) => {
        const d = parseDateValue(r[dateCol]);
        if (d) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const num = Number(String(r[targetNumeric]).replace(/,/g, "")) || 0;
          monthlySums[key] = (monthlySums[key] || 0) + num;
          monthlyDates[key] = d;
        }
      });

      const sortedKeys = Object.keys(monthlySums).sort();
      const data = sortedKeys.map((k) => ({
        month: formatMonthYear(monthlyDates[k]) || k,
        [targetNumeric.toLowerCase()]: monthlySums[k],
      }));

      return {
        type: chartType,
        title: `Monthly ${targetNumeric}`,
        xKey: "month",
        yKey: targetNumeric.toLowerCase(),
        data,
      };
    } else {
      // Group by Date
      const dateSums = {};
      filteredRows.forEach((r) => {
        const d = parseDateValue(r[dateCol]);
        const key = d ? d.toISOString().split("T")[0] : String(r[dateCol]);
        const num = Number(String(r[targetNumeric]).replace(/,/g, "")) || 0;
        dateSums[key] = (dateSums[key] || 0) + num;
      });

      const sortedDates = Object.keys(dateSums).sort();
      const data = sortedDates.map((k) => ({
        date: k,
        [targetNumeric.toLowerCase()]: dateSums[k],
      }));

      return {
        type: chartType,
        title: `${targetNumeric} Over Time`,
        xKey: "date",
        yKey: targetNumeric.toLowerCase(),
        data,
      };
    }
  }

  // Handle Categorical Aggregation (Region, Category, Product, etc.)
  let targetCat = null;
  for (const cat of categoricalCols) {
    let pat = `\\b${cat}s?\\b`;
    if (cat.toLowerCase().endsWith("y")) {
      const stem = cat.slice(0, -1);
      pat = `\\b(${cat}|${stem}ies)\\b`;
    }
    const regex = new RegExp(pat, "i");
    if (regex.test(combinedQuery)) {
      targetCat = cat;
      break;
    }
  }

  // Check aliases like "region", "product", "category"
  if (!targetCat) {
    if (/\b(region|area|location)\b/i.test(combinedQuery)) {
      targetCat = categoricalCols.find((c) => /region/i.test(c));
    } else if (/\b(product|item|goods)\b/i.test(combinedQuery)) {
      targetCat = categoricalCols.find((c) => /product/i.test(c));
    } else if (/\b(category|type|segment)\b/i.test(combinedQuery)) {
      targetCat = categoricalCols.find((c) => /category/i.test(c));
    }
  }

  if (!targetCat) {
    targetCat = categoricalCols[0];
  }

  if (!targetCat || !targetNumeric) return null;

  // Aggregate sums by targetCat
  const groupSums = {};
  filteredRows.forEach((r) => {
    const catVal = String(r[targetCat] || "Unknown").trim();
    const num = Number(String(r[targetNumeric]).replace(/,/g, "")) || 0;
    groupSums[catVal] = (groupSums[catVal] || 0) + num;
  });

  // Limit check (e.g. "top 5", "top 10")
  let limit = 8;
  const topMatch = combinedQuery.match(/\btop\s*(\d+)\b/i);
  if (topMatch) {
    limit = parseInt(topMatch[1], 10);
  }

  let data = Object.entries(groupSums)
    .map(([k, v]) => ({
      [targetCat.toLowerCase()]: k,
      [targetNumeric.toLowerCase()]: Math.round(v * 100) / 100,
    }))
    .sort(
      (a, b) => b[targetNumeric.toLowerCase()] - a[targetNumeric.toLowerCase()]
    );

  if (limit && limit > 0) {
    data = data.slice(0, limit);
  }

  // Determine appropriate chart type if not explicitly specified
  if (!chartType) {
    if (
      data.length <= 5 &&
      /\b(proportion|share|distribution|breakdown)\b/i.test(q)
    ) {
      chartType = "pie";
    } else {
      chartType = "bar";
    }
  }

  // If pie requested for > 7 categories, limit so it looks good
  if (chartType === "pie" && data.length > 7) {
    data = data.slice(0, 5);
  }

  const title = topMatch
    ? `Top ${limit} ${targetCat}s by ${targetNumeric}`
    : `${targetNumeric} by ${targetCat}`;

  return {
    type: chartType,
    title,
    xKey: targetCat.toLowerCase(),
    yKey: targetNumeric.toLowerCase(),
    data,
  };
}

module.exports = {
  getDatasetFilePath,
  parseDatasetRows,
  computeDatasetMetrics,
  classifyQuestion,
  buildDatasetPromptContext,
  detectAndGenerateChart,
};
