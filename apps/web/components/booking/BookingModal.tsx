"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, ChevronLeft, ChevronRight, CalendarDays, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RazorpayButton } from "@/components/booking/RazorpayButton";
import { toast } from "@/hooks/useToast";
import { cn, formatCurrency, formatDate, initials, getAvatarUrl } from "@/lib/utils";
import { useBookingStore } from "@/store/booking.store";
import type { TeacherFee, TeacherAvailability, Category, CreateBookingResponse } from "@myskillora/types";

interface Props {
  teacherUserId: string;
  teacherName: string;
  teacherAvatarUrl: string | null;
  fees: TeacherFee[];
  availability: TeacherAvailability[];
  categories: { id: string; name: string }[];
  currentUserName: string;
  currentUserEmail: string;
}

const STEP_LABELS = ["Choose Plan", "Pick Date & Time", "Confirm & Pay"];

function getAvailableDates(availability: TeacherAvailability[], daysAhead = 28): Date[] {
  const availableDays = new Set(
    availability.filter((a) => a.is_available).map((a) => a.day_of_week)
  );
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i <= daysAhead; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (availableDays.has(d.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6)) {
      dates.push(d);
    }
  }
  return dates;
}

function getTimeSlots(availability: TeacherAvailability[], dayOfWeek: number): string[] {
  const slot = availability.find((a) => a.day_of_week === dayOfWeek && a.is_available);
  if (!slot) return [];

  const slots: string[] = [];
  const [startH] = slot.start_time.split(":").map(Number);
  const [endH] = slot.end_time.split(":").map(Number);

  for (let h = startH; h < endH; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
  }
  return slots;
}

