"use client";

import { Bell, BellOff, BookOpen, CreditCard, MessageCircle, Star, CheckCircle, XCircle, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { formatRelativeTime, cn } from "@/lib/utils";
import type { NotificationType } from "@myskillora/types";

const NOTIF_ICONS: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  booking_confirmed:  { icon: CheckCircle,   color: "text-success" },
  booking_cancelled:  { icon: XCircle,       color: "text-error" },
  booking_completed:  { icon: BookOpen,      color: "text-primary" },
  payment_received:   { icon: CreditCard,    color: "text-success" },
  payment_failed:     { icon: CreditCard,    color: "text-error" },
  review_received:    { icon: Star,          color: "text-amber-500" },
  review_response:    { icon: Star,          color: "text-amber-500" },
  message_received:   { icon: MessageCircle, color: "text-blue-500" },
  payout_processed:   { icon: CreditCard,    color: "text-success" },
  teacher_approved:   { icon: UserCheck,     color: "text-success" },
  teacher_rejected:   { icon: UserX,         color: "text-error" },
};

export function NotificationsList() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getIcon = (type: string) => {
    const config = NOTIF_ICONS[type as NotificationType];
    if (!config) return { Icon: Bell, color: "text-muted-foreground" };
    return { Icon: config.icon, color: config.color };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <BellOff className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-medium text-primary">No notifications yet</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Booking updates, payment receipts, and messages will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y rounded-card border bg-white overflow-hidden">
          {notifications.map((notif) => {
            const { Icon, color } = getIcon(notif.type);
            return (
              <button
                key={notif.id}
                className={cn(
                  "w-full text-left flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/40",
                  !notif.is_read && "bg-primary/3"
                )}
                onClick={() => {
                  if (!notif.is_read) markAsRead(notif.id);
                }}
              >
                <div className={cn("mt-0.5 shrink-0", color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={cn("text-sm font-semibold truncate", !notif.is_read ? "text-primary" : "text-foreground")}>
                      {notif.title}
                    </p>
                    {!notif.is_read && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 shrink-0">New</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{notif.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(notif.created_at)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
