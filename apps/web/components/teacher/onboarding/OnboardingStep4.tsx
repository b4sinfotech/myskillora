"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/useToast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { TeacherProfile, TeacherAvailability, DayOfWeek } from "@myskillora/types";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DEFAULT_SLOTS = DAYS.map((_, idx) => ({
  day_of_week: idx as DayOfWeek,
  start_time: "09:00",
  end_time: "18:00",
  is_available: idx >= 1 && idx <= 5, // Mon–Fri by default
}));

interface Props {
  teacherProfile: TeacherProfile | null;
  availability: TeacherAvailability[];
  userId: string;
  onNext: () => void;
  onBack: () => void;
}

export function OnboardingStep4({ teacherProfile, availability, userId: _userId, onNext, onBack }: Props) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);

  const initialSlots = availability.length > 0
    ? DEFAULT_SLOTS.map((def) => {
        const saved = availability.find((a) => a.day_of_week === def.day_of_week);
        return saved
          ? { ...def, start_time: saved.start_time, end_time: saved.end_time, is_available: saved.is_available }
          : def;
      })
    : DEFAULT_SLOTS;

  const [slots, setSlots] = useState(initialSlots);

  const updateSlot = (dayIdx: number, key: "start_time" | "end_time" | "is_available", value: string | boolean) => {
    setSlots((prev) => prev.map((slot, i) => (i === dayIdx ? { ...slot, [key]: value } : slot)));
  };

  const onSave = async () => {
    if (!teacherProfile) {
      toast({ title: "Complete Step 1 first", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("teacher_availability")
        .upsert(
          slots.map((slot) => ({
            teacher_id: teacherProfile.id,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_available: slot.is_available,
          })),
          { onConflict: "teacher_id,day_of_week" }
        );

      if (error) throw error;
      toast({ title: "Availability saved!" });
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
        <CardTitle>Step 4 — Availability Calendar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Set your weekly availability. Students can only book sessions during these hours.
        </p>

        <div className="space-y-2">
          {slots.map((slot, idx) => (
            <div key={idx} className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-colors",
              slot.is_available ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"
            )}>
              {/* Toggle */}
              <button
                type="button"
                onClick={() => updateSlot(idx, "is_available", !slot.is_available)}
                className={cn(
                  "w-10 h-5 rounded-pill flex items-center transition-colors shrink-0",
                  slot.is_available ? "bg-primary" : "bg-muted-foreground/30"
                )}
              >
                <span className={cn(
                  "h-4 w-4 rounded-full bg-white shadow transition-transform mx-0.5",
                  slot.is_available ? "translate-x-5" : "translate-x-0"
                )} />
              </button>

              {/* Day */}
              <span className={cn(
                "w-24 text-sm font-medium shrink-0",
                slot.is_available ? "text-primary" : "text-muted-foreground"
              )}>
                {DAYS[idx]}
              </span>

              {/* Times */}
              {slot.is_available ? (
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="time"
                    value={slot.start_time}
                    onChange={(e) => updateSlot(idx, "start_time", e.target.value)}
                    className="rounded-input border border-input px-2 py-1 text-sm"
                  />
                  <span className="text-muted-foreground">to</span>
                  <input
                    type="time"
                    value={slot.end_time}
                    onChange={(e) => updateSlot(idx, "end_time", e.target.value)}
                    className="rounded-input border border-input px-2 py-1 text-sm"
                  />
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Not available</span>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <Button onClick={onSave} disabled={isLoading} variant="amber">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save & Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
