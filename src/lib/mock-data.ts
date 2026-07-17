// Placeholder mock data for Data Detective AI UI
export const kpis = [
  { label: "Datasets Uploaded", value: "128", trend: "+12.4%", trendUp: true, spark: [4, 6, 5, 8, 7, 9, 11, 10, 12, 14] },
  { label: "Investigations Completed", value: "342", trend: "+8.1%", trendUp: true, spark: [12, 10, 14, 13, 16, 18, 17, 20, 22, 24] },
  { label: "Insights Generated", value: "1,204", trend: "+21.7%", trendUp: true, spark: [30, 32, 28, 35, 40, 42, 45, 44, 50, 58] },
  { label: "Data Quality Score", value: "92%", trend: "-1.2%", trendUp: false, spark: [95, 94, 93, 94, 92, 91, 92, 92, 91, 92] },
];

export const recentInvestigations = [
  { dataset: "sales_q3_2025.csv", date: "Oct 12, 2025", status: "Completed", quality: 94 },
  { dataset: "customer_churn.xlsx", date: "Oct 11, 2025", status: "Processing", quality: 88 },
  { dataset: "marketing_spend.csv", date: "Oct 09, 2025", status: "Completed", quality: 96 },
  { dataset: "inventory_snapshot.csv", date: "Oct 07, 2025", status: "Failed", quality: 42 },
  { dataset: "web_traffic_sept.xlsx", date: "Oct 04, 2025", status: "Completed", quality: 91 },
  { dataset: "support_tickets.csv", date: "Oct 02, 2025", status: "Completed", quality: 89 },
];

export const uploadedFiles = [
  { name: "sales_q3_2025.csv", rows: "24,812", cols: 18, date: "Oct 12, 2025", status: "Ready" },
  { name: "customer_churn.xlsx", rows: "8,204", cols: 24, date: "Oct 11, 2025", status: "Cleaning" },
  { name: "marketing_spend.csv", rows: "1,932", cols: 11, date: "Oct 09, 2025", status: "Ready" },
  { name: "inventory_snapshot.csv", rows: "45,102", cols: 9, date: "Oct 07, 2025", status: "Error" },
];

export const revenueSeries = [
  { month: "Jan", revenue: 42000, cost: 28000 },
  { month: "Feb", revenue: 47000, cost: 31000 },
  { month: "Mar", revenue: 38500, cost: 30000 },
  { month: "Apr", revenue: 51000, cost: 33000 },
  { month: "May", revenue: 58000, cost: 34000 },
  { month: "Jun", revenue: 62000, cost: 36000 },
  { month: "Jul", revenue: 69000, cost: 39000 },
  { month: "Aug", revenue: 71000, cost: 40500 },
  { month: "Sep", revenue: 78000, cost: 42000 },
  { month: "Oct", revenue: 82000, cost: 43000 },
];

export const categoryData = [
  { name: "Retail", value: 38 },
  { name: "Wholesale", value: 24 },
  { name: "Online", value: 22 },
  { name: "Partner", value: 16 },
];

export const scatterData = Array.from({ length: 40 }, (_, i) => ({
  x: Math.round(Math.random() * 100),
  y: Math.round(Math.random() * 100),
  z: Math.round(Math.random() * 400 + 60),
  i,
}));

export const histogramData = [
  { bin: "0-10", count: 12 },
  { bin: "10-20", count: 28 },
  { bin: "20-30", count: 41 },
  { bin: "30-40", count: 58 },
  { bin: "40-50", count: 63 },
  { bin: "50-60", count: 47 },
  { bin: "60-70", count: 32 },
  { bin: "70-80", count: 19 },
  { bin: "80-90", count: 9 },
  { bin: "90-100", count: 4 },
];

export const correlationMatrix = {
  labels: ["Revenue", "Cost", "Units", "Visits", "Returns"],
  values: [
    [1.0, 0.82, 0.71, 0.44, -0.31],
    [0.82, 1.0, 0.68, 0.29, -0.22],
    [0.71, 0.68, 1.0, 0.51, -0.4],
    [0.44, 0.29, 0.51, 1.0, -0.12],
    [-0.31, -0.22, -0.4, -0.12, 1.0],
  ],
};

