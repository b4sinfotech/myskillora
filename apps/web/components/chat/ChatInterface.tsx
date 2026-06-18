"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@myskillora/types";
import { containsContactInfo, redactContactInfo, formatRelativeTime, initials } from "@myskillora/utils";
import { Send, AlertCircle } from "lucide-react";

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  is_filtered: boolean;
  created_at: string;
  sender: { full_name: string; avatar_url: string | null } | null;
}

interface Thread {
  id: string;
  student_id: string;
  teacher_id: string;
  other_user: { id: string; full_name: string; avatar_url: string | null };
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

interface ChatInterfaceProps {
  userId: string;
}

export function ChatInterface({ userId }: ChatInterfaceProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [contactInfoWarning, setContactInfoWarning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadThreads = useCallback(async () => {
    const { data } = await supabase
      .from("messages")
      .select("thread_id, content, created_at, sender_id, recipient_id")
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (!data) return;

    const threadMap = new Map<string, { otherId: string; lastMsg: string; lastAt: string }>();
    for (const msg of data) {
      if (threadMap.has(msg.thread_id)) continue;
      const otherId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
      threadMap.set(msg.thread_id, {
        otherId,
        lastMsg: msg.content,
        lastAt: msg.created_at,
      });
    }

    const threadIds = Array.from(threadMap.keys());
    const otherIds = Array.from(threadMap.values()).map((t) => t.otherId);

    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, avatar_url")
      .in("id", otherIds);

    const userMap = new Map((users ?? []).map((u) => [u.id, u]));

    const built: Thread[] = threadIds.map((tid) => {
      const t = threadMap.get(tid)!;
      const other = userMap.get(t.otherId);
      return {
        id: tid,
        student_id: "",
        teacher_id: "",
        other_user: {
          id: t.otherId,
          full_name: other?.full_name ?? "Unknown",
          avatar_url: other?.avatar_url ?? null,
        },
        last_message: t.lastMsg,
        last_message_at: t.lastAt,
        unread_count: 0,
      };
    });

    setThreads(built);
  }, [userId, supabase]);

  const loadMessages = useCallback(async (threadId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*, sender:users!messages_sender_id_fkey(full_name, avatar_url)")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    setMessages((data as Message[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (!activeThreadId) return;
    loadMessages(activeThreadId);

    const channel = supabase
      .channel(`messages:${activeThreadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${activeThreadId}`,
        },
        async (payload) => {
          const msg = payload.new as Message;
          const { data: sender } = await supabase
            .from("users")
            .select("full_name, avatar_url")
            .eq("id", msg.sender_id)
            .single();
          setMessages((prev) => [...prev, { ...msg, sender: sender ?? null }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeThreadId, loadMessages, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    setContactInfoWarning(containsContactInfo(value));
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeThreadId || sending) return;

    const isFiltered = containsContactInfo(newMessage);
    const content = isFiltered ? redactContactInfo(newMessage) : newMessage;

    setSending(true);
    await supabase.from("messages").insert({
      thread_id: activeThreadId,
      sender_id: userId,
      recipient_id:
        threads.find((t) => t.id === activeThreadId)?.other_user.id ?? "",
      content,
      is_filtered: isFiltered,
    });

    setNewMessage("");
    setContactInfoWarning(false);
    setSending(false);
  };

  const activeThread = threads.find((t) => t.id === activeThreadId);

  return (
    <div className="flex h-[calc(100vh-10rem)] border border-slate-200 rounded-card overflow-hidden bg-white">
      {/* Thread list */}
      <div className="w-72 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-heading font-semibold text-slate-900">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 && (
            <p className="p-4 text-sm text-slate-500">No conversations yet.</p>
          )}
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => setActiveThreadId(thread.id)}
              className={`w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 ${
                activeThreadId === thread.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
              }`}
            >
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {thread.other_user.avatar_url ? (
                  <img
                    src={thread.other_user.avatar_url}
                    alt={thread.other_user.full_name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  initials(thread.other_user.full_name)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900 text-sm truncate">
                  {thread.other_user.full_name}
                </p>
                {thread.last_message && (
                  <p className="text-xs text-slate-500 truncate">{thread.last_message}</p>
                )}
              </div>
              {thread.last_message_at && (
                <span className="text-xs text-slate-400 flex-shrink-0">
                  {formatRelativeTime(thread.last_message_at)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Message area */}
      <div className="flex-1 flex flex-col">
        {!activeThreadId ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <p>Select a conversation</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
                {initials(activeThread?.other_user.full_name ?? "")}
              </div>
              <span className="font-semibold text-slate-900">
                {activeThread?.other_user.full_name}
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isOwn = msg.sender_id === userId;
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    {!isOwn && (
                      <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 flex-shrink-0">
                        {initials(msg.sender?.full_name ?? "?")}
                      </div>
                    )}
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${
                        isOwn
                          ? "bg-primary text-white rounded-tr-none"
                          : "bg-slate-100 text-slate-900 rounded-tl-none"
                      }`}
                    >
                      {msg.is_filtered && (
                        <span className="italic opacity-70">[contact info removed] </span>
                      )}
                      {msg.content}
                      <div
                        className={`text-xs mt-1 ${isOwn ? "text-white/60" : "text-slate-400"}`}
                      >
                        {formatRelativeTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200">
              {contactInfoWarning && (
                <div className="flex items-center gap-2 text-amber-600 text-xs mb-2 bg-amber-50 px-3 py-2 rounded-lg">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  Contact information will be removed before sending.
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 rounded-input border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="h-10 w-10 rounded-input bg-primary text-white flex items-center justify-center disabled:opacity-50 hover:bg-primary/90 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
