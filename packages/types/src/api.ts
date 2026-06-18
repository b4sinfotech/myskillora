import type { BookingStatus, PaymentStatus, UserRole } from "./database";

/** Standard API success envelope */
export type ApiSuccess<T> = {
  success: true;
  data: T;
};

/** Standard API error envelope */
export type ApiError = {
  success: false;
  error: string;
  code?: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ── Auth ─────────────────────────────────────────────────────────────────────

export type SignUpRequest = {
  email: string;
  password: string;
  fullName: string;
  role: Extract<UserRole, "student" | "teacher">;
  phone?: string;
};

export type SignInRequest = {
  email: string;
  password: string;
};

// ── Bookings ─────────────────────────────────────────────────────────────────

export type CreateBookingRequest = {
  teacherId: string;
  categoryId: string;
  feeId: string;
  sessionDate: string;
  sessionTime: string;
  notes?: string;
};

export type CreateBookingResponse = {
  bookingId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
};

export type UpdateBookingStatusRequest = {
  status: BookingStatus;
  cancellationReason?: string;
  meetingLink?: string;
};

// ── Payments ─────────────────────────────────────────────────────────────────

export type CreateOrderRequest = {
  bookingId: string;
};

export type CreateOrderResponse = {
  orderId: string;
  amount: number;
  currency: string;
  key: string;
};

export type VerifyPaymentRequest = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  bookingId: string;
};

export type RazorpayWebhookEvent = {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        currency: string;
        status: string;
        method: string;
      };
    };
    order?: {
      entity: {
        id: string;
        amount: number;
        status: string;
      };
    };
  };
  created_at: number;
};

// ── Uploads ───────────────────────────────────────────────────────────────────

export type SignedUploadRequest = {
  folder: string;
  resourceType?: "image" | "video" | "raw";
};

export type SignedUploadResponse = {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
};

// ── Search ────────────────────────────────────────────────────────────────────

export type SearchRequest = {
  query: string;
  type?: "teachers" | "categories" | "all";
  limit?: number;
};

export type SearchResult = {
  teachers: Array<{ id: string; full_name: string; headline: string | null; slug: string }>;
  categories: Array<{ id: string; name: string; slug: string; type: string }>;
};

// ── Admin ─────────────────────────────────────────────────────────────────────

export type ApproveTeacherRequest = {
  teacherId: string;
  action: "approve" | "reject" | "suspend";
  reason?: string;
};

export type UpdatePaymentStatusRequest = {
  paymentId: string;
  status: PaymentStatus;
  refundReason?: string;
};

export type PlatformKPIs = {
  totalUsers: number;
  totalTeachers: number;
  totalStudents: number;
  totalBookings: number;
  totalRevenue: number;
  activeBookings: number;
  pendingApprovals: number;
  avgRating: number;
};