export const datasetPreview = {
  columns: ["order_id", "customer", "region", "product", "units", "revenue", "date"],
  rows: [
    ["A-10231", "Acme Corp", "North", "Widget Pro", 12, "$1,248.00", "2025-09-12"],
    ["A-10232", "Globex", "South", "Widget Lite", 4, "$182.40", "2025-09-12"],
    ["A-10233", "Initech", "West", "Widget Pro", 8, "$832.00", "2025-09-13"],
    ["A-10234", "Umbrella", "East", "Gadget X", 20, "$4,120.00", "2025-09-13"],
    ["A-10235", "Wayne Ent.", "North", "Widget Pro", 6, "$624.00", "2025-09-14"],
    ["A-10236", "Stark Ind.", "West", "Gadget X", 14, "$2,884.00", "2025-09-14"],
    ["A-10237", "Wonka Co.", "South", "Widget Lite", 3, "$136.80", "2025-09-15"],
    ["A-10238", "Hooli", "East", "Widget Pro", 9, "$936.00", "2025-09-15"],
  ],
};

export const insights = [
  {
    title: "Revenue dropped 18% in March",
    body: "Revenue fell primarily due to reduced sales in the South region and delayed shipments on Product B. Recovery began in April.",
    confidence: 92, category: "Revenue", severity: "High", action: "Review South region logistics performance."
  },
  {
    title: "Customer retention increased by 12%",
    body: "Cohort retention improved after the loyalty program rollout in May. The 30-day retention curve shifted upward.",
    confidence: 88, category: "Retention", severity: "Positive", action: "Expand loyalty perks to new segments."
  },
  {
    title: "Product A consistently outperforms categories",
    body: "Product A leads in gross margin and repeat purchase across all regions and channels.",
    confidence: 95, category: "Product", severity: "Positive", action: "Increase Product A inventory buffer by 15%."
  },
  {
    title: "Anomalous spike in refund rate — Sept 22",
    body: "Refunds jumped 3.4x the baseline on a single day, clustered in the West region and Gadget X SKU.",
    confidence: 81, category: "Anomaly", severity: "Medium", action: "Audit Sept 22 shipments for defect batch."
  },
];

export const reports = [
  { title: "Monthly Analysis — October 2025", type: "Executive summary", date: "Oct 12, 2025", pages: 14 },
  { title: "Sales Investigation Q3", type: "Deep-dive", date: "Oct 08, 2025", pages: 32 },
  { title: "Customer Trends & Cohorts", type: "Analytics", date: "Oct 03, 2025", pages: 21 },
  { title: "Financial Summary — YTD", type: "Financial", date: "Sep 28, 2025", pages: 18 },
];

export const historyItems = [
  { dataset: "sales_q3_2025.csv", date: "Oct 12, 2025 · 14:22", type: "EDA + Detective", duration: "2m 14s", status: "Completed" },
  { dataset: "customer_churn.xlsx", date: "Oct 11, 2025 · 10:04", type: "Cleaning", duration: "48s", status: "Completed" },
  { dataset: "marketing_spend.csv", date: "Oct 09, 2025 · 17:41", type: "EDA", duration: "1m 02s", status: "Completed" },
  { dataset: "inventory_snapshot.csv", date: "Oct 07, 2025 · 09:12", type: "Cleaning", duration: "12s", status: "Failed" },
  { dataset: "web_traffic_sept.xlsx", date: "Oct 04, 2025 · 08:30", type: "Detective", duration: "3m 06s", status: "Completed" },
];

export const teamMembers = [
  { name: "Alex Morgan", role: "Owner", email: "alex@detective.ai", initials: "AM", perm: "Admin" },
  { name: "Priya Shah", role: "Data Scientist", email: "priya@detective.ai", initials: "PS", perm: "Editor" },
  { name: "Marcus Chen", role: "Analyst", email: "marcus@detective.ai", initials: "MC", perm: "Editor" },
  { name: "Sofia Rossi", role: "PM", email: "sofia@detective.ai", initials: "SR", perm: "Viewer" },
  { name: "Jordan Lee", role: "Engineer", email: "jordan@detective.ai", initials: "JL", perm: "Viewer" },
];

export const activity = [
  { who: "Priya Shah", what: "cleaned dataset", target: "sales_q3_2025.csv", when: "2h ago" },
  { who: "Marcus Chen", what: "commented on", target: "Customer Trends report", when: "4h ago" },
  { who: "Alex Morgan", what: "shared dataset", target: "marketing_spend.csv", when: "Yesterday" },
  { who: "Sofia Rossi", what: "requested access to", target: "Financial Summary", when: "2d ago" },
];

export const suggestions = [
  "Why did sales decrease in March?",
  "Which product performs best?",
  "Show unusual customer behavior",
  "Find hidden trends in returns",
];
