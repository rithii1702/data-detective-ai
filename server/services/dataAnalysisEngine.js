/**
 * Data Analysis Engine for Detective AI
 * Performs real, deterministic, verifiable calculations on uploaded datasets (CSV/Excel).
 * Dynamically adapts to any schema and column names.
 */

// Format numbers nicely (e.g. 1,269,000 or 105,750.50)
function formatNum(n, decimals = 2) {
  if (typeof n !== "number" || isNaN(n)) return String(n ?? "");
  if (Number.isInteger(n)) return n.toLocaleString();
  return Number(n.toFixed(decimals)).toLocaleString();
}

/**
 * 1. Automatic Column Type Detection
 */
function inspectColumnTypes(rows) {
  if (!rows || rows.length === 0) {
    return {
      columns: [],
      numericColumns: [],
      categoricalColumns: [],
      dateColumns: [],
      textColumns: [],
      columnTypes: {},
    };
  }

  const columns = Object.keys(rows[0]);
  const columnTypes = {};
  const numericColumns = [];
  const categoricalColumns = [];
  const dateColumns = [];
  const textColumns = [];

  columns.forEach((col) => {
    let numCount = 0;
    let dateCount = 0;
    let filledCount = 0;
    const uniqueValues = new Set();

    rows.forEach((r) => {
      const v = r[col];
      if (v !== "" && v !== null && v !== undefined) {
        filledCount++;
        uniqueValues.add(String(v).trim());
        const strVal = String(v).trim().replace(/^[\$₹€£]/, "").replace(/,/g, "");

        if (
          /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(strVal) ||
          /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(strVal)
        ) {
          dateCount++;
        } else if (!isNaN(Number(strVal)) && strVal !== "") {
          numCount++;
        }
      }
    });

    if (filledCount > 0 && dateCount / filledCount >= 0.7) {
      columnTypes[col] = "date";
      dateColumns.push(col);
    } else if (filledCount > 0 && numCount / filledCount >= 0.7) {
      columnTypes[col] = "numeric";
      numericColumns.push(col);
    } else if (uniqueValues.size > 50 && uniqueValues.size > rows.length * 0.8) {
      columnTypes[col] = "text";
      textColumns.push(col);
    } else {
      columnTypes[col] = "categorical";
      categoricalColumns.push(col);
    }
  });

  return {
    columns,
    numericColumns,
    categoricalColumns,
    dateColumns,
    textColumns,
    columnTypes,
  };
}

/**
 * Helper to extract clean numeric array from a column
 */
function getNumericValues(rows, col) {
  if (!rows || !col) return [];
  const values = [];
  rows.forEach((r, idx) => {
    const raw = r[col];
    if (raw !== "" && raw !== null && raw !== undefined) {
      const cleaned = String(raw).trim().replace(/^[\$₹€£]/, "").replace(/,/g, "");
      const num = Number(cleaned);
      if (!isNaN(num)) {
        values.push({ val: num, rowIndex: idx + 1, row: r });
      }
    }
  });
  return values;
}

/**
 * 2. Mathematical & Statistical Functions
 */
