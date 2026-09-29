import { useEffect, useRef, useState } from "react";
import { Bot, Send, Loader2, Minus, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AIChart, { ChartDataPayload } from "./AIChart";

type Message = {
  role: "user" | "assistant";
  content: string;
  chart?: ChartDataPayload | null;
};

const quickQuestions = [
  "Explain my dataset",
  "Give me a summary",
  "Find important trends",
  "Give business insights",
  "Recommend charts",
];

export default function DetectiveAssistant() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [previousInteractionId, setPreviousInteractionId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Detective AI 🤖\n\nI can answer general questions (SQL, Python, APIs, ML, etc.) or investigate and explain your uploaded dataset.\n\nWhat would you like to ask?",
    },
  ]);

  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    const handleOpen = (e: any) => {
      setOpen(true);
      if (e.detail?.prompt) {
        askAI(e.detail.prompt);
      }
    };
    window.addEventListener("open-detective-assistant", handleOpen);
    return () => {
      window.removeEventListener("open-detective-assistant", handleOpen);
    };
  }, [messages, loading, previousInteractionId]);

  const askAI = async (text?: string) => {
    const finalQuestion = (text || question).trim();

    if (!finalQuestion || loading) return;

    const userMessage: Message = {
      role: "user",
      content: finalQuestion,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setQuestion("");
    setLoading(true);

    try {
      const backendBaseUrl =
        (typeof import.meta !== "undefined" &&
          import.meta.env?.VITE_API_URL) ||
        "http://localhost:5000";

      const response = await fetch(`${backendBaseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: finalQuestion,
          question: finalQuestion,
          previousInteractionId: previousInteractionId,
          history: updatedMessages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        // Response wasn't JSON
      }

      if (!response.ok || !data?.success) {
        const errorDetail =
          data?.error ||
          data?.answer ||
          data?.message ||
          `Server returned error status ${response.status}`;

        setMessages([
          ...updatedMessages,
          {
            role: "assistant",
            content: `⚠️ Detective AI error: ${errorDetail}`,
          },
        ]);
        return;
      }

      // Save interaction ID for conversation memory
      if (data?.interactionId) {
        setPreviousInteractionId(data.interactionId);
      }

      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: data.answer || "No response received.",
          chart: data.chart || null,
        },
      ]);
    } catch (error: unknown) {
      console.error("Detective AI Chat error:", error);
      const errMsg =
        error instanceof Error
          ? error.message
          : "Could not connect to Detective AI backend.";
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: errMsg.includes("fetch")
            ? "❌ Could not connect to Detective AI backend. Please verify the backend server is running at http://localhost:5000."
            : `❌ ${errMsg}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Robot */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed bottom-6 right-6 z-[9999]"
          >
            <div className="relative">

              {/* Greeting bubble */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-20 right-0 w-56 rounded-2xl border bg-white p-4 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />

                  <div>
                    <p className="text-sm font-semibold">
                      Hi! I'm Detective AI 🤖
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Ask me anything or explore your data.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Robot button */}
              <motion.button
                onClick={() => setOpen(true)}
                animate={{
                  y: [0, -6, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-2xl ring-4 ring-primary/20"
              >
                <Bot className="h-8 w-8" />
              </motion.button>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.8,
              y: 40,
              transformOrigin: "bottom right",
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
              y: 40,
            }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-6 right-6 z-[9999] flex h-[600px] w-[390px] flex-col overflow-hidden rounded-3xl border bg-background shadow-2xl"
          >

            {/* Header */}
            <div className="flex items-center justify-between bg-primary p-5 text-white">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
                  <Bot className="h-6 w-6" />
                </div>

                <div>
                  <h3 className="font-bold">
                    Detective AI
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-white/80">
                    <span className="h-2 w-2 rounded-full bg-green-400" />
                    AI Data Analyst
                  </div>
                </div>

              </div>

              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 hover:bg-white/10"
              >
                <Minus className="h-5 w-5" />
              </button>

            </div>

            {/* Messages */}
            <div
              ref={chatRef}
              className="flex-1 space-y-4 overflow-y-auto bg-muted/20 p-4"
            >

              {messages.map((message, index) => (

                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${
                    message.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >

                  <div
                    className={`${
                      message.chart ? "max-w-[95%] w-full" : "max-w-[85%]"
                    } rounded-2xl p-4 ${
                      message.role === "user"
                        ? "bg-primary text-white"
                        : "border bg-background shadow-sm"
                    }`}
                  >

                    {message.role === "assistant" && (
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                        <Bot className="h-4 w-4 text-primary" />
                        Detective AI
                      </div>
                    )}

                    <p className="whitespace-pre-wrap text-sm leading-6">
                      {message.content}
                    </p>

                    {message.chart && (
                      <AIChart chart={message.chart} />
                    )}

                  </div>

                </motion.div>

              ))}

              {loading && (
                <div className="flex items-center gap-2 rounded-2xl border bg-background p-4 text-sm">
                  <Bot className="h-5 w-5 text-primary" />

                  <span>
                    Detective AI is thinking...
                  </span>

                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}

            </div>

            {/* Quick Questions */}
            {messages.length === 1 && !loading && (
              <div className="border-t bg-background p-3">

                <p className="mb-2 text-xs font-semibold text-muted-foreground">
                  TRY ASKING
                </p>

                <div className="flex flex-wrap gap-2">

                  {quickQuestions.map((item) => (
                    <button
                      key={item}
                      onClick={() => askAI(item)}
                      className="rounded-full border px-3 py-1.5 text-xs transition hover:bg-muted"
                    >
                      {item}
                    </button>
                  ))}

                </div>

              </div>
            )}

            {/* Input */}
            <div className="border-t bg-background p-3">

              <div className="flex gap-2">

                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      askAI();
                    }
                  }}
                  placeholder="Ask anything or explore your dataset..."
                  className="min-w-0 flex-1 rounded-xl border bg-muted/30 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />

                <button
                  onClick={() => askAI()}
                  disabled={loading || !question.trim()}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>

              </div>

            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}