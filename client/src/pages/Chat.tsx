import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { AIChatBox } from "@/components/AIChatBox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { FileText, Download, Sparkles, Mic, Image as ImageIcon, Loader2, ArrowLeft } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Message {
  id?: number;
  role: "user" | "assistant";
  content: string;
  createdAt?: Date;
}

export default function Chat() {
  const { user } = useAuth();
  const params = useParams();
  const [, navigate] = useLocation();
  const documentId = parseInt(params.id || "0");

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);

  // Fetch document
  const { data: documentData, isLoading: docLoading } = trpc.documents.get.useQuery(
    { documentId },
    { enabled: !!documentId }
  );
  const document = documentData || null;

  // Fetch or create chat
  const { data: chatsData } = trpc.chats.listByDocument.useQuery(
    { documentId },
    { enabled: !!documentId }
  );
  const chats = Array.isArray(chatsData) ? chatsData : chatsData ? [chatsData] : [];

  const createChatMutation = trpc.chats.create.useMutation({
    onSuccess: (result: any) => {
      setChatId(result?.id || (Array.isArray(result) ? result[0]?.id : null));
    },
  });

  const sendMessageMutation = trpc.messages.send.useMutation({
    onSuccess: (result) => {
      // Add assistant message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.response,
        },
      ]);
      setIsLoading(false);
    },
    onError: (error) => {
      toast.error(`Failed to send message: ${error.message}`);
      setIsLoading(false);
    },
  });

  const { data: messagesData } = trpc.messages.list.useQuery(
    { chatId: chatId || 0 },
    { enabled: !!chatId }
  );

  // Initialize chat
  useEffect(() => {
    if (documentId && !chatId) {
      if (chats && chats.length > 0) {
        setChatId(chats[0]?.id);
      } else {
        createChatMutation.mutate({ documentId });
      }
    }
  }, [documentId, chatId, chats]);

  // Load messages
  useEffect(() => {
    if (messagesData) {
      setMessages(
        messagesData.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: new Date(msg.createdAt),
        }))
      );
    }
  }, [messagesData]);

  const handleSendMessage = async (content: string) => {
    if (!chatId || !documentId) return;

    // Add user message
    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Send to backend
    sendMessageMutation.mutate({
      chatId,
      documentId,
      content,
    });
  };

  const summarizeMutation = trpc.summarize.useMutation({
    onSuccess: (result) => {
      toast.success("Summary generated!");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `**Document Summary:**\n\n${result.summary}`,
        },
      ]);
      setIsLoading(false);
    },
    onError: () => {
      toast.error("Failed to generate summary");
      setIsLoading(false);
    },
  });

  const handleSummarize = async () => {
    if (!documentId) return;
    setIsLoading(true);
    summarizeMutation.mutate({ documentId });
  };

  const visualSummaryMutation = trpc.generateVisualSummary.useMutation({
    onSuccess: (result) => {
      toast.success("Visual summary generated!");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `**Visual Summary Generated:**\n\n![Summary](${result.imageUrl})`,
        },
      ]);
      setIsLoading(false);
    },
    onError: () => {
      toast.error("Failed to generate visual summary");
      setIsLoading(false);
    },
  });

  const handleGenerateVisualSummary = async () => {
    if (!documentId) return;
    setIsLoading(true);
    visualSummaryMutation.mutate({ documentId });
  };

  if (docLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!document) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-slate-600 mb-4">Document not found</p>
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <motion.div
          className="border-b border-slate-200 p-4 bg-white"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  {document.fileName}
                </h1>
                <p className="text-sm text-slate-600">
                  {(document.fileSize / 1024 / 1024).toFixed(2)} MB • {document.fileType.toUpperCase()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSummarize}
                disabled={isLoading}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Summarize
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateVisualSummary}
                disabled={isLoading}
                className="gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                Visual Summary
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden">
          <AIChatBox
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            suggestedPrompts={[
              "What are the main points in this document?",
              "Can you summarize the key findings?",
              "What is the document about?",
            ]}
          />
        </div>

        {/* Footer with Actions */}
        <motion.div
          className="border-t border-slate-200 p-4 bg-slate-50"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex gap-2 justify-center flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={isLoading}
            >
              <Mic className="w-4 h-4" />
              Voice Input
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={isLoading}
            >
              <ImageIcon className="w-4 h-4" />
              Analyze Image
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={isLoading}
            >
              <Download className="w-4 h-4" />
              Export Chat
            </Button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
