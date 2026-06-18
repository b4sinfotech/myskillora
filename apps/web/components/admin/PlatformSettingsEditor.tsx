"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/useToast";
import { createClient } from "@/lib/supabase/client";
import { Save } from "lucide-react";
import type { PlatformSetting } from "@myskillora/types";

interface Props {
  settings: PlatformSetting[];
}

export function PlatformSettingsEditor({ settings }: Props) {
  const supabase = createClient();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, JSON.stringify(s.value)]))
  );
  const [saving, setSaving] = useState<string | null>(null);

  const saveSetting = async (key: string) => {
    setSaving(key);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(values[key] ?? "null");
      } catch {
        parsed = values[key]; // treat as raw string
      }

      const { error } = await supabase
        .from("platform_settings")
        .update({ value: parsed as import("@myskillora/types").Json })
        .eq("key", key);

      if (error) throw error;
      toast({ title: `Saved: ${key}` });
    } catch (err) {
      toast({ title: "Error saving", description: err instanceof Error ? err.message : "", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-3">
      {settings.map((setting) => (
        <Card key={setting.key}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm font-mono text-primary">{setting.key}</p>
                {setting.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{setting.description}</p>
                )}
                <Input
                  value={values[setting.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [setting.key]: e.target.value }))}
                  className="mt-2 font-mono text-sm"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void saveSetting(setting.key)}
                disabled={saving === setting.key}
                className="shrink-0 mt-6"
              >
                <Save className="h-4 w-4" />
                {saving === setting.key ? "Saving..." : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
