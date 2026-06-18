import { createClient } from "@/lib/supabase/server";
import { PlatformSettingsEditor } from "@/components/admin/PlatformSettingsEditor";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Platform Settings" };

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("platform_settings")
    .select("*")
    .order("key");

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="font-heading text-2xl font-bold text-primary">Platform Settings</h1>
      <PlatformSettingsEditor settings={settings ?? []} />
    </div>
  );
}
