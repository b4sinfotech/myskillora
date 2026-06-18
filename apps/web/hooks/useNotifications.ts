"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useNotificationStore } from "@/store/notification.store";
import { useAuthStore } from "@/store/auth.store";
import type { Notification } from "@myskillora/types";

export function useNotifications() {
  const { user } = useAuthStore();
  const { notifications, unreadCount, setNotifications, addNotification, markRead, markAllRead } =
    useNotificationStore();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    // Load initial notifications
    void supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setNotifications(data as Notification[]);
      });

    // Subscribe to new notifications via Realtime
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          addNotification(payload.new as Notification);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const markAsRead = async (id: string) => {
    markRead(id);
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    markAllRead();
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("is_read", false);
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}
