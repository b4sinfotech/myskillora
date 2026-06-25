import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NotificationsList } from "@/components/notifications/NotificationsList";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notifications" };

export default async function TeacherNotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="max-w-2xl">
      <NotificationsList />
    </div>
  );
}
