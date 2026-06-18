export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "student" | "teacher" | "admin";
export type CategoryType = "academic" | "activity" | "professional";
export type TeacherTier = "bronze" | "silver" | "gold" | "elite";
export type SessionType = "hourly" | "monthly" | "package";
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "disputed";
export type PaymentStatus = "created" | "captured" | "failed" | "refunded";
export type PayoutStatus = "pending" | "processing" | "completed" | "failed";
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          role: UserRole;
          is_verified: boolean;
          is_active: boolean;
          onboarding_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: UserRole;
          is_verified?: boolean;
          is_active?: boolean;
          onboarding_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          bio: string | null;
          city: string | null;
          state: string | null;
          country: string | null;
          language_preferences: string[];
          social_links: Json;
          date_of_birth: string | null;
          gender: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bio?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          language_preferences?: string[];
          social_links?: Json;
          date_of_birth?: string | null;
          gender?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          icon_url: string | null;
          parent_id: string | null;
          type: CategoryType;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          icon_url?: string | null;
          parent_id?: string | null;
          type?: CategoryType;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
      teacher_profiles: {
        Row: {
          id: string;
          user_id: string;
          headline: string | null;
          full_bio: string | null;
          experience_years: number | null;
          qualifications: Json;
          teaching_style: string | null;
          availability_timezone: string;
          rating_average: number;
          rating_count: number;
          total_students: number;
          total_sessions: number;
          commission_rate: number;
          tier: TeacherTier;
          is_approved: boolean;
          approved_at: string | null;
          approved_by: string | null;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          headline?: string | null;
          full_bio?: string | null;
          experience_years?: number | null;
          qualifications?: Json;
          teaching_style?: string | null;
          availability_timezone?: string;
          rating_average?: number;
          rating_count?: number;
          total_students?: number;
          total_sessions?: number;
          commission_rate?: number;
          tier?: TeacherTier;
          is_approved?: boolean;
          approved_at?: string | null;
          approved_by?: string | null;
          is_featured?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["teacher_profiles"]["Insert"]>;
      };
      teacher_subjects: {
        Row: {
          id: string;
          teacher_id: string;
          category_id: string;
          proficiency_level: string | null;
          years_in_subject: number | null;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          category_id: string;
          proficiency_level?: string | null;
          years_in_subject?: number | null;
          is_primary?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["teacher_subjects"]["Insert"]>;
      };
      teacher_fees: {
        Row: {
          id: string;
          teacher_id: string;
          category_id: string;
          session_type: SessionType;
          amount: number;
          currency: string;
          duration_minutes: number | null;
          description: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          category_id: string;
          session_type: SessionType;
          amount: number;
          currency?: string;
          duration_minutes?: number | null;
          description?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["teacher_fees"]["Insert"]>;
      };
      sample_videos: {
        Row: {
          id: string;
          teacher_id: string;
          category_id: string;
          title: string;
          description: string | null;
          cloudinary_public_id: string;
          cloudinary_url: string;
          thumbnail_url: string | null;
          duration_seconds: number | null;
          view_count: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          category_id: string;
          title: string;
          description?: string | null;
          cloudinary_public_id: string;
          cloudinary_url: string;
          thumbnail_url?: string | null;
          duration_seconds?: number | null;
          view_count?: number;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["sample_videos"]["Insert"]>;
      };
      students: {
        Row: {
          id: string;
          user_id: string;
          grade_level: string | null;
          school_name: string | null;
          learning_goals: string[];
          preferred_subjects: string[];
          parent_name: string | null;
          parent_phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          grade_level?: string | null;
          school_name?: string | null;
          learning_goals?: string[];
          preferred_subjects?: string[];
          parent_name?: string | null;
          parent_phone?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["students"]["Insert"]>;
      };
      bookings: {
        Row: {
          id: string;
          student_id: string;
          teacher_id: string;
          category_id: string;
          fee_id: string;
          session_date: string;
          session_time: string;
          duration_minutes: number;
          status: BookingStatus;
          amount: number;
          platform_fee: number;
          teacher_payout: number;
          currency: string;
          meeting_link: string | null;
          notes: string | null;
          cancellation_reason: string | null;
          cancelled_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          teacher_id: string;
          category_id: string;
          fee_id: string;
          session_date: string;
          session_time: string;
          duration_minutes: number;
          status?: BookingStatus;
          amount: number;
          platform_fee: number;
          teacher_payout: number;
          currency?: string;
          meeting_link?: string | null;
          notes?: string | null;
          cancellation_reason?: string | null;
          cancelled_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
      };
      payments: {
        Row: {
          id: string;
          booking_id: string;
          student_id: string;
          teacher_id: string;
          razorpay_order_id: string;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          amount: number;
          currency: string;
          status: PaymentStatus;
          payment_method: string | null;
          refund_id: string | null;
          refund_amount: number | null;
          refund_reason: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          student_id: string;
          teacher_id: string;
          razorpay_order_id: string;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          amount: number;
          currency?: string;
          status?: PaymentStatus;
          payment_method?: string | null;
          refund_id?: string | null;
          refund_amount?: number | null;
          refund_reason?: string | null;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          student_id: string;
          teacher_id: string;
          rating: number;
          title: string | null;
          body: string | null;
          is_verified_purchase: boolean;
          teacher_response: string | null;
          teacher_responded_at: string | null;
          is_flagged: boolean;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          student_id: string;
          teacher_id: string;
          rating: number;
          title?: string | null;
          body?: string | null;
          is_verified_purchase?: boolean;
          teacher_response?: string | null;
          teacher_responded_at?: string | null;
          is_flagged?: boolean;
          is_published?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          booking_id: string | null;
          content: string;
          is_filtered: boolean;
          filtered_reason: string | null;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          booking_id?: string | null;
          content: string;
          is_filtered?: boolean;
          filtered_reason?: string | null;
          is_read?: boolean;
          read_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          data: Json;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          data?: Json;
          is_read?: boolean;
          read_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      teacher_availability: {
        Row: {
          id: string;
          teacher_id: string;
          day_of_week: DayOfWeek;
          start_time: string;
          end_time: string;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          day_of_week: DayOfWeek;
          start_time: string;
          end_time: string;
          is_available?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["teacher_availability"]["Insert"]>;
      };
      payouts: {
        Row: {
          id: string;
          teacher_id: string;
          amount: number;
          currency: string;
          status: PayoutStatus;
          razorpay_payout_id: string | null;
          bank_account_details: Json;
          period_start: string;
          period_end: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          amount: number;
          currency?: string;
          status?: PayoutStatus;
          razorpay_payout_id?: string | null;
          bank_account_details?: Json;
          period_start: string;
          period_end: string;
        };
        Update: Partial<Database["public"]["Tables"]["payouts"]["Insert"]>;
      };
      platform_settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          description: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          description?: string | null;
          updated_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["platform_settings"]["Insert"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_data: Json | null;
          new_data: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      category_type: CategoryType;
      teacher_tier: TeacherTier;
      session_type: SessionType;
      booking_status: BookingStatus;
      payment_status: PaymentStatus;
      payout_status: PayoutStatus;
    };
  };
}
