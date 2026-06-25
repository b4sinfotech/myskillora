"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/useToast";
import { createClient } from "@/lib/supabase/client";
import type { TeacherProfile, TeacherSubject, TeacherFee, Category } from "@myskillora/types";

interface Props {
  teacherProfile: TeacherProfile | null;
  subjects: (TeacherSubject & { category: Category })[];
  fees: TeacherFee[];
  categories: Category[];
  userId: string;
  onNext: () => void;
  onBack: () => void;
}

export function OnboardingStep2({ teacherProfile, subjects, fees, categories, userId: _userId, onNext, onBack }: Props) {
  const supabase = createClient();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    subjects.map((s) => s.category_id)
  );
  const [feeList, setFeeList] = useState<Partial<TeacherFee>[]>(fees.length > 0 ? fees : [
    { session_type: "hourly", amount: 0, duration_minutes: 60, currency: "INR", is_active: true },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSubject = (categoryId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const addFee = () => {
    setFeeList((prev) => [
      ...prev,
      { session_type: "hourly", amount: 0, duration_minutes: 60, currency: "INR", is_active: true },
    ]);
  };

  const removeFee = (index: number) => {
    setFeeList((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFee = (index: number, key: keyof TeacherFee, value: string | number | boolean) => {
    setFeeList((prev) => prev.map((fee, i) => (i === index ? { ...fee, [key]: value } : fee)));
  };

  const onSave = async () => {
    if (selectedSubjects.length === 0) {
      toast({ title: "Select at least one subject", variant: "destructive" });
      return;
    }
    if (!teacherProfile) {
      toast({ title: "Complete Step 1 first", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // Upsert teacher subjects
      await supabase
        .from("teacher_subjects")
        .delete()
        .eq("teacher_id", teacherProfile.id);

      if (selectedSubjects.length > 0) {
        await supabase.from("teacher_subjects").insert(
          selectedSubjects.map((catId, idx) => ({
            teacher_id: teacherProfile.id,
            category_id: catId,
            is_primary: idx === 0,
          }))
        );
      }

      // Upsert fees
      await supabase.from("teacher_fees").delete().eq("teacher_id", teacherProfile.id);

      const validFees = feeList.filter((f) => f.amount && f.amount > 0);
      if (validFees.length > 0) {
        await supabase.from("teacher_fees").insert(
          validFees.map((f) => ({
            teacher_id: teacherProfile.id,
            category_id: selectedSubjects[0]!,
            session_type: f.session_type ?? "hourly",
            amount: Math.round((f.amount ?? 0) * 100), // convert to paise
            currency: f.currency ?? "INR",
            duration_minutes: f.duration_minutes,
            is_active: f.is_active ?? true,
          }))
        );
      }

      toast({ title: "Saved!", description: "Subjects and fees saved." });
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
        <CardTitle>Step 2 — Subjects & Fee Structure</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subject Selection */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">Select subjects you teach *</Label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleSubject(cat.id)}
                className={`px-3 py-1.5 rounded-pill text-sm font-medium border-2 transition-all ${
                  selectedSubjects.includes(cat.id)
                    ? "border-primary bg-primary text-white"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Fee Structure */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-semibold">Fee Structure *</Label>
            <Button type="button" variant="outline" size="sm" onClick={addFee}>
              <Plus className="h-4 w-4" /> Add Fee Option
            </Button>
          </div>
          <div className="space-y-3">
            {feeList.map((fee, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-3 p-3 rounded-card border">
                <div>
                  <Label className="text-xs mb-1 block">Type</Label>
                  <select
                    className="w-full rounded-input border border-input px-2 py-1.5 text-sm"
                    value={fee.session_type ?? "hourly"}
                    onChange={(e) => updateFee(idx, "session_type", e.target.value)}
                  >
                    <option value="hourly">Hourly</option>
                    <option value="monthly">Monthly</option>
                    <option value="package">Package</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="500"
                    value={fee.amount ?? ""}
                    onChange={(e) => updateFee(idx, "amount", parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Duration (min)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="60"
                      value={fee.duration_minutes ?? ""}
                      onChange={(e) => updateFee(idx, "duration_minutes", parseInt(e.target.value) || 60)}
                      className="h-8 text-sm"
                    />
                    {feeList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFee(idx)}
                        className="text-error hover:text-error/80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
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