function formatTimeDisplay(time: string): string {
  const [h] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:00 ${ampm}`;
}

export function BookingModal({
  teacherUserId,
  teacherName,
  teacherAvatarUrl,
  fees,
  availability,
  categories,
  currentUserName,
  currentUserEmail,
}: Props) {
  const router = useRouter();
  const { isOpen, step, draft, setFee, setDateTime, setNotes, setStep, closeModal, reset } = useBookingStore();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotesLocal] = useState("");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderResult, setOrderResult] = useState<CreateBookingResponse | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const availableDates = getAvailableDates(availability);
  const timeSlots = selectedDate ? getTimeSlots(availability, selectedDate.getDay()) : [];

  const activeFees = fees.filter((f) => f.is_active);

  const getCategoryName = (categoryId: string) =>
    categories.find((c) => c.id === categoryId)?.name ?? "Session";

  const handleClose = useCallback(() => {
    reset();
    setSelectedDate(null);
    setSelectedTime(null);
    setNotesLocal("");
    setOrderResult(null);
    setIsSuccess(false);
  }, [reset]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handleClose]);

  const handleSelectFee = (fee: TeacherFee) => {
    setFee(fee);
  };

  const handleStep1Next = () => {
    if (!draft?.fee) {
      toast({ title: "Select a session plan to continue", variant: "destructive" });
      return;
    }
    setStep(2);
  };

  const handleStep2Next = () => {
    if (!selectedDate || !selectedTime) {
      toast({ title: "Select a date and time to continue", variant: "destructive" });
      return;
    }
    const dateStr = selectedDate.toISOString().split("T")[0];
    setDateTime(dateStr, selectedTime);
    setNotes(notes);
    setStep(3);
  };

  const handleCreateOrder = async () => {
    if (!draft?.fee || !draft.sessionDate || !draft.sessionTime) return;

    setIsCreatingOrder(true);
    try {
      const res = await fetch("/api/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: teacherUserId,
          categoryId: draft.fee.category_id,
          feeId: draft.fee.id,
          sessionDate: draft.sessionDate,
          sessionTime: `${draft.sessionTime}:00`,
          notes: draft.notes,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setOrderResult(result.data);
      } else {
        toast({ title: "Could not create booking", description: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handlePaymentSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => {
      handleClose();
      router.push("/dashboard/student/bookings");
    }, 2500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="relative w-full max-w-lg bg-white rounded-card shadow-card-hover overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-primary text-white">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={getAvatarUrl(teacherAvatarUrl, teacherName)} alt={teacherName} />
              <AvatarFallback className="bg-white/20 text-white text-xs">{initials(teacherName)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-heading font-bold text-sm">{teacherName}</p>
              <p className="text-white/70 text-xs">Book a session</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-white/70 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step indicator */}
        {!isSuccess && (
          <div className="flex items-center gap-0 px-6 py-3 border-b bg-muted/30">
            {STEP_LABELS.map((label, i) => {
              const num = i + 1;
              const active = step === num;
              const done = step > num;
              return (
                <div key={label} className="flex items-center flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0",
                        done ? "bg-success text-white" : active ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {done ? "✓" : num}
                    </span>
                    <span className={cn("text-xs font-medium hidden sm:inline", active ? "text-primary" : "text-muted-foreground")}>
                      {label}
                    </span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={cn("flex-1 h-px mx-2", step > num ? "bg-success" : "bg-border")} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Success screen */}
          {isSuccess && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h3 className="font-heading text-xl font-bold text-primary">Booking Confirmed!</h3>
              <p className="text-muted-foreground text-sm">
                Payment successful. Your session with {teacherName} is booked.
                Redirecting to your bookings...
              </p>
            </div>
          )}

          {/* Step 1 — Select plan */}
          {!isSuccess && step === 1 && (
            <div className="space-y-3">
              <h3 className="font-heading font-semibold text-primary mb-4">Choose a session plan</h3>
              {activeFees.length === 0 && (
                <p className="text-sm text-muted-foreground">No fee plans available. Contact the teacher directly.</p>
              )}
              {activeFees.map((fee) => {
                const isSelected = draft?.fee?.id === fee.id;
                return (
                  <button
                    key={fee.id}
                    type="button"
                    onClick={() => handleSelectFee(fee)}
                    className={cn(
                      "w-full text-left p-4 rounded-card border-2 transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold capitalize">{fee.session_type}</span>
                          <Badge variant={isSelected ? "default" : "secondary"} className="text-xs">
                            {getCategoryName(fee.category_id)}
                          </Badge>
                        </div>
                        {fee.duration_minutes && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {fee.duration_minutes} minutes
                          </p>
                        )}
                        {fee.description && (
                          <p className="text-xs text-muted-foreground mt-1">{fee.description}</p>
                        )}
                      </div>
                      <p className="font-heading font-bold text-lg text-primary shrink-0">
                        {formatCurrency(fee.amount)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2 — Date & time */}
          {!isSuccess && step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-heading font-semibold text-primary mb-3 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Select a date
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {availableDates.slice(0, 20).map((date) => {
                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                    const dayName = date.toLocaleDateString("en-IN", { weekday: "short" });
                    const dayNum = date.getDate();
                    const month = date.toLocaleDateString("en-IN", { month: "short" });
                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        onClick={() => {
                          setSelectedDate(date);
                          setSelectedTime(null);
                        }}
                        className={cn(
                          "flex flex-col items-center p-2 rounded-card border-2 text-xs transition-all",
                          isSelected
                            ? "border-primary bg-primary text-white"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <span className="font-medium">{dayName}</span>
                        <span className="text-lg font-bold leading-none">{dayNum}</span>
                        <span className={isSelected ? "text-white/70" : "text-muted-foreground"}>{month}</span>
                      </button>
                    );
                  })}
                </div>
                {availableDates.length === 0 && (
                  <p className="text-sm text-muted-foreground">No available dates in the next 4 weeks.</p>
                )}
              </div>

              {selectedDate && (
                <div>
                  <h3 className="font-heading font-semibold text-primary mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Select a time
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {timeSlots.map((time) => {
                      const isSelected = selectedTime === time;
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(time)}
                          className={cn(
                            "py-2 px-3 rounded-card border-2 text-sm font-medium transition-all",
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          {formatTimeDisplay(time)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-primary block mb-1.5">
                  Notes for teacher <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotesLocal(e.target.value)}
                  placeholder="Mention your goals, current level, topics to cover..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 3 — Confirm & Pay */}
          {!isSuccess && step === 3 && (
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-primary mb-4">Booking Summary</h3>
              <div className="rounded-card border p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Teacher</span>
                  <span className="font-medium">{teacherName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium capitalize">{draft?.fee?.session_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subject</span>
                  <span className="font-medium">{draft?.fee ? getCategoryName(draft.fee.category_id) : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{draft?.fee?.duration_minutes ?? 60} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{draft?.sessionDate ? formatDate(draft.sessionDate) : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{draft?.sessionTime ? formatTimeDisplay(draft.sessionTime) : "—"}</span>
                </div>
                {draft?.notes && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Notes</span>
                    <span className="font-medium text-right max-w-[60%] line-clamp-2">{draft.notes}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="font-semibold">Total</span>
                  <span className="font-heading font-bold text-lg text-primary">
                    {draft?.fee ? formatCurrency(draft.fee.amount) : "—"}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Secure payment via Razorpay. You&apos;ll receive a confirmation email after payment.
              </p>

              {!orderResult ? (
                <Button
                  variant="amber"
                  size="lg"
                  className="w-full"
                  onClick={handleCreateOrder}
                  disabled={isCreatingOrder}
                >
                  {isCreatingOrder ? "Creating booking..." : "Proceed to Payment"}
                </Button>
              ) : (
                <RazorpayButton
                  booking={orderResult}
                  userName={currentUserName}
                  userEmail={currentUserEmail}
                  onSuccess={handlePaymentSuccess}
                  onDismiss={() => setOrderResult(null)}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer navigation */}
        {!isSuccess && (
          <div className="px-6 py-4 border-t bg-muted/20 flex justify-between">
            {step > 1 ? (
              <Button
                variant="ghost"
                onClick={() => {
                  if (step === 3) setOrderResult(null);
                  setStep((step - 1) as 1 | 2 | 3);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            )}

            {step === 1 && (
              <Button variant="amber" onClick={handleStep1Next}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            {step === 2 && (
              <Button variant="amber" onClick={handleStep2Next}>
                Review Booking
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
