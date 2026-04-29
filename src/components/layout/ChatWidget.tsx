"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X, Minimize2, Maximize2, Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation on first open
  useEffect(() => {
    if (open && !initialized) {
      loadConversation();
    }
  }, [open, initialized]);

  const loadConversation = async (convId?: string) => {
    try {
      const url = convId ? `/api/chat?conversationId=${convId}` : "/api/chat";
      const res = await fetch(url, { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        setConversationId(data.conversationId);
        setMessages(data.messages || []);
        setAllConversations(data.allConversations || []);
        setInitialized(true);
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
      setInitialized(true);
    }
  };

  const loadSpecificConversation = async (convId: string) => {
    await loadConversation(convId);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    // Optimistically add user message
    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        role: "user",
        content: userMessage,
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Add assistant reply
        setMessages((prev) => [
          ...prev,
          {
            id: `temp-${Date.now()}-ai`,
            role: "assistant",
            content: data.reply,
            createdAt: new Date().toISOString(),
          },
        ]);
        // Update conversations list with new title
        if (data.allConversations) {
          setAllConversations(data.allConversations);
        }
      } else {
        // Show error message
        const error = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `temp-${Date.now()}-error`,
            role: "assistant",
            content: `Error: ${error.error || "Failed to get response"}`,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}-error`,
          role: "assistant",
          content: "Network error. Please try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await fetch("/api/chat?new=true", { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        setConversationId(data.conversationId);
        setMessages([]);
        setAllConversations(data.allConversations || []);
        setInput("");
      }
    } catch (error) {
      console.error("Failed to create new chat:", error);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setMinimized(false);
    setFullscreen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  if (minimized && !fullscreen) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  const hasMessages = messages.length > 0;

  const panelClasses = fullscreen
    ? "fixed inset-0 z-50 w-full h-full rounded-none"
    : "fixed bottom-24 right-6 z-40 w-96 h-[600px] rounded-2xl";

  return (
    <>
      {/* Chat panel */}
      <div className={`${panelClasses} bg-white shadow-2xl border border-gray-100 overflow-hidden flex`}>
        {/* Sidebar - only in fullscreen */}
        {fullscreen && (
          <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden">
            {/* Sidebar header */}
            <div className="p-4 border-b border-gray-200">
              <button
                onClick={() => handleNewChat()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>
            </div>

            {/* Chat history list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {allConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => loadSpecificConversation(conv.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                    conversationId === conv.id
                      ? "bg-blue-100 text-blue-900 font-medium"
                      : "text-gray-700 hover:bg-gray-200"
                  } truncate`}
                  title={conv.title}
                >
                  {conv.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-violet-50">
          <h3 className="font-semibold text-gray-900">AI Assistant</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleNewChat()}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              title="New chat"
              aria-label="New chat"
            >
              <Plus className="w-5 h-5 text-gray-500" />
            </button>
            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
              aria-label="Toggle fullscreen"
            >
              {fullscreen ? (
                <Minimize2 className="w-5 h-5 text-gray-500" />
              ) : (
                <Maximize2 className="w-5 h-5 text-gray-500" />
              )}
            </button>
            <button
              onClick={() => handleClose()}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {!hasMessages && !initialized && (
            <div className="text-center text-gray-500 text-sm pt-8">
              <div className="animate-pulse">Loading...</div>
            </div>
          )}

          {!hasMessages && initialized && (
            <div className="text-center text-gray-500 text-sm pt-8">
              <p className="font-medium">Hi! 👋</p>
              <p className="mt-2">I&apos;m your AI business consultant. I have access to all your audit results, repair plans, and business data.</p>
              <p className="mt-3 text-xs">Ask me anything about your recovery plan!</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-sm px-4 py-2.5 rounded-xl ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-900 rounded-bl-none"
                }`}
              >
                {msg.role === "user" ? (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-h2:my-2 prose-h3:my-1.5 prose-ul:my-1 prose-li:my-0 prose-strong:font-semibold">
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => <p className="mb-1.5" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-base font-bold mt-3 mb-1.5" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-sm font-bold mt-2 mb-1" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-1.5 ml-2" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-1.5 ml-2" {...props} />,
                        li: ({ node, ...props }) => <li className="mb-0.5" {...props} />,
                        code: ({ node, ...props }) => <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono" {...props} />,
                        a: ({ node, ...props }) => <a className="text-blue-600 underline" target="_blank" rel="noopener noreferrer" {...props} />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 px-4 py-2.5 rounded-xl rounded-bl-none">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 border-t border-gray-100 p-4 bg-white space-y-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me about your audit findings, recovery plan..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors font-medium text-sm flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
        </div>
      </div>

      {/* Overlay - click to close (only in fullscreen) */}
      {fullscreen && (
        <div
          onClick={() => handleClose()}
          className="fixed inset-0 z-40 bg-black/20"
        />
      )}
    </>
  );
}
