"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@myskillora/types";
import { containsContactInfo, redactContactInfo, formatRelativeTime, initials } from "@myskillora/utils";
import { Send, AlertCircle } from "lucide-react";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

interface MessageWithSender extends MessageRow {
  sender: { full_name: string | null; avatar_url: string | null } | null;
}

interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  lastMessage: string;
  lastAt: string;
}

interface ChatInterfaceProps {
  userId: string;
}

export function ChatInterface({ userId }: ChatInterfaceProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [contactInfoWarning, setContactInfoWarning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = useMemo(
    () =>
      createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const loadConversations = useCallback(async () => {
    // Load all messages where userId is sender or receiver
    const { data: msgs } = await supabase
      .from("messages")
      .select("sender_id, receiver_id, content, created_at")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (!msgs) return;

    // Group by partner, keep only the most recent message per partner
    const partnerMap = new Map<string, { lastMsg: string; lastAt: string }>();
    for (const msg of msgs) {
      const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, { lastMsg: msg.content, lastAt: msg.created_at });
      }
    }

    if (partnerMap.size === 0) return;

    const partnerIds = Array.from(partnerMap.keys());
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, avatar_url")
      .in("id", partnerIds);

    const userMap = new Map((users ?? []).map((u) => [u.id, u]));

    const convos: Conversation[] = partnerIds.map((pid) => {
      const meta = partnerMap.get(pid)!;
      const partner = userMap.get(pid);
      return {
        partnerId: pid,
        partnerName: partner?.full_name ?? "Unknown",
        partnerAvatar: partner?.avatar_url ?? null,
        lastMessage: meta.lastMsg,
        lastAt: meta.lastAt,
      };
    });

    setConversations(convos);
  }, [userId, supabase]);

  const loadMessages = useCallback(
    async (partnerId: string) => {
      const { data } = await supabase
        .from("messages")
        .select("*, sender:users!messages_sender_id_fkey(full_name, avatar_url)")
        .or(
          `and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`
        )
        .order("created_at", { ascending: true });

      setMessages((data as MessageWithSender[]) ?? []);
    },
    [userId, supabase]
  );

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!activePartnerId) return;
    void loadMessages(activePartnerId);

    // Subscribe to incoming messages for the active conversation
    const channel = supabase
      .channel(`chat:${userId}:${activePartnerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        async (payload) => {
          const msg = payload.new as MessageRow;
          // Only add to view if it's from the active partner
          if (msg.sender_id !== activePartnerId) return;
          const { data: sender } = await supabase
            .from("users")
            .select("full_name, avatar_url")
            .eq("id", msg.sender_id)
            .single();
          setMessages((prev) => [...prev, { ...msg, sender: sender ?? null }]);
          // Refresh conversations list to update last message
          void loadConversations();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activePartnerId, userId, supabase, loadMessages, loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    setContactInfoWarning(containsContactInfo(value));
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activePartnerId || sending) return;

    const isFiltered = containsContactInfo(newMessage);
    const content = isFiltered ? redactContactInfo(newMessage) : newMessage;

    setSending(true);
    const { data: sent } = await supabase
      .from("messages")
      .insert({
        sender_id: userId,
        receiver_id: activePartnerId,
        content,
        is_filtered: isFiltered,
      })
      .select("*, sender:users!messages_sender_id_fkey(full_name, avatar_url)")
      .single();

    if (sent) {
      setMessages((prev) => [...prev, sent as MessageWithSender]);
      void loadConversations();
    }

    setNewMessage("");
    setContactInfoWarning(false);
    setSending(false);
  };

  const activeConversation = conversations.find((c) => c.partnerId === activePartnerId);

  return (
    <div className="flex h-[calc(100vh-10rem)] border border-slate-200 rounded-card overflow-hidden bg-white">
      {/* Conversation list */}
      <div className="w-72 border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-heading font-semibold text-slate-900">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="p-4 text-sm text-slate-500">No conversations yet.</p>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.partnerId}
              onClick={() => setActivePartnerId(conv.partnerId)}
              className={`w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 ${
                activePartnerId === conv.partnerId
                  ? "bg-primary/5 border-l-2 border-l-primary"
                  : ""
              }`}
            >
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold shrink-0">
                {initials(conv.partnerName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900 text-sm truncate">{conv.partnerName}</p>
                <p className="text-xs text-slate-500 truncate">{conv.lastMessage}</p>
              </div>
              <span className="text-xs text-slate-400 shrink-0">
                {formatRelativeTime(conv.lastAt)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Message area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activePartnerId ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <p>Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
                {initials(activeConversation?.partnerName ?? "")}
              </div>
              <span className="font-semibold text-slate-900">
                {activeConversation?.partnerName}
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isOwn = msg.sender_id === userId;
                const senderInfo = msg.sender as { full_name: string | null; avatar_url: string | null } | null;
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    {!isOwn && (
                      <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 shrink-0">
                        {initials(senderInfo?.full_name ?? "?")}
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
                      <div className={`text-xs mt-1 ${isOwn ? "text-white/60" : "text-slate-400"}`}>
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
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  Contact information will be removed before sending.
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 rounded-input border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  onClick={() => void sendMessage()}
                  disabled={!newMessage.trim() || sending}
                  className="h-10 w-10 rounded-input bg-primary text-white flex items-center justify-center disabled:opacity-50 hover:bg-primary/90 transition-colors shrink-0"
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
