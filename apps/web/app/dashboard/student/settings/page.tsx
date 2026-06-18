import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileSettingsForm } from "@/components/settings/ProfileSettingsForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default async function StudentSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [userRes, profileRes] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase.from("profiles").select("*").eq("user_id", user.id).single(),
  ]);

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-heading text-2xl font-bold text-primary">Account Settings</h1>
      <ProfileSettingsForm
        user={userRes.data}
        profile={profileRes.data}
      />
    </div>
  );
}
