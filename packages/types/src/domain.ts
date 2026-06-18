import type { Database, UserRole, TeacherTier, BookingStatus, PaymentStatus } from "./database";

type Tables = Database["public"]["Tables"];

export type User = Tables["users"]["Row"];
export type Profile = Tables["profiles"]["Row"];
export type Category = Tables["categories"]["Row"];
export type TeacherProfile = Tables["teacher_profiles"]["Row"];
export type TeacherSubject = Tables["teacher_subjects"]["Row"];
export type TeacherFee = Tables["teacher_fees"]["Row"];
export type SampleVideo = Tables["sample_videos"]["Row"];
export type Student = Tables["students"]["Row"];
export type Booking = Tables["bookings"]["Row"];
export type Payment = Tables["payments"]["Row"];
export type Review = Tables["reviews"]["Row"];
export type Message = Tables["messages"]["Row"];
export type Notification = Tables["notifications"]["Row"];
export type TeacherAvailability = Tables["teacher_availability"]["Row"];
export type Payout = Tables["payouts"]["Row"];
export type PlatformSetting = Tables["platform_settings"]["Row"];
export type AuditLog = Tables["audit_logs"]["Row"];

/** Rich teacher object with joined relations — used in teacher profile pages */
export interface TeacherWithDetails extends TeacherProfile {
  user: User;
  profile: Profile | null;
  subjects: (TeacherSubject & { category: Category })[];
  fees: TeacherFee[];
  videos: SampleVideo[];
  recentReviews: ReviewWithStudent[];
}

/** Review enriched with student display info */
export interface ReviewWithStudent extends Review {
  student: Pick<User, "id" | "full_name" | "avatar_url">;
}

/** Booking enriched with all related records */
export interface BookingWithDetails extends Booking {
  student: Pick<User, "id" | "full_name" | "avatar_url" | "email">;
  teacher: Pick<User, "id" | "full_name" | "avatar_url" | "email">;
  category: Category;
  fee: TeacherFee;
  payment: Payment | null;
}

/** Message enriched with sender info */
export interface MessageWithSender extends Message {
  sender: Pick<User, "id" | "full_name" | "avatar_url">;
}

/** Chat thread metadata */
export interface ChatThread {
  otherUser: Pick<User, "id" | "full_name" | "avatar_url" | "role">;
  lastMessage: Message | null;
  unreadCount: number;
  bookingId: string | null;
}

/** Commission rates by tier */
export const COMMISSION_RATES: Record<TeacherTier, number> = {
  bronze: 0.20,
  silver: 0.17,
  gold: 0.14,
  elite: 0.10,
};

/** Tier upgrade thresholds */
export const TIER_THRESHOLDS: Record<Exclude<TeacherTier, "bronze">, { minSessions: number; minRating?: number }> = {
  silver: { minSessions: 50 },
  gold: { minSessions: 200, minRating: 4.5 },
  elite: { minSessions: 500, minRating: 4.8 },
};

/** Subject colour map for UI rendering */
export const SUBJECT_COLORS: Record<string, string> = {
  english: "#3B82F6",
  maths: "#8B5CF6",
  science: "#10B981",
  tamil: "#F59E0B",
  music: "#EC4899",
  "martial-arts": "#EF4444",
  dance: "#F97316",
  art: "#06B6D4",
  coding: "#6366F1",
  default: "#64748B",
};

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  onboarding_complete: boolean;
};

export type PaginatedResponse<T> = {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type TeacherFilterParams = {
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  city?: string;
  country?: string;
  tier?: TeacherTier;
  isAvailable?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "rating" | "price_asc" | "price_desc" | "newest";
};

export type BookingStatusUpdate = {
  bookingId: string;
  status: BookingStatus;
  cancellationReason?: string;
  meetingLink?: string;
};

export type PaymentStatusUpdate = {
  paymentId: string;
  status: PaymentStatus;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
};

export type NotificationType =
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_completed"
  | "payment_received"
  | "payment_failed"
  | "review_received"
  | "review_response"
  | "message_received"
  | "payout_processed"
  | "teacher_approved"
  | "teacher_rejected";
