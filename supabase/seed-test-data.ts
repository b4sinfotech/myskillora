/**
 * myskillora — Test Data Seeder
 *
 * Creates all test accounts and realistic data for local development.
 * Run with: pnpm db:seed:test
 *
 * Requires .env.local to have:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { faker } from "@faker-js/faker";

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Category IDs from seed.sql ────────────────────────────────────────────────

const CATEGORIES = {
  english:       "20000000-0000-0000-0000-000000000001",
  maths:         "20000000-0000-0000-0000-000000000002",
  science:       "20000000-0000-0000-0000-000000000003",
  tamil:         "20000000-0000-0000-0000-000000000004",
  hindi:         "20000000-0000-0000-0000-000000000005",
  physics:       "20000000-0000-0000-0000-000000000007",
  chemistry:     "20000000-0000-0000-0000-000000000008",
  biology:       "20000000-0000-0000-0000-000000000009",
  music:         "30000000-0000-0000-0000-000000000001",
  martialArts:   "30000000-0000-0000-0000-000000000003",
  dance:         "30000000-0000-0000-0000-000000000004",
  art:           "30000000-0000-0000-0000-000000000005",
  coding:        "30000000-0000-0000-0000-000000000006",
  yoga:          "30000000-0000-0000-0000-000000000007",
  chess:         "30000000-0000-0000-0000-000000000008",
  swimming:      "30000000-0000-0000-0000-000000000009",
  publicSpeaking:"30000000-0000-0000-0000-000000000010",
};

// ── Hardcoded test accounts ───────────────────────────────────────────────────

const FIXED_TEACHERS = [
  { email: "teacher1@test.myskillora.com", password: "TestTeacher@123", name: "Ananya Krishnamurthy", subject: "english",     categoryId: CATEGORIES.english,    headline: "CBSE English expert with 8 years of coaching experience" },
  { email: "teacher2@test.myskillora.com", password: "TestTeacher@123", name: "Rajesh Kumar",         subject: "maths",       categoryId: CATEGORIES.maths,      headline: "IIT graduate specialising in JEE Maths and CBSE Class 10-12" },
  { email: "teacher3@test.myskillora.com", password: "TestTeacher@123", name: "Priya Subramaniam",    subject: "music",       categoryId: CATEGORIES.music,      headline: "Carnatic vocalist and keyboard teacher — 500+ students taught" },
  { email: "teacher4@test.myskillora.com", password: "TestTeacher@123", name: "Karthik Selvam",       subject: "martialArts", categoryId: CATEGORIES.martialArts, headline: "Black belt karate instructor — builds confidence and discipline" },
  { email: "teacher5@test.myskillora.com", password: "TestTeacher@123", name: "Meenakshi Nair",        subject: "tamil",       categoryId: CATEGORIES.tamil,      headline: "Tamil literature specialist — Sangam poetry to modern prose" },
];

const FIXED_STUDENTS = [
  { email: "student1@test.myskillora.com", password: "TestStudent@123", name: "Arjun Sharma",   grade: "Class 10", school: "Delhi Public School" },
  { email: "student2@test.myskillora.com", password: "TestStudent@123", name: "Kavya Reddy",    grade: "Class 12", school: "Kendriya Vidyalaya" },
];

// Realistic review texts
const REVIEW_TEMPLATES = [
  { rating: 5, title: "Excellent teacher!", body: "Completely changed how I understand this subject. My exam scores jumped from 65% to 88% in just two months. Highly recommend!" },
  { rating: 5, title: "Patient and thorough", body: "Never makes you feel bad for asking the same question twice. Explains every concept from multiple angles until it clicks. Best teacher I've found online." },
  { rating: 5, title: "Outstanding results", body: "My daughter went from dreading this subject to actually enjoying it. The teaching style is engaging and the sessions are always well-prepared." },
  { rating: 4, title: "Very knowledgeable", body: "Knows the subject deeply and makes it easy to follow. Sometimes sessions run a little long but the content quality is great." },
  { rating: 4, title: "Great experience overall", body: "Really professional approach, always on time and comes prepared. The practice exercises are very useful. Could use a bit more visual aids." },
  { rating: 5, title: "Life-changing sessions", body: "I've tried three other tutors before this one. The difference in quality is night and day. Truly passionate about teaching." },
  { rating: 4, title: "Highly recommended", body: "Helped me crack my board exams with targeted practice and strategic revision. The mock tests are especially helpful." },
  { rating: 3, title: "Good but pricey", body: "The teaching quality is solid and I learned a lot, but the price point is a bit high for students on a budget. Worth it if you can afford it." },
  { rating: 5, title: "Amazing with kids", body: "My 8-year-old was nervous at first but within two sessions was completely comfortable. The teaching method is perfectly suited for younger students." },
  { rating: 4, title: "Consistent and reliable", body: "Never missed a session, always followed up with notes after each class. Exactly what I needed to stay on track for my exams." },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function amountInPaise(rupees: number): number {
  return rupees * 100;
}

async function createAuthUser(
  email: string,
  password: string,
  name: string,
  role: "admin" | "teacher" | "student"
): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, role },
  });

  if (error) {
    if (error.message.includes("already been registered")) {
      const { data: existing } = await supabase.auth.admin.listUsers();
      const user = existing?.users?.find(u => u.email === email);
      if (user) {
        console.log(`  ↳ User ${email} already exists, skipping`);
        return user.id;
      }
    }
    throw new Error(`Failed to create user ${email}: ${error.message}`);
  }

  return data.user.id;
}

// ── Main seeder ───────────────────────────────────────────────────────────────

async function seed() {
  console.log("\n🌱 myskillora — Seeding test data\n");
  console.log("Connecting to:", SUPABASE_URL);

  // ── 1. Admin ──────────────────────────────────────────────────────────────

  console.log("\n[1/6] Creating admin account...");
  const adminId = await createAuthUser(
    "admin@test.myskillora.com",
    "TestAdmin@123",
    "Platform Admin",
    "admin"
  );

  await supabase.from("users").upsert({
    id: adminId,
    email: "admin@test.myskillora.com",
    full_name: "Platform Admin",
    role: "admin",
    is_active: true,
  }, { onConflict: "id" });

  console.log("  ✓ admin@test.myskillora.com");

  // ── 2. Fixed teachers ─────────────────────────────────────────────────────

  console.log("\n[2/6] Creating fixed teacher accounts...");
  const teacherIds: { userId: string; profileId: string; categoryId: string; name: string; email: string }[] = [];

  for (const t of FIXED_TEACHERS) {
    const userId = await createAuthUser(t.email, t.password, t.name, "teacher");

    await supabase.from("users").upsert({
      id: userId,
      email: t.email,
      full_name: t.name,
      role: "teacher",
      is_active: true,
    }, { onConflict: "id" });

    const experienceYears = randomInt(3, 12);
    const rating = parseFloat((faker.number.float({ min: 4.0, max: 5.0, fractionDigits: 2 })).toFixed(2));

    const { data: profile } = await supabase
      .from("teacher_profiles")
      .upsert({
        user_id: userId,
        headline: t.headline,
        full_bio: faker.lorem.paragraphs(2),
        experience_years: experienceYears,
        teaching_style: faker.lorem.sentence(),
        availability_timezone: "Asia/Kolkata",
        rating_average: rating,
        rating_count: randomInt(10, 80),
        total_sessions: randomInt(20, 150),
        total_students: randomInt(10, 60),
        is_approved: true,
        approved_at: faker.date.past({ years: 1 }).toISOString(),
        approved_by: adminId,
        tier: "bronze",
        commission_rate: 0.20,
      }, { onConflict: "user_id" })
      .select("id")
      .single();

    const profileId = profile!.id;

    // Teacher subject
    await supabase.from("teacher_subjects").upsert({
      teacher_id: profileId,
      category_id: t.categoryId,
      is_primary: true,
      proficiency_level: "expert",
      years_in_subject: experienceYears,
    }, { onConflict: "teacher_id,category_id" });

    // Teacher fees
    const hourlyRate = randomInt(400, 1200) * 100; // in paise
    await supabase.from("teacher_fees").upsert([
      {
        teacher_id: profileId,
        category_id: t.categoryId,
        session_type: "hourly",
        amount: hourlyRate,
        duration_minutes: 60,
        description: "One-on-one hourly session",
        is_active: true,
      },
      {
        teacher_id: profileId,
        category_id: t.categoryId,
        session_type: "package",
        amount: hourlyRate * 8,
        duration_minutes: 60,
        description: "8-session package (save 15%)",
        is_active: true,
      },
    ] as never[], { onConflict: "teacher_id,category_id,session_type" });

    // Availability (Mon–Sat)
    for (let day = 1; day <= 6; day++) {
      await supabase.from("teacher_availability").upsert({
        teacher_id: profileId,
        day_of_week: day,
        start_time: "09:00",
        end_time: "19:00",
        is_available: true,
      }, { onConflict: "teacher_id,day_of_week" });
    }

    teacherIds.push({ userId, profileId, categoryId: t.categoryId, name: t.name, email: t.email });
    console.log(`  ✓ ${t.email}`);
  }

  // ── 3. Extra faker teachers (10 approved + 3 pending) ──────────────────────

  console.log("\n[3/6] Creating additional faker teachers...");
  const allCategoryIds = Object.values(CATEGORIES);

  const fakerTeacherSubjects = [
    CATEGORIES.physics, CATEGORIES.chemistry, CATEGORIES.biology,
    CATEGORIES.coding, CATEGORIES.dance, CATEGORIES.art,
    CATEGORIES.yoga, CATEGORIES.chess, CATEGORIES.swimming,
    CATEGORIES.publicSpeaking,
  ];

  for (let i = 0; i < 13; i++) {
    const isPending = i >= 10;
    const teacherName = faker.person.fullName();
    const teacherEmail = `faker.teacher.${i + 1}@test.myskillora.com`;
    const categoryId = fakerTeacherSubjects[i % fakerTeacherSubjects.length];

    const userId = await createAuthUser(teacherEmail, "TestTeacher@123", teacherName, "teacher");
    await supabase.from("users").upsert({ id: userId, email: teacherEmail, full_name: teacherName, role: "teacher", is_active: true }, { onConflict: "id" });

    const { data: profile } = await supabase
      .from("teacher_profiles")
      .upsert({
        user_id: userId,
        headline: faker.lorem.sentence({ min: 8, max: 15 }),
        full_bio: faker.lorem.paragraphs(2),
        experience_years: randomInt(1, 15),
        is_approved: !isPending,
        approved_at: isPending ? null : faker.date.past({ years: 1 }).toISOString(),
        approved_by: isPending ? null : adminId,
        rating_average: isPending ? 0 : parseFloat(faker.number.float({ min: 3.5, max: 5.0, fractionDigits: 2 }).toFixed(2)),
        rating_count: isPending ? 0 : randomInt(5, 50),
        total_sessions: isPending ? 0 : randomInt(5, 100),
        tier: "bronze",
        commission_rate: 0.20,
      }, { onConflict: "user_id" })
      .select("id")
      .single();

    if (profile && !isPending) {
      const profileId = profile.id;
      await supabase.from("teacher_subjects").upsert({ teacher_id: profileId, category_id: categoryId, is_primary: true }, { onConflict: "teacher_id,category_id" });
      const rate = randomInt(300, 1500) * 100;
      await supabase.from("teacher_fees").upsert({ teacher_id: profileId, category_id: categoryId, session_type: "hourly", amount: rate, duration_minutes: 60, is_active: true } as never, { onConflict: "teacher_id,category_id,session_type" });
      teacherIds.push({ userId, profileId, categoryId, name: teacherName, email: teacherEmail });
    }

    console.log(`  ✓ ${teacherEmail} (${isPending ? "pending" : "approved"})`);
  }

  // ── 4. Students ───────────────────────────────────────────────────────────

  console.log("\n[4/6] Creating student accounts...");
  const studentIds: { userId: string; name: string; email: string }[] = [];

  for (const s of FIXED_STUDENTS) {
    const userId = await createAuthUser(s.email, s.password, s.name, "student");
    await supabase.from("users").upsert({ id: userId, email: s.email, full_name: s.name, role: "student", is_active: true }, { onConflict: "id" });
    await supabase.from("students").upsert({ user_id: userId, grade_level: s.grade, school_name: s.school }, { onConflict: "user_id" });
    studentIds.push({ userId, name: s.name, email: s.email });
    console.log(`  ✓ ${s.email}`);
  }

  for (let i = 0; i < 8; i++) {
    const studentName = faker.person.fullName();
    const studentEmail = `faker.student.${i + 1}@test.myskillora.com`;
    const userId = await createAuthUser(studentEmail, "TestStudent@123", studentName, "student");
    await supabase.from("users").upsert({ id: userId, email: studentEmail, full_name: studentName, role: "student", is_active: true }, { onConflict: "id" });
    await supabase.from("students").upsert({ user_id: userId, grade_level: `Class ${randomInt(6, 12)}`, school_name: faker.company.name() + " School" }, { onConflict: "user_id" });
    studentIds.push({ userId, name: studentName, email: studentEmail });
    console.log(`  ✓ ${studentEmail}`);
  }

  // ── 5. Bookings, payments, reviews, messages ──────────────────────────────

  console.log("\n[5/6] Creating bookings, payments, reviews, and messages...");

  // Determine booking statuses: 40% completed, 25% confirmed, 20% pending, 15% cancelled
  const BOOKING_STATUSES = [
    ...Array(12).fill("completed"),
    ...Array(8).fill("confirmed"),
    ...Array(6).fill("pending"),
    ...Array(4).fill("cancelled"),
  ] as const;

  const bookingIds: { id: string; studentId: string; teacherId: string; status: string }[] = [];

  for (let i = 0; i < 30; i++) {
    const teacher = randomFrom(teacherIds.filter(t => t.profileId));
    const student = randomFrom(studentIds);
    const status = BOOKING_STATUSES[i] ?? "pending";
    const amountRupees = randomInt(400, 1500);
    const amount = amountInPaise(amountRupees);
    const platformFee = Math.round(amount * 0.20);
    const teacherPayout = amount - platformFee;

    const sessionDate = status === "completed"
      ? faker.date.past({ years: 0.5 }).toISOString().split("T")[0]
      : faker.date.soon({ days: 30 }).toISOString().split("T")[0];

    const { data: booking } = await supabase
      .from("bookings")
      .insert({
        student_id: student.userId,
        teacher_id: teacher.userId,
        category_id: teacher.categoryId,
        fee_id: (await supabase.from("teacher_fees").select("id").eq("teacher_id", teacher.profileId).limit(1).single()).data?.id ?? teacher.categoryId,
        session_date: sessionDate,
        session_time: `${randomInt(9, 18).toString().padStart(2, "0")}:00:00`,
        duration_minutes: 60,
        status,
        amount,
        platform_fee: platformFee,
        teacher_payout: teacherPayout,
        meeting_link: status === "confirmed" || status === "completed" ? `https://meet.google.com/${faker.string.alphanumeric(10)}` : null,
        cancellation_reason: status === "cancelled" ? "Schedule conflict" : null,
      })
      .select("id")
      .single();

    if (booking) {
      bookingIds.push({ id: booking.id, studentId: student.userId, teacherId: teacher.userId, status });

      // Payment for all non-pending bookings
      if (status !== "pending") {
        await supabase.from("payments").insert({
          booking_id: booking.id,
          student_id: student.userId,
          teacher_id: teacher.userId,
          razorpay_order_id: `order_${faker.string.alphanumeric(14)}`,
          razorpay_payment_id: status !== "cancelled" ? `pay_${faker.string.alphanumeric(14)}` : null,
          razorpay_signature: status !== "cancelled" ? faker.string.alphanumeric(64) : null,
          amount,
          status: status === "cancelled" ? "failed" : "captured",
          payment_method: randomFrom(["card", "upi", "netbanking"]),
        });
      }
    }
  }

  // Reviews for completed bookings (20 reviews)
  const completedBookings = bookingIds.filter(b => b.status === "completed").slice(0, 20);
  for (const booking of completedBookings) {
    const template = randomFrom(REVIEW_TEMPLATES);
    await supabase.from("reviews").insert({
      booking_id: booking.id,
      student_id: booking.studentId,
      teacher_id: booking.teacherId,
      rating: template.rating,
      title: template.title,
      body: template.body,
      is_verified_purchase: true,
      is_published: true,
    });
  }

  // Messages (15 conversations, 3 with contact info to test filter)
  const conversationPairs = [
    ...Array(12).fill(null).map((_, i) => ({
      sender: randomFrom(studentIds).userId,
      receiver: randomFrom(teacherIds).userId,
      includeContactInfo: false,
    })),
    // 3 conversations with contact info
    { sender: studentIds[0].userId, receiver: teacherIds[0].userId, includeContactInfo: true },
    { sender: studentIds[1].userId, receiver: teacherIds[1].userId, includeContactInfo: true },
    { sender: randomFrom(studentIds).userId, receiver: teacherIds[2].userId, includeContactInfo: true },
  ];

  for (const conv of conversationPairs) {
    // Normal message
    await supabase.from("messages").insert({
      sender_id: conv.sender,
      receiver_id: conv.receiver,
      content: faker.lorem.sentence({ min: 5, max: 15 }),
      is_filtered: false,
      is_read: Math.random() > 0.5,
    });

    if (conv.includeContactInfo) {
      // Message with contact info (should be filtered)
      const contactAttempts = [
        `Please contact me at +91 98765 43210 for the session details`,
        `You can reach me at mywhatsapp@gmail.com directly`,
        `Add me on WhatsApp: 9876543210 for faster communication`,
      ];
      await supabase.from("messages").insert({
        sender_id: conv.sender,
        receiver_id: conv.receiver,
        content: randomFrom(contactAttempts),
        is_filtered: true,
        filtered_reason: "Contains contact information",
        is_read: false,
      });
    }
  }

  console.log("  ✓ 30 bookings created");
  console.log("  ✓ Payment records created");
  console.log("  ✓ 20 reviews created");
  console.log("  ✓ 15 message conversations (3 with contact-info filter)");

  // ── 6. Notifications ──────────────────────────────────────────────────────

  console.log("\n[6/6] Creating notifications...");

  for (const student of studentIds.slice(0, 3)) {
    await supabase.from("notifications").insert({
      user_id: student.userId,
      type: "booking_confirmed",
      title: "Booking Confirmed",
      body: "Your session has been confirmed. Check your dashboard for the meeting link.",
      data: { booking_id: bookingIds[0]?.id },
      is_read: false,
    });
  }

  for (const teacher of teacherIds.slice(0, 3)) {
    await supabase.from("notifications").insert({
      user_id: teacher.userId,
      type: "new_booking",
      title: "New Booking Request",
      body: "You have a new session request. Please review and confirm.",
      data: {},
      is_read: false,
    });
  }

  console.log("  ✓ Notifications created");

  // ── Summary ────────────────────────────────────────────────────────────────

  console.log("\n✅ Seed complete!\n");
  console.log("Test accounts ready:\n");
  console.log("  ADMIN");
  console.log("  admin@test.myskillora.com / TestAdmin@123\n");
  console.log("  TEACHERS");
  FIXED_TEACHERS.forEach(t => console.log(`  ${t.email} / TestTeacher@123`));
  console.log("\n  STUDENTS");
  FIXED_STUDENTS.forEach(s => console.log(`  ${s.email} / TestStudent@123`));
  console.log("\n  + 10 approved faker teachers (faker.teacher.1-10@test.myskillora.com)");
  console.log("  + 3 pending faker teachers (faker.teacher.11-13@test.myskillora.com)");
  console.log("  + 8 faker students (faker.student.1-8@test.myskillora.com)");
  console.log("\nAll faker account password: TestTeacher@123 or TestStudent@123\n");
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
