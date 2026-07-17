import InvestigationCard from "@/components/detective/InvestigationCard";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  Bot,
  User,
  Send,
  Loader2,
  Sparkles,
  Database,
  BarChart3,
  Brain,
  FileText,
  TrendingUp,
  AlertTriangle,
  Wand2,
  LineChart,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DatasetHealth from "@/components/detective/DatasetHealth";
import {
  PageHeader,
  SectionCard,
} from "@/components/detective/shared";

export const Route = createFileRoute("/_app/chat")({
  component: ChatPage,
});

type Message = {
  role: "user" | "assistant";
  content: string;
};

const actions = [
  {
    title: "Explain Dataset",
    icon: Sparkles,
    prompt: "Explain my dataset in simple words.",
  },
  {
    title: "Dataset Summary",
    icon: Database,
    prompt: "Give complete dataset summary.",
  },
  {
    title: "Business Insights",
    icon: Brain,
    prompt: "Give business insights.",
  },
  {
    title: "Find Trends",
    icon: TrendingUp,
    prompt: "Find important trends.",
  },
  {
    title: "Recommend Charts",
    icon: BarChart3,
    prompt: "Recommend charts.",
  },
  {
    title: "Generate Report",
    icon: FileText,
    prompt: "Generate detailed report.",
  },
  {
    title: "Clean Dataset",
    icon: Wand2,
    prompt: "Clean my dataset.",
  },
  {
    title: "Detect Outliers",
    icon: AlertTriangle,
    prompt: "Find outliers.",
  },
  {
    title: "Predict Trends",
    icon: LineChart,
    prompt: "Predict future trends.",
  },
];

function ChatPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [datasetInfo, setDatasetInfo] = useState({
  rows: 0,
  columns: 0,
  missing: 0,
  duplicates: 0,
});

useEffect(() => {
  fetch("http://localhost:5000/api/eda")
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        setDatasetInfo({
          rows: data.totalRows || 0,
          columns: data.columns?.length || 0,
          missing: data.missingValues || 0,
          duplicates: data.duplicateRows || 0,
        });
      }
    })
    .catch(console.error);
}, []);

  const chatRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "👋 Welcome to Data Detective AI.\n\nI can analyze your uploaded dataset, explain insights, recommend charts, detect outliers, generate reports and answer your questions.",
    },
  ]);

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const askAI = async (customQuestion?: string) => {
    const finalQuestion = customQuestion || question;

    if (!finalQuestion.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: finalQuestion,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);

    setQuestion("");

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: finalQuestion,
          history: updatedMessages.map(
            (m) => `${m.role}: ${m.content}`
          ),
        }),
      });

      const data = await res.json();

      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content:
            data.answer ||
            data.message ||
            "No response received.",
        },
      ]);
    } catch {
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content:
            "❌ Failed to connect to Detective AI.",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      <PageHeader
        title="🕵️ Data Detective AI"
        subtitle="Ask anything about your uploaded dataset."
      />
      <DatasetHealth
  rows={datasetInfo.rows}
  columns={datasetInfo.columns}
  missing={datasetInfo.missing}
  duplicates={datasetInfo.duplicates}
/>

      <SectionCard>

        <h2 className="mb-5 text-2xl font-bold">
          ⚡ Start Investigation
        </h2>

        <div className="grid gap-4 md:grid-cols-3">

          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <Button
                key={action.title}
                variant="outline"
                className="h-24 justify-start gap-4 rounded-2xl"
                onClick={() => askAI(action.prompt)}
              >
                <Icon size={28} />

                <div className="text-left">
                  <div className="font-semibold">
                    {action.title}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Click to investigate
                  </div>
                </div>

              </Button>
            );
          })}

        </div>

      </SectionCard>

      <SectionCard>

        <div
          ref={chatRef}
          className="h-[520px] overflow-y-auto rounded-2xl border bg-muted/20 p-6 space-y-5"
        >
          {messages.map((msg, index) => (
  <div
    key={index}
    className={`flex ${
      msg.role === "user"
        ? "justify-end"
        : "justify-start"
    }`}
  >
    <div
  className={
    msg.role === "assistant"
      ? "w-full"
      : "max-w-[75%] rounded-2xl p-5 shadow-sm bg-primary text-white"
  }
>
      {msg.role === "assistant" ? (
  <InvestigationCard answer={msg.content} />
) : (
  <>
    <div className="mb-3 flex items-center gap-2">
      <User className="h-5 w-5" />
      <span className="font-semibold">You</span>
    </div>

    <p className="whitespace-pre-wrap leading-7">
      {msg.content}
    </p>
  </>
)}
    </div>
  </div>
))}

{loading && (
  <div className="flex items-center gap-3 rounded-2xl border bg-background p-4">
    <Loader2 className="h-5 w-5 animate-spin text-primary" />
    <span>Detective AI is thinking...</span>
  </div>
)}

</div>

<div className="mt-6 flex gap-3">
  <Input
    placeholder="Ask anything about your uploaded dataset..."
    value={question}
    onChange={(e) => setQuestion(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") askAI();
    }}
  />

  <Button
    onClick={() => askAI()}
    disabled={loading}
  >
    <Send className="mr-2 h-4 w-4" />
    {loading ? "Thinking..." : "Send"}
  </Button>
</div>

</SectionCard>

</div>
);
}

export default ChatPage;
        