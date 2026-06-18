"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@myskillora/types";
import type { User, Profile } from "@myskillora/types";

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(500, "Bio must be under 500 characters").optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ProfileSettingsFormProps {
  user: User;
  profile: Profile | null;
}

export function ProfileSettingsForm({ user, profile }: ProfileSettingsFormProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: user.full_name ?? "",
      bio: profile?.bio ?? "",
      city: profile?.city ?? "",
      country: profile?.country ?? "",
      phone: user.phone ?? "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setError(null);

    const [userResult, profileResult] = await Promise.all([
      supabase
        .from("users")
        .update({ full_name: data.full_name, phone: data.phone || null })
        .eq("id", user.id),
      supabase
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            bio: data.bio || null,
            city: data.city || null,
            country: data.country || null,
          },
          { onConflict: "user_id" }
        ),
    ]);

    setSaving(false);

    if (userResult.error || profileResult.error) {
      setError(userResult.error?.message ?? profileResult.error?.message ?? "Save failed");
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
        <input
          {...register("full_name")}
          className="w-full rounded-input border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        {errors.full_name && (
          <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
        <input
          {...register("phone")}
          type="tel"
          placeholder="+91 XXXXX XXXXX"
          className="w-full rounded-input border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
        <textarea
          {...register("bio")}
          rows={4}
          placeholder="Tell teachers a little about yourself..."
          className="w-full rounded-input border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
        />
        {errors.bio && (
          <p className="mt-1 text-xs text-red-500">{errors.bio.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
          <input
            {...register("city")}
            className="w-full rounded-input border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
          <input
            {...register("country")}
            className="w-full rounded-input border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-input bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {saved && <span className="text-sm text-emerald-600 font-medium">Saved!</span>}
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
    </form>
  );
}
