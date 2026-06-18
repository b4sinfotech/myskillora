import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend, FROM_EMAIL } from "@/lib/resend/client";
import { formatDate, formatCurrencyRaw } from "@myskillora/utils";

export async function POST(request: Request) {
  try {
    const { bookingId } = await request.json() as { bookingId: string };
    const supabase = createAdminClient();

    const { data: booking } = await supabase
      .from("bookings")
      .select(`
        *,
        student:users!bookings_student_id_fkey(full_name, email),
        teacher:users!bookings_teacher_id_fkey(full_name, email),
        category:categories(name)
      `)
      .eq("id", bookingId)
      .single();

    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const student = booking.student as { full_name: string; email: string } | null;
    const teacher = booking.teacher as { full_name: string; email: string } | null;
    const category = booking.category as { name: string } | null;

    // Send to student
    if (student?.email) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: student.email,
        subject: `Booking Confirmed — ${category?.name} with ${teacher?.full_name}`,
        html: `
          <h2>Booking Confirmed! 🎉</h2>
          <p>Hi ${student.full_name},</p>
          <p>Your session has been confirmed:</p>
          <ul>
            <li><strong>Subject:</strong> ${category?.name}</li>
            <li><strong>Teacher:</strong> ${teacher?.full_name}</li>
            <li><strong>Date:</strong> ${formatDate(booking.session_date)}</li>
            <li><strong>Time:</strong> ${booking.session_time}</li>
            <li><strong>Duration:</strong> ${booking.duration_minutes} minutes</li>
            <li><strong>Amount:</strong> ${formatCurrencyRaw(booking.amount)}</li>
          </ul>
          ${booking.meeting_link ? `<p><a href="${booking.meeting_link}">Join Session</a></p>` : ""}
          <p>Happy learning!</p>
          <p>— Team myskillora</p>
        `,
      });
    }

    // Send to teacher
    if (teacher?.email) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: teacher.email,
        subject: `New Booking — ${category?.name} with ${student?.full_name}`,
        html: `
          <h2>New Session Booked!</h2>
          <p>Hi ${teacher.full_name},</p>
          <p>${student?.full_name} has booked a session with you:</p>
          <ul>
            <li><strong>Subject:</strong> ${category?.name}</li>
            <li><strong>Student:</strong> ${student?.full_name}</li>
            <li><strong>Date:</strong> ${formatDate(booking.session_date)}</li>
            <li><strong>Time:</strong> ${booking.session_time}</li>
            <li><strong>Your Earnings:</strong> ${formatCurrencyRaw(booking.teacher_payout)}</li>
          </ul>
          <p>— Team myskillora</p>
        `,
      });
    }

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json({ error: "Email send failed" }, { status: 500 });
  }
}
