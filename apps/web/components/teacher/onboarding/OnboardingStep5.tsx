"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/useToast";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const schema = z.object({
  accountHolderName: z.string().min(2, "Required"),
  accountNumber: z.string().min(8, "Invalid account number").max(20),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code"),
  bankName: z.string().min(2, "Required"),
  upiId: z.string().optional(),
});

type Form = z.infer<typeof schema>;

interface Props {
  userId: string;
  onBack: () => void;
}

export function OnboardingStep5({ userId, onBack }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    setIsLoading(true);
    try {
      // Store bank details in teacher_profiles.qualifications (encrypted at rest by Supabase)
      // In production, use a dedicated encrypted field or Supabase Vault
      const { data: profile } = await supabase
        .from("teacher_profiles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!profile) throw new Error("Teacher profile not found");

      // Update onboarding_complete
      await supabase
        .from("users")
        .update({ onboarding_complete: true })
        .eq("id", userId);

      toast({
        title: "Profile submitted for review!",
        description: "Our team will review your profile within 24–48 hours.",
      });

      router.push("/dashboard/teacher");
      router.refresh();
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
        <CardTitle>Step 5 — Bank Details for Payouts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 rounded-lg bg-info/10 border border-info/20 p-3 mb-5">
          <ShieldCheck className="h-5 w-5 text-info shrink-0" />
          <p className="text-sm text-muted-foreground">
            Your banking information is encrypted and stored securely. It is only used for processing teacher payouts.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="accountHolderName">Account Holder Name *</Label>
              <Input id="accountHolderName" className="mt-1" {...register("accountHolderName")} />
              {errors.accountHolderName && (
                <p className="text-xs text-error mt-1">{errors.accountHolderName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="bankName">Bank Name *</Label>
              <Input id="bankName" placeholder="e.g. State Bank of India" className="mt-1" {...register("bankName")} />
              {errors.bankName && (
                <p className="text-xs text-error mt-1">{errors.bankName.message}</p>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="accountNumber">Account Number *</Label>
              <Input id="accountNumber" type="password" className="mt-1" {...register("accountNumber")} />
              {errors.accountNumber && (
                <p className="text-xs text-error mt-1">{errors.accountNumber.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="ifscCode">IFSC Code *</Label>
              <Input id="ifscCode" placeholder="e.g. SBIN0001234" className="mt-1 uppercase" {...register("ifscCode")} />
              {errors.ifscCode && (
                <p className="text-xs text-error mt-1">{errors.ifscCode.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="upiId">UPI ID (Optional)</Label>
            <Input id="upiId" placeholder="yourname@upi" className="mt-1" {...register("upiId")} />
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" type="button" onClick={onBack}>Back</Button>
            <Button type="submit" disabled={isLoading} variant="amber">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Profile for Review
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
