"use client";

import { useAuth } from "@/hooks/useAuth";
import { useBookingStore } from "@/store/booking.store";
import { Button } from "@/components/ui/button";
import { BookingModal } from "@/components/booking/BookingModal";
import { formatCurrency } from "@/lib/utils";
import type { TeacherFee, TeacherAvailability, Category } from "@myskillora/types";
import Link from "next/link";

interface Props {
  teacherUserId: string;
  teacherName: string;
  teacherAvatarUrl: string | null;
  fees: TeacherFee[];
  availability: TeacherAvailability[];
  categories: Category[];
}

export function BookingCard({
  teacherUserId,
  teacherName,
  teacherAvatarUrl,
  fees,
  availability,
  categories,
}: Props) {
  const { user } = useAuth();
  const { initDraft } = useBookingStore();

  const activeFees = fees.filter((f) => f.is_active);

  const handleBookingClick = () => {
    initDraft(teacherUserId, teacherName);
  };

  return (
    <>
      <div className="space-y-3 mb-6">
        {activeFees.length > 0 ? (
          activeFees.map((fee) => (
            <div
              key={fee.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div>
                <p className="font-medium text-sm capitalize">{fee.session_type}</p>
                {fee.duration_minutes && (
                  <p className="text-xs text-muted-foreground">{fee.duration_minutes} min</p>
                )}
                {fee.description && (
                  <p className="text-xs text-muted-foreground">{fee.description}</p>
                )}
              </div>
              <p className="font-heading font-bold text-primary">
                {formatCurrency(fee.amount)}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Contact teacher for pricing details.</p>
        )}
      </div>

      {user ? (
        user.role === "student" ? (
          <Button variant="amber" size="lg" className="w-full" onClick={handleBookingClick}>
            Request Booking
          </Button>
        ) : user.id === teacherUserId ? (
          <Button variant="outline" size="lg" className="w-full" asChild>
            <Link href="/dashboard/teacher">Manage Your Profile</Link>
          </Button>
        ) : (
          <Button variant="amber" size="lg" className="w-full" disabled>
            Students only
          </Button>
        )
      ) : (
        <Button variant="amber" size="lg" className="w-full" asChild>
          <Link href="/auth/login?redirectTo=/teachers">Sign in to Book</Link>
        </Button>
      )}

      <p className="text-xs text-muted-foreground text-center mt-3">Secure payment via Razorpay</p>

      {user && (
        <BookingModal
          teacherUserId={teacherUserId}
          teacherName={teacherName}
          teacherAvatarUrl={teacherAvatarUrl}
          fees={fees}
          availability={availability}
          categories={categories}
          currentUserName={user.full_name ?? user.email}
          currentUserEmail={user.email}
        />
      )}
    </>
  );
}