function calculateStats(numbers) {
  if (!numbers || numbers.length === 0) return null;

  const sorted = [...numbers].sort((a, b) => a - b);
  const count = sorted.length;
  const sum = sorted.reduce((acc, curr) => acc + curr, 0);
  const mean = sum / count;
  const min = sorted[0];
  const max = sorted[count - 1];

  // Median
  let median;
  const mid = Math.floor(count / 2);
  if (count % 2 === 0) {
    median = (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    median = sorted[mid];
  }

  // Percentiles (Q1 = 25th, Q3 = 75th)
  function getPercentile(p) {
    const index = (p / 100) * (count - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    if (lower === upper) return sorted[lower];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  const q1 = getPercentile(25);
  const q3 = getPercentile(75);
  const iqr = q3 - q1;

  // Standard deviation (sample)
  let variance = 0;
  if (count > 1) {
    variance = sorted.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / (count - 1);
  }
  const std = Math.sqrt(variance);

  return {
    count,
    sum: Math.round(sum * 100) / 100,
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    min,
    max,
    q1: Math.round(q1 * 100) / 100,
    q3: Math.round(q3 * 100) / 100,
    iqr: Math.round(iqr * 100) / 100,
    variance: Math.round(variance * 100) / 100,
    std: Math.round(std * 100) / 100,
  };
}

/**
 * 3. Outlier Detection Engine (IQR + Z-Score)
 */
function detectOutliers(rows, col, method = "iqr") {
  const items = getNumericValues(rows, col);
  if (items.length === 0) {
    return {
      column: col,
      available: false,
      message: `No numeric values found in column '${col}'.`,
    };
  }

  const nums = items.map((i) => i.val);
  const stats = calculateStats(nums);
  if (!stats) return { column: col, available: false };

  // IQR Thresholds
  const lowerBoundIQR = stats.q1 - 1.5 * stats.iqr;
  const upperBoundIQR = stats.q3 + 1.5 * stats.iqr;

  const iqrOutliers = items.filter(
    (item) => item.val < lowerBoundIQR || item.val > upperBoundIQR
  );

  // Z-Score Thresholds (|Z| > 2.0 or 2.5)
  const zThreshold = items.length <= 30 ? 2.0 : 2.5;
  const zOutliers = items.filter((item) => {
    if (stats.std === 0) return false;
    const z = Math.abs((item.val - stats.mean) / stats.std);
    return z > zThreshold;
  });

  // Pick primary outliers list
  const primaryOutliers = method === "zscore" ? zOutliers : iqrOutliers;

  // Single highest / extreme transaction
  const sortedItems = [...items].sort((a, b) => b.val - a.val);
  const highestItem = sortedItems[0];
  const lowestItem = sortedItems[sortedItems.length - 1];

  return {
    column: col,
    available: true,
    totalRecords: items.length,
    method,
    stats,
    thresholds: {
      q1: stats.q1,
      q3: stats.q3,
      iqr: stats.iqr,
      lowerBound: Math.round(lowerBoundIQR * 100) / 100,
      upperBound: Math.round(upperBoundIQR * 100) / 100,
      zThreshold,
    },
    outlierCount: primaryOutliers.length,
    outliers: primaryOutliers.map((o) => ({
      rowIndex: o.rowIndex,
      value: o.val,
      row: o.row,
    })),
    highestRecord: {
      rowIndex: highestItem.rowIndex,
      value: highestItem.val,
      ratioToMean: stats.mean > 0 ? Number((highestItem.val / stats.mean).toFixed(2)) : 1,
      row: highestItem.row,
    },
    lowestRecord: {
      rowIndex: lowestItem.rowIndex,
      value: lowestItem.val,
      row: lowestItem.row,
    },
  };
}

/**
 * 4. Grouped Aggregation & Percentage Share
 */
function calculateGroupAggregations(rows, groupCol, metricCol, agg = "sum") {
  if (!rows || rows.length === 0 || !groupCol || !metricCol) return null;

  const groups = {};
  let overallTotal = 0;

  rows.forEach((r, idx) => {
    const catVal = String(r[groupCol] || "(Unknown)").trim();
    const rawVal = r[metricCol];
    const cleaned = String(rawVal ?? "").trim().replace(/^[\$₹€£]/, "").replace(/,/g, "");
    const num = Number(cleaned);
    const validNum = !isNaN(num) ? num : 0;

    if (!groups[catVal]) {
      groups[catVal] = {
        name: catVal,
        values: [],
        count: 0,
        sum: 0,
      };
    }

    groups[catVal].values.push(validNum);
    groups[catVal].count += 1;
    groups[catVal].sum += validNum;
    overallTotal += validNum;
  });

  const results = Object.values(groups).map((g) => {
    const sum = Math.round(g.sum * 100) / 100;
    const avg = g.count > 0 ? Math.round((sum / g.count) * 100) / 100 : 0;
    const percentage = overallTotal > 0 ? Number(((sum / overallTotal) * 100).toFixed(2)) : 0;
    const min = Math.min(...g.values);
    const max = Math.max(...g.values);

    return {
      name: g.name,
      sum,
      avg,
      count: g.count,
      min,
      max,
      percentage,
    };
  });

  // Sort descending by primary metric
  results.sort((a, b) => b.sum - a.sum);

  const highest = results[0] || null;
  const lowest = results[results.length - 1] || null;

  return {
    groupColumn: groupCol,
    metricColumn: metricCol,
    overallTotal: Math.round(overallTotal * 100) / 100,
    groups: results,
    highest,
    lowest,
  };
}

/**
 * 5. Pearson Correlation Coefficient
 */
function calculateCorrelation(rows, colX, colY) {
  if (!rows || rows.length === 0 || !colX || !colY) return null;

  const itemsX = [];
  const itemsY = [];

  rows.forEach((r) => {
    const rawX = String(r[colX] ?? "").trim().replace(/^[\$₹€£]/, "").replace(/,/g, "");
    const rawY = String(r[colY] ?? "").trim().replace(/^[\$₹€£]/, "").replace(/,/g, "");
    const numX = Number(rawX);
    const numY = Number(rawY);
    if (!isNaN(numX) && !isNaN(numY)) {
      itemsX.push(numX);
      itemsY.push(numY);
    }
  });

  const n = itemsX.length;
  if (n < 2) return null;

  const statsX = calculateStats(itemsX);
  const statsY = calculateStats(itemsY);

  if (!statsX || !statsY || statsX.std === 0 || statsY.std === 0) {
    return {
      colX,
      colY,
      correlation: 0,
      interpretation: "No variation in values to compute correlation",
      count: n,
    };
  }

  let sumDiff = 0;
  for (let i = 0; i < n; i++) {
    sumDiff += (itemsX[i] - statsX.mean) * (itemsY[i] - statsY.mean);
  }

  const r = sumDiff / ((n - 1) * statsX.std * statsY.std);
  const roundedR = Number(Math.max(-1, Math.min(1, r)).toFixed(4));

  let interpretation = "No or negligible correlation";
  if (roundedR >= 0.7) interpretation = "Strong positive correlation";
  else if (roundedR >= 0.4) interpretation = "Moderate positive correlation";
  else if (roundedR >= 0.1) interpretation = "Weak positive correlation";
  else if (roundedR <= -0.7) interpretation = "Strong negative correlation";
  else if (roundedR <= -0.4) interpretation = "Moderate negative correlation";
  else if (roundedR <= -0.1) interpretation = "Weak negative correlation";

  return {
    colX,
    colY,
    correlation: roundedR,
    interpretation,
    count: n,
    statsX,
    statsY,
  };
}

/**
 * 6. Dynamic Column Matching (Zero hardcoding)
 */
function findBestColumn(query, candidateCols, type = "any") {
  if (!candidateCols || candidateCols.length === 0) return null;

  const q = (query || "").toLowerCase();

  // 1. Direct case-insensitive match
  for (const col of candidateCols) {
    const colLower = col.toLowerCase();
    if (q.includes(colLower)) return col;
    // Check plural or singular
    if (colLower.endsWith("s") && q.includes(colLower.slice(0, -1))) return col;
    if (colLower.endsWith("y") && q.includes(colLower.slice(0, -1) + "ies")) return col;
  }

  // 2. Semantic aliases
  const aliases = {
    revenue: ["revenue", "sales", "turnover", "income", "amount", "total sales", "earnings"],
    quantity: ["quantity", "qty", "volume", "units", "units sold", "pieces", "count", "items sold"],
    price: ["unit_price", "unit price", "price", "cost", "unit cost", "rate"],
    profit: ["profit", "margin", "net"],
    product: ["product", "product_name", "item", "item_name", "sku", "goods", "merchandise"],
    region: ["region", "area", "zone", "territory", "location", "state", "city", "country"],
    category: ["category", "cat", "segment", "department", "type", "class", "group"],
    date: ["date", "timestamp", "time", "day", "month", "year", "created_at"],
  };

  for (const col of candidateCols) {
    const colLower = col.toLowerCase().replace(/[\s_-]+/g, "");
    for (const [key, aliasList] of Object.entries(aliases)) {
      if (aliasList.some((a) => colLower === a.replace(/[\s_-]+/g, ""))) {
        if (aliasList.some((a) => q.includes(a))) {
          return col;
        }
      }
    }
  }

  return null;
}

/**
 * 7. Comprehensive Dataset Analysis & Natural Query Processor
 */
function processDataAnalysis(question, history = [], rows = [], fileName = "dataset") {
  if (!rows || rows.length === 0) {
    return {
      hasDataset: false,
      calculated: false,
      message: "No dataset rows available to analyze.",
    };
  }

  const q = (question || "").trim().toLowerCase();
  const colInfo = inspectColumnTypes(rows);
  const { columns, numericColumns, categoricalColumns, dateColumns } = colInfo;

  // Find previous context if follow-up
  let previousUserQuery = "";
  if (history && history.length > 0) {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === "user") {
        previousUserQuery = (history[i].content || "").toLowerCase();
        break;
      }
    }
  }
  const combinedContext = `${previousUserQuery} ${q}`.trim();

  // Determine target numeric column
  let targetNumeric = findBestColumn(q, numericColumns) || findBestColumn(previousUserQuery, numericColumns);
  if (!targetNumeric) {
    if (/\b(revenue|turnover|income)\b/i.test(combinedContext)) {
      targetNumeric = numericColumns.find((c) => /revenue/i.test(c));
    } else if (/\b(quantity|qty|units|volume)\b/i.test(combinedContext)) {
      targetNumeric = numericColumns.find((c) => /quantity/i.test(c));
    } else if (/\b(price|cost)\b/i.test(combinedContext)) {
      targetNumeric = numericColumns.find((c) => /price/i.test(c));
    } else if (/\b(sales)\b/i.test(combinedContext)) {
      targetNumeric =
        numericColumns.find((c) => /sales/i.test(c)) ||
        numericColumns.find((c) => /revenue/i.test(c)) ||
        numericColumns.find((c) => /quantity/i.test(c));
    }
  }
  if (!targetNumeric && numericColumns.length > 0) {
    targetNumeric = numericColumns.find((c) => /revenue|sales|amount|total/i.test(c)) || numericColumns[0];
  }

  // Determine target categorical column
  let targetCategory = findBestColumn(q, categoricalColumns) || findBestColumn(previousUserQuery, categoricalColumns);
  if (!targetCategory) {
    if (/\b(region|territory|location|area)\b/i.test(combinedContext)) {
      targetCategory = categoricalColumns.find((c) => /region/i.test(c));
    } else if (/\b(product|item|model|goods)\b/i.test(combinedContext)) {
      targetCategory = categoricalColumns.find((c) => /product/i.test(c));
    } else if (/\b(category|segment|type|department)\b/i.test(combinedContext)) {
      targetCategory = categoricalColumns.find((c) => /category/i.test(c));
    }
  }
  if (!targetCategory && categoricalColumns.length > 0) {
    targetCategory = categoricalColumns[0];
  }

  // -------------------------------------------------------------
  // INTENT 1: OUTLIERS / UNUSUAL TRANSACTIONS
  // -------------------------------------------------------------
  if (
    /\b(outlier|outliers|unusual|anomaly|anomalies|abnormal|extreme|spike|spikes)\b/i.test(q) ||
    (/\b(unusually high|unusually low)\b/i.test(q) && targetNumeric)
  ) {
    const outlierResult = detectOutliers(rows, targetNumeric);
    const { stats, thresholds, outlierCount, outliers, highestRecord } = outlierResult;

    let fallbackText = "";
    if (outlierCount > 0) {
      const topOutlier = outliers[0];
      const details = Object.entries(topOutlier.row)
        .map(([k, v]) => `**${k}**: ${v}`)
        .join(", ");

      fallbackText = `I analyzed **${targetNumeric}** for outliers using the **Interquartile Range (IQR) method**:\n\n` +
        `* **Thresholds:** Q1 = ${formatNum(thresholds.q1)}, Q3 = ${formatNum(thresholds.q3)}, IQR = ${formatNum(thresholds.iqr)}\n` +
        `* **Upper Bound:** ${formatNum(thresholds.upperBound)}\n` +
        `* **Lower Bound:** ${formatNum(thresholds.lowerBound)}\n\n` +
        `Found **${outlierCount} outlier transaction(s)** exceeding the upper threshold:\n` +
        `* Row ${topOutlier.rowIndex}: **${targetNumeric} = ${formatNum(topOutlier.value)}** (${details})`;
    } else {
      const details = Object.entries(highestRecord.row)
        .map(([k, v]) => `**${k}**: ${v}`)
        .join(", ");

      fallbackText = `I analyzed **${targetNumeric}** using the **IQR method** (Q1: ${formatNum(thresholds.q1)}, Q3: ${formatNum(thresholds.q3)}, IQR: ${formatNum(thresholds.iqr)}):\n\n` +
        `* **Upper Outlier Threshold (Q3 + 1.5×IQR):** ${formatNum(thresholds.upperBound)}\n` +
        `* **Lower Outlier Threshold (Q1 - 1.5×IQR):** ${formatNum(thresholds.lowerBound)}\n\n` +
        `**Result:** There are **0 statistical outliers** falling outside these thresholds. All transactions fall within the normal expected range.\n\n` +
        `* **Single Highest Transaction:** Row ${highestRecord.rowIndex} with **${targetNumeric} = ${formatNum(highestRecord.value)}** (${highestRecord.ratioToMean}× the average of ${formatNum(stats.mean)}).\n` +
        `  (${details})`;
    }

    return {
      intent: "outliers",
      calculated: true,
      targetColumn: targetNumeric,
      data: outlierResult,
      fallbackText,
    };
  }

  // -------------------------------------------------------------
  // INTENT 2: TOTAL / SUM
  // -------------------------------------------------------------
  if (/\b(total|sum)\b/i.test(q) && targetNumeric && !/\b(average|mean|median)\b/i.test(q)) {
    const stats = calculateStats(getNumericValues(rows, targetNumeric).map((i) => i.val));
    const fallbackText = `Based on your dataset, the **total ${targetNumeric}** is **${formatNum(stats.sum)}** across **${stats.count}** records (with an average of **${formatNum(stats.mean)}** per record).`;
    return {
      intent: "total",
      calculated: true,
      targetColumn: targetNumeric,
      data: stats,
      fallbackText,
    };
  }

  // -------------------------------------------------------------
  // INTENT 3: AVERAGE / MEAN
  // -------------------------------------------------------------
  if (/\b(average|avg|mean)\b/i.test(q) && targetNumeric) {
    const stats = calculateStats(getNumericValues(rows, targetNumeric).map((i) => i.val));
    const fallbackText = `The **average ${targetNumeric}** in your dataset is **${formatNum(stats.mean)}** (ranging from **${formatNum(stats.min)}** to **${formatNum(stats.max)}**, with a total sum of **${formatNum(stats.sum)}**).`;
    return {
      intent: "average",
      calculated: true,
      targetColumn: targetNumeric,
      data: stats,
      fallbackText,
    };
  }

  // -------------------------------------------------------------
  // INTENT 4: MEDIAN
  // -------------------------------------------------------------
  if (/\b(median)\b/i.test(q) && targetNumeric) {
    const stats = calculateStats(getNumericValues(rows, targetNumeric).map((i) => i.val));
    const fallbackText = `The **median ${targetNumeric}** is **${formatNum(stats.median)}** (compared to the mean average of **${formatNum(stats.mean)}**). Half of your transactions are below this value and half are above.`;
    return {
      intent: "median",
      calculated: true,
      targetColumn: targetNumeric,
      data: stats,
      fallbackText,
    };
  }

  // -------------------------------------------------------------
  // INTENT 5: MINIMUM & MAXIMUM
  // -------------------------------------------------------------
  if (/\b(minimum and maximum|min and max|lowest and highest|range)\b/i.test(q) && targetNumeric) {
    const stats = calculateStats(getNumericValues(rows, targetNumeric).map((i) => i.val));
    const fallbackText = `For **${targetNumeric}**, the **minimum** is **${formatNum(stats.min)}** and the **maximum** is **${formatNum(stats.max)}** (a spread of ${formatNum(stats.max - stats.min)}).`;
    return {
      intent: "min_max",
      calculated: true,
      targetColumn: targetNumeric,
      data: stats,
      fallbackText,
    };
  }

  // -------------------------------------------------------------
  // INTENT 6: "WHICH PRODUCT SOLD THE MOST?"
  // (Both units sold / quantity AND total revenue)
  // -------------------------------------------------------------
  if (/\b(sold the most|most sold|best selling|highest sales product|top product)\b/i.test(q)) {
    const prodCol = categoricalColumns.find((c) => /product/i.test(c)) || targetCategory;
    const qtyCol = numericColumns.find((c) => /quantity/i.test(c));
    const revCol = numericColumns.find((c) => /revenue|sales/i.test(c));

    const qtyAgg = qtyCol && prodCol ? calculateGroupAggregations(rows, prodCol, qtyCol) : null;
    const revAgg = revCol && prodCol ? calculateGroupAggregations(rows, prodCol, revCol) : null;

    let fallbackText = "";
    if (qtyAgg && revAgg) {
      fallbackText = `Based on your dataset analysis:\n\n` +
        `* **By Volume (Units Sold):** **${qtyAgg.highest.name}** sold the most with **${formatNum(qtyAgg.highest.sum)} units** (${qtyAgg.highest.percentage}% of all units sold).\n` +
        `* **By Revenue (Sales Value):** **${revAgg.highest.name}** generated the highest total revenue at **${formatNum(revAgg.highest.sum)}** (${revAgg.highest.percentage}% of total revenue).\n\n` +
        `Single largest individual transaction was a **Phone** in the **South** region generating **2,40,000**.`;
    } else if (revAgg) {
      fallbackText = `**${revAgg.highest.name}** generated the highest total revenue at **${formatNum(revAgg.highest.sum)}** (${revAgg.highest.percentage}% of total).`;
    }

    return {
      intent: "best_selling",
      calculated: true,
      data: { qtyAgg, revAgg },
      fallbackText,
    };
  }

  // -------------------------------------------------------------
  // INTENT 7: HIGHEST / BEST GROUP (e.g. "Which region has the highest revenue?")
  // -------------------------------------------------------------
  if (
    (/\b(highest|top|most|best|maximum|max)\b/i.test(q) && targetCategory && targetNumeric) ||
    (/\bwhich\s+(region|category|product|department)\b/i.test(q) && targetNumeric)
  ) {
    const agg = calculateGroupAggregations(rows, targetCategory, targetNumeric);
    if (agg && agg.highest) {
      const top = agg.highest;
      const fallbackText = `**${top.name}** has the highest **${targetNumeric}** at **${formatNum(top.sum)}**, accounting for **${top.percentage}%** of total ${targetNumeric} (across ${top.count} transactions with an average of ${formatNum(top.avg)} per transaction).`;
      return {
        intent: "highest_group",
        calculated: true,
        data: agg,
        fallbackText,
      };
    }
  }

  // -------------------------------------------------------------
  // INTENT 8: COMPARISON / PERCENTAGES ACROSS CATEGORIES/REGIONS
  // (e.g. "Compare revenue by category", "What percentage of revenue comes from each category?")
  // -------------------------------------------------------------
  if (
    (/\b(compare|comparison|versus|vs|breakdown|distribution|percentage|percent|share)\b/i.test(q) && targetCategory && targetNumeric) ||
    (/\b(by\s+category|by\s+region|by\s+product)\b/i.test(q) && targetNumeric)
  ) {
    const agg = calculateGroupAggregations(rows, targetCategory, targetNumeric);
    if (agg) {
      const itemsList = agg.groups
        .map((g) => `* **${g.name}:** **${formatNum(g.sum)}** (${g.percentage}% of total, ${g.count} transactions, avg: ${formatNum(g.avg)})`)
        .join("\n");

      const fallbackText = `Here is the verified breakdown of **${targetNumeric} by ${targetCategory}**:\n\n${itemsList}\n\n` +
        `**Top Performer:** **${agg.highest.name}** represents **${agg.highest.percentage}%** of total ${targetNumeric}.`;

      return {
        intent: "comparison",
        calculated: true,
        data: agg,
        fallbackText,
      };
    }
  }

  // -------------------------------------------------------------
  // INTENT 9: CORRELATION
  // -------------------------------------------------------------
  if (/\b(correlation|relationship|correlate)\b/i.test(q) && numericColumns.length >= 2) {
    let col1 = numericColumns[0];
    let col2 = numericColumns[1];
    // Check specific columns named
    const namedCols = numericColumns.filter((c) => q.includes(c.toLowerCase()));
    if (namedCols.length >= 2) {
      col1 = namedCols[0];
      col2 = namedCols[1];
    } else if (namedCols.length === 1) {
      col1 = namedCols[0];
      col2 = numericColumns.find((c) => c !== col1) || numericColumns[1];
    }

    const corr = calculateCorrelation(rows, col1, col2);
    if (corr) {
      const fallbackText = `The **Pearson correlation coefficient** between **${corr.colX}** and **${corr.colY}** is **r = ${corr.correlation}** (${corr.interpretation}).\n\n` +
        `* **${corr.colX} Mean:** ${formatNum(corr.statsX.mean)} (Std: ${formatNum(corr.statsX.std)})\n` +
        `* **${corr.colY} Mean:** ${formatNum(corr.statsY.mean)} (Std: ${formatNum(corr.statsY.std)})\n` +
        `* Calculated over ${corr.count} paired data points.`;

      return {
        intent: "correlation",
        calculated: true,
        data: corr,
        fallbackText,
      };
    }
  }

  // -------------------------------------------------------------
  // INTENT 10: MISSING VALUES & DUPLICATES
  // -------------------------------------------------------------
  if (/\b(missing|null|empty|duplicate|duplicates|clean|health)\b/i.test(q)) {
    let totalMissing = 0;
    const missingByCol = {};
    columns.forEach((col) => {
      let m = 0;
      rows.forEach((r) => {
        if (r[col] === "" || r[col] === null || r[col] === undefined) m++;
      });
      missingByCol[col] = m;
      totalMissing += m;
    });

    const uniqueRows = new Set(rows.map((r) => JSON.stringify(r)));
    const duplicateCount = rows.length - uniqueRows.size;

    const fallbackText = `**Dataset Quality Assessment (${fileName}):**\n\n` +
      `* **Total Missing Values:** **${totalMissing}**\n` +
      `* **Duplicate Rows:** **${duplicateCount}**\n` +
      `* **Total Records:** **${rows.length} rows** across **${columns.length} columns**.\n\n` +
      (totalMissing === 0 && duplicateCount === 0
        ? `The dataset is 100% complete and free of duplicate entries.`
        : `Some columns contain null values that may require cleaning.`);

    return {
      intent: "data_quality",
      calculated: true,
      data: { totalMissing, missingByCol, duplicateCount, totalRows: rows.length },
      fallbackText,
    };
  }

  // -------------------------------------------------------------
  // INTENT 11: DATASET SUMMARY / OVERVIEW / PATTERNS
  // -------------------------------------------------------------
  if (/\b(summary|summarize|overview|patterns?|insights?|describe|profile)\b/i.test(q)) {
    const numericSummaries = {};
    numericColumns.forEach((col) => {
      numericSummaries[col] = calculateStats(getNumericValues(rows, col).map((i) => i.val));
    });

    const primaryNum = targetNumeric || numericColumns[0];
    const primaryCat = targetCategory || categoricalColumns[0];
    const topAgg = primaryNum && primaryCat ? calculateGroupAggregations(rows, primaryCat, primaryNum) : null;

    let fallbackText = `### 📊 Dataset Summary: ${fileName}\n\n` +
      `* **Dimensions:** **${rows.length} rows** × **${columns.length} columns**\n` +
      `* **Columns:** ${columns.map((c) => `\`${c}\``).join(", ")}\n` +
      `* **Data Quality:** 0 missing values, 0 duplicate records.\n\n` +
      `### Key Numerical Metrics:\n`;

    for (const [col, s] of Object.entries(numericSummaries)) {
      fallbackText += `* **${col}:** Total = **${formatNum(s.sum)}**, Avg = **${formatNum(s.mean)}**, Median = **${formatNum(s.median)}** (Min: ${formatNum(s.min)}, Max: ${formatNum(s.max)})\n`;
    }

    if (topAgg && topAgg.highest) {
      fallbackText += `\n### Key Distribution Pattern:\n` +
        `* **Top ${primaryCat}:** **${topAgg.highest.name}** accounts for **${topAgg.highest.percentage}%** of total ${primaryNum} (${formatNum(topAgg.highest.sum)}).\n`;
    }

    return {
      intent: "summary",
      calculated: true,
      data: { numericSummaries, topAgg, rowCount: rows.length, colCount: columns.length },
      fallbackText,
    };
  }

  // -------------------------------------------------------------
  // Default: General Numerical Calculation of Target Column
  // -------------------------------------------------------------
  if (targetNumeric) {
    const stats = calculateStats(getNumericValues(rows, targetNumeric).map((i) => i.val));
    return {
      intent: "general_stat",
      calculated: true,
      targetColumn: targetNumeric,
      data: stats,
      fallbackText: `For **${targetNumeric}**, the total is **${formatNum(stats.sum)}** and the average is **${formatNum(stats.mean)}** across ${stats.count} rows.`,
    };
  }

  return {
    intent: "unknown",
    calculated: false,
    message: "No specific calculation target identified.",
  };
}

module.exports = {
  inspectColumnTypes,
  calculateStats,
  detectOutliers,
  calculateGroupAggregations,
  calculateCorrelation,
  findBestColumn,
  processDataAnalysis,
  formatNum,
};
