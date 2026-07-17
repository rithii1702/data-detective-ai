import {
  Sparkles,
  BarChart3,
  FileText,
  Brain,
  TrendingUp,
  Database,
  BrushCleaning,
  AlertTriangle,
  LineChart,
} from "lucide-react";

type Props = {
  onSelect: (text: string) => void;
};

const actions = [
  {
    title: "Explain Dataset",
    icon: Sparkles,
    prompt: "Explain my dataset in simple words.",
    color: "bg-violet-500",
  },
  {
    title: "Dataset Summary",
    icon: Database,
    prompt: "Give me the complete dataset summary.",
    color: "bg-blue-500",
  },
  {
    title: "Business Insights",
    icon: Brain,
    prompt: "Give me business insights from this dataset.",
    color: "bg-pink-500",
  },
  {
    title: "Find Trends",
    icon: TrendingUp,
    prompt: "Find important trends in the dataset.",
    color: "bg-green-500",
  },
  {
    title: "Charts",
    icon: BarChart3,
    prompt: "Recommend charts for this dataset.",
    color: "bg-orange-500",
  },
  {
    title: "Generate Report",
    icon: FileText,
    prompt: "Generate a detailed report.",
    color: "bg-slate-600",
  },
  {
    title: "Clean Dataset",
    icon: BrushCleaning,
    prompt: "Clean the dataset and suggest improvements.",
    color: "bg-cyan-500",
  },
  {
    title: "Outliers",
    icon: AlertTriangle,
    prompt: "Detect outliers in the dataset.",
    color: "bg-red-500",
  },
  {
    title: "Predict",
    icon: LineChart,
    prompt: "Predict future trends from this dataset.",
    color: "bg-emerald-500",
  },
];

export default function QuickActions({ onSelect }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <button
            key={action.title}
            onClick={() => onSelect(action.prompt)}
            className="rounded-2xl border bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-zinc-900"
          >
            <div
              className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${action.color} text-white`}
            >
              <Icon size={22} />
            </div>

            <h3 className="font-semibold text-lg">
              {action.title}
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Click to let Detective AI investigate automatically.
            </p>
          </button>
        );
      })}
    </div>
  );
}