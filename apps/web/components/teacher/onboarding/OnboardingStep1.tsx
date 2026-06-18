"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/useToast";
import { createClient } from "@/lib/supabase/client";
import type { TeacherProfile } from "@myskillora/types";

const schema = z.object({
  headline: z.string().min(10, "Headline must be at least 10 characters").max(120),
  experienceYears: z.coerce.number().min(0).max(60),
  teachingStyle: z.string().max(500).optional(),
  availabilityTimezone: z.string().min(1),
});

type Form = z.infer<typeof schema>;

interface Props {
  teacherProfile: TeacherProfile | null;
  userId: string;
  onNext: () => void;
}

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Colombo",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
];

export function OnboardingStep1({ teacherProfile, userId, onNext }: Props) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      headline: teacherProfile?.headline ?? "",
      experienceYears: teacherProfile?.experience_years ?? 0,
      teachingStyle: teacherProfile?.teaching_style ?? "",
      availabilityTimezone: teacherProfile?.availability_timezone ?? "Asia/Kolkata",
    },
  });

  const onSubmit = async (data: Form) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("teacher_profiles")
        .upsert({
          user_id: userId,
          headline: data.headline,
          experience_years: data.experienceYears,
          teaching_style: data.teachingStyle,
          availability_timezone: data.availabilityTimezone,
        }, { onConflict: "user_id" });

      if (error) throw error;
      toast({ title: "Saved!", description: "Step 1 complete.", variant: "default" });
      onNext();
    } catch (err) {
      toast({
        title: "Error saving",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 1 — Basic Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <Label htmlFor="headline">Professional Headline *</Label>
            <Input
              id="headline"
              placeholder="e.g. Expert Maths & Physics Teacher with 10+ years experience"
              className="mt-1"
              {...register("headline")}
            />
            {errors.headline && <p className="text-xs text-error mt-1">{errors.headline.message}</p>}
          </div>

          <div>
            <Label htmlFor="experienceYears">Years of Teaching Experience *</Label>
            <Input
              id="experienceYears"
              type="number"
              min={0}
              max={60}
              className="mt-1 w-32"
              {...register("experienceYears")}
            />
            {errors.experienceYears && (
              <p className="text-xs text-error mt-1">{errors.experienceYears.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="teachingStyle">Teaching Style (Optional)</Label>
            <textarea
              id="teachingStyle"
              placeholder="Describe your teaching methodology and approach..."
              rows={3}
              className="mt-1 flex w-full rounded-input border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              {...register("teachingStyle")}
            />
          </div>

          <div>
            <Label htmlFor="availabilityTimezone">Your Timezone *</Label>
            <select
              id="availabilityTimezone"
              className="mt-1 flex h-10 w-full rounded-input border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register("availabilityTimezone")}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading} variant="amber">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save & Continue
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
