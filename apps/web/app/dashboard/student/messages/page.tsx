import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatInterface } from "@/components/chat/ChatInterface";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Messages" };

export default async function StudentMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold text-primary">Messages</h1>
      <ChatInterface userId={user.id} />
    </div>
  );
}
