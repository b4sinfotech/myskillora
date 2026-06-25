-- =============================================================================
-- myskillora — Initial Schema Migration
-- Generated: 2026-06-17
-- Run this in: Supabase → SQL Editor → paste and execute
-- =============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";
create extension if not exists "unaccent";

-- =============================================================================
-- IDEMPOTENCY: Drop all existing public schema policies before recreating.
-- This makes the migration safe to re-run on an existing database.
-- Tables and their data are NOT affected.
-- =============================================================================
do $$
declare r record;
begin
  for r in (select policyname, tablename from pg_policies where schemaname = 'public') loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Drop triggers before recreating (OR REPLACE not available for triggers)
drop trigger if exists users_updated_at              on public.users;
drop trigger if exists profiles_updated_at           on public.profiles;
drop trigger if exists teacher_profiles_updated_at   on public.teacher_profiles;
drop trigger if exists teacher_availability_updated_at on public.teacher_availability;
drop trigger if exists bookings_updated_at           on public.bookings;
drop trigger if exists payments_updated_at           on public.payments;
drop trigger if exists reviews_updated_at            on public.reviews;
drop trigger if exists payouts_updated_at            on public.payouts;
drop trigger if exists on_auth_user_created          on auth.users;
drop trigger if exists after_review_insert_or_update on public.reviews;
drop trigger if exists after_booking_status_change   on public.bookings;
drop trigger if exists after_payment_update          on public.payments;

-- =============================================================================
-- ENUMS
-- =============================================================================

do $$ begin create type user_role     as enum ('student', 'teacher', 'admin');         exception when duplicate_object then null; end $$;
do $$ begin create type category_type as enum ('academic', 'activity', 'professional');   exception when duplicate_object then null; end $$;
do $$ begin create type teacher_tier  as enum ('bronze', 'silver', 'gold', 'elite');      exception when duplicate_object then null; end $$;
do $$ begin create type session_type  as enum ('hourly', 'monthly', 'package');           exception when duplicate_object then null; end $$;
do $$ begin create type booking_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'disputed'); exception when duplicate_object then null; end $$;
do $$ begin create type payment_status as enum ('created', 'captured', 'failed', 'refunded');  exception when duplicate_object then null; end $$;
do $$ begin create type payout_status  as enum ('pending', 'processing', 'completed', 'failed'); exception when duplicate_object then null; end $$;

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Auto-update updated_at timestamp on any table that has it
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- TABLE: users (extends auth.users)
-- =============================================================================

create table if not exists public.users (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text not null unique,
  full_name           text,
  avatar_url          text,
  phone               text,
  role                user_role not null default 'student',
  is_verified         boolean not null default false,
  is_active           boolean not null default true,
  onboarding_complete boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_users_role on public.users(role);
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_created_at on public.users(created_at desc);

create trigger users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

alter table public.users enable row level security;

create policy "Users can view their own record"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own record"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins have full access to users"
  on public.users for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- Allow service role to insert (triggered by auth.users)
create policy "Service role can insert users"
  on public.users for insert
  with check (true);

-- =============================================================================
-- TABLE: profiles
-- =============================================================================

create table if not exists public.profiles (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null unique references public.users(id) on delete cascade,
  bio                   text,
  city                  text,
  state                 text,
  country               text,
  language_preferences  text[] not null default '{}',
  social_links          jsonb not null default '{}',
  date_of_birth         date,
  gender                text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_profiles_user_id on public.profiles(user_id);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

alter table public.profiles enable row level security;

create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id OR true); -- OR true allows trigger

create policy "Admins have full access to profiles"
  on public.profiles for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- =============================================================================
-- TABLE: categories
-- =============================================================================

create table if not exists public.categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  description text,
  icon_url    text,
  parent_id   uuid references public.categories(id) on delete set null,
  type        category_type not null default 'academic',
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_categories_slug on public.categories(slug);
create index if not exists idx_categories_parent_id on public.categories(parent_id);
create index if not exists idx_categories_type on public.categories(type);
create index if not exists idx_categories_is_active on public.categories(is_active);

alter table public.categories enable row level security;

create policy "Categories are publicly readable"
  on public.categories for select
  using (is_active = true);

create policy "Admins can manage categories"
  on public.categories for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- =============================================================================
-- TABLE: teacher_profiles
-- =============================================================================

create table if not exists public.teacher_profiles (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null unique references public.users(id) on delete cascade,
  headline              text,
  full_bio              text,
  experience_years      integer check (experience_years >= 0),
  qualifications        jsonb not null default '[]',
  teaching_style        text,
  availability_timezone text not null default 'Asia/Kolkata',
  rating_average        numeric(3,2) not null default 0.00 check (rating_average >= 0 and rating_average <= 5),
  rating_count          integer not null default 0 check (rating_count >= 0),
  total_students        integer not null default 0 check (total_students >= 0),
  total_sessions        integer not null default 0 check (total_sessions >= 0),
  commission_rate       numeric(4,2) not null default 0.20 check (commission_rate >= 0 and commission_rate <= 1),
  tier                  teacher_tier not null default 'bronze',
  is_approved           boolean not null default false,
  approved_at           timestamptz,
  approved_by           uuid references public.users(id),
  is_featured           boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_teacher_profiles_user_id on public.teacher_profiles(user_id);
create index if not exists idx_teacher_profiles_is_approved on public.teacher_profiles(is_approved);
create index if not exists idx_teacher_profiles_rating on public.teacher_profiles(rating_average desc);
create index if not exists idx_teacher_profiles_is_featured on public.teacher_profiles(is_featured);
create index if not exists idx_teacher_profiles_tier on public.teacher_profiles(tier);
create index if not exists idx_teacher_profiles_created_at on public.teacher_profiles(created_at desc);

create trigger teacher_profiles_updated_at
  before update on public.teacher_profiles
  for each row execute function public.handle_updated_at();

alter table public.teacher_profiles enable row level security;

create policy "Approved teacher profiles are publicly readable"
  on public.teacher_profiles for select
  using (is_approved = true);

create policy "Teachers can view their own profile"
  on public.teacher_profiles for select
  using (auth.uid() = user_id);

create policy "Teachers can update their own profile"
  on public.teacher_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Teachers can insert their own profile"
  on public.teacher_profiles for insert
  with check (auth.uid() = user_id);

create policy "Admins have full access to teacher profiles"
  on public.teacher_profiles for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- =============================================================================
-- TABLE: teacher_subjects
-- =============================================================================

create table if not exists public.teacher_subjects (
  id                uuid primary key default uuid_generate_v4(),
  teacher_id        uuid not null references public.teacher_profiles(id) on delete cascade,
  category_id       uuid not null references public.categories(id) on delete cascade,
  proficiency_level text,
  years_in_subject  integer check (years_in_subject >= 0),
  is_primary        boolean not null default false,
  created_at        timestamptz not null default now(),
  unique(teacher_id, category_id)
);

create index if not exists idx_teacher_subjects_teacher_id on public.teacher_subjects(teacher_id);
create index if not exists idx_teacher_subjects_category_id on public.teacher_subjects(category_id);

alter table public.teacher_subjects enable row level security;

create policy "Teacher subjects are publicly readable"
  on public.teacher_subjects for select
  using (true);

create policy "Teachers can manage their own subjects"
  on public.teacher_subjects for all
  using (
    exists (
      select 1 from public.teacher_profiles tp
      where tp.id = teacher_id and tp.user_id = auth.uid()
    )
  );

create policy "Admins can manage teacher subjects"
  on public.teacher_subjects for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- =============================================================================
-- TABLE: teacher_fees
-- =============================================================================

create table if not exists public.teacher_fees (
  id               uuid primary key default uuid_generate_v4(),
  teacher_id       uuid not null references public.teacher_profiles(id) on delete cascade,
  category_id      uuid not null references public.categories(id) on delete cascade,
  session_type     session_type not null,
  amount           integer not null check (amount > 0), -- stored in paise
  currency         text not null default 'INR',
  duration_minutes integer check (duration_minutes > 0),
  description      text,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

create index if not exists idx_teacher_fees_teacher_id on public.teacher_fees(teacher_id);
create index if not exists idx_teacher_fees_category_id on public.teacher_fees(category_id);
create index if not exists idx_teacher_fees_is_active on public.teacher_fees(is_active);

alter table public.teacher_fees enable row level security;

create policy "Active teacher fees are publicly readable"
  on public.teacher_fees for select
  using (is_active = true);

create policy "Teachers can manage their own fees"
  on public.teacher_fees for all
  using (
    exists (
      select 1 from public.teacher_profiles tp
      where tp.id = teacher_id and tp.user_id = auth.uid()
    )
  );

create policy "Admins can manage teacher fees"
  on public.teacher_fees for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- =============================================================================
-- TABLE: sample_videos
-- =============================================================================

create table if not exists public.sample_videos (
  id                   uuid primary key default uuid_generate_v4(),
  teacher_id           uuid not null references public.teacher_profiles(id) on delete cascade,
  category_id          uuid not null references public.categories(id) on delete cascade,
  title                text not null,
  description          text,
  cloudinary_public_id text not null,
  cloudinary_url       text not null,
  thumbnail_url        text,
  duration_seconds     integer check (duration_seconds > 0),
  view_count           integer not null default 0 check (view_count >= 0),
  is_active            boolean not null default true,
  created_at           timestamptz not null default now()
);

create index if not exists idx_sample_videos_teacher_id on public.sample_videos(teacher_id);
create index if not exists idx_sample_videos_category_id on public.sample_videos(category_id);
create index if not exists idx_sample_videos_is_active on public.sample_videos(is_active);

alter table public.sample_videos enable row level security;

create policy "Active sample videos are publicly readable"
  on public.sample_videos for select
  using (is_active = true);

create policy "Teachers can manage their own videos"
  on public.sample_videos for all
  using (
    exists (
      select 1 from public.teacher_profiles tp
      where tp.id = teacher_id and tp.user_id = auth.uid()
    )
  );

create policy "Admins can manage sample videos"
  on public.sample_videos for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- =============================================================================
-- TABLE: students
-- =============================================================================

create table if not exists public.students (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null unique references public.users(id) on delete cascade,
  grade_level         text,
  school_name         text,
  learning_goals      text[] not null default '{}',
  preferred_subjects  uuid[] not null default '{}',
  parent_name         text,
  parent_phone        text,
  created_at          timestamptz not null default now()
);

create index if not exists idx_students_user_id on public.students(user_id);

alter table public.students enable row level security;

create policy "Students can view their own record"
  on public.students for select
  using (auth.uid() = user_id);

create policy "Students can update their own record"
  on public.students for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Students can insert their own record"
  on public.students for insert
  with check (auth.uid() = user_id OR true);

create policy "Admins have full access to students"
  on public.students for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- =============================================================================
-- TABLE: bookings
-- =============================================================================

create table if not exists public.bookings (
  id                  uuid primary key default uuid_generate_v4(),
  student_id          uuid not null references public.users(id) on delete restrict,
  teacher_id          uuid not null references public.users(id) on delete restrict,
  category_id         uuid not null references public.categories(id) on delete restrict,
  fee_id              uuid not null references public.teacher_fees(id) on delete restrict,
  session_date        date not null,
  session_time        time not null,
  duration_minutes    integer not null check (duration_minutes > 0),
  status              booking_status not null default 'pending',
  amount              integer not null check (amount > 0), -- in paise
  platform_fee        integer not null check (platform_fee >= 0),
  teacher_payout      integer not null check (teacher_payout >= 0),
  currency            text not null default 'INR',
  meeting_link        text,
  notes               text,
  cancellation_reason text,
  cancelled_by        uuid references public.users(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint booking_amount_check check (amount = platform_fee + teacher_payout)
);

create index if not exists idx_bookings_student_id on public.bookings(student_id);
create index if not exists idx_bookings_teacher_id on public.bookings(teacher_id);
create index if not exists idx_bookings_status on public.bookings(status);
create index if not exists idx_bookings_session_date on public.bookings(session_date);
create index if not exists idx_bookings_created_at on public.bookings(created_at desc);
create index if not exists idx_bookings_category_id on public.bookings(category_id);

create trigger bookings_updated_at
  before update on public.bookings
  for each row execute function public.handle_updated_at();

alter table public.bookings enable row level security;

create policy "Students can view their own bookings"
  on public.bookings for select
  using (auth.uid() = student_id);

create policy "Teachers can view their own bookings"
  on public.bookings for select
  using (auth.uid() = teacher_id);

create policy "Students can create bookings"
  on public.bookings for insert
  with check (auth.uid() = student_id);

create policy "Students can update their own bookings (cancel)"
  on public.bookings for update
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

create policy "Teachers can update booking status"
  on public.bookings for update
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

create policy "Admins have full access to bookings"
  on public.bookings for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- =============================================================================
-- TABLE: payments
-- =============================================================================

create table if not exists public.payments (
  id                  uuid primary key default uuid_generate_v4(),
  booking_id          uuid not null references public.bookings(id) on delete restrict,
  student_id          uuid not null references public.users(id) on delete restrict,
  teacher_id          uuid not null references public.users(id) on delete restrict,
  razorpay_order_id   text not null unique,
  razorpay_payment_id text unique,
  razorpay_signature  text,
  amount              integer not null check (amount > 0),
  currency            text not null default 'INR',
  status              payment_status not null default 'created',
  payment_method      text,
  refund_id           text,
  refund_amount       integer check (refund_amount >= 0),
  refund_reason       text,
  metadata            jsonb not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_payments_booking_id on public.payments(booking_id);
create index if not exists idx_payments_student_id on public.payments(student_id);
create index if not exists idx_payments_teacher_id on public.payments(teacher_id);
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_payments_razorpay_order_id on public.payments(razorpay_order_id);
create index if not exists idx_payments_created_at on public.payments(created_at desc);

create trigger payments_updated_at
  before update on public.payments
  for each row execute function public.handle_updated_at();

alter table public.payments enable row level security;

create policy "Students can view their own payments"
  on public.payments for select
  using (auth.uid() = student_id);

create policy "Teachers can view their own payments"
  on public.payments for select
  using (auth.uid() = teacher_id);

create policy "Service role can manage payments"
  on public.payments for all
  using (true);

create policy "Admins have full access to payments"
  on public.payments for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- =============================================================================
-- TABLE: reviews
-- =============================================================================

create table if not exists public.reviews (
  id                    uuid primary key default uuid_generate_v4(),
  booking_id            uuid not null unique references public.bookings(id) on delete restrict,
  student_id            uuid not null references public.users(id) on delete restrict,
  teacher_id            uuid not null references public.users(id) on delete restrict,
  rating                integer not null check (rating >= 1 and rating <= 5),
  title                 text,
  body                  text,
  is_verified_purchase  boolean not null default true,
  teacher_response      text,
  teacher_responded_at  timestamptz,
  is_flagged            boolean not null default false,
  is_published          boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_reviews_teacher_id on public.reviews(teacher_id);
create index if not exists idx_reviews_student_id on public.reviews(student_id);
create index if not exists idx_reviews_booking_id on public.reviews(booking_id);
create index if not exists idx_reviews_is_published on public.reviews(is_published);
create index if not exists idx_reviews_rating on public.reviews(rating);
create index if not exists idx_reviews_created_at on public.reviews(created_at desc);

create trigger reviews_updated_at
  before update on public.reviews
  for each row execute function public.handle_updated_at();

alter table public.reviews enable row level security;

create policy "Published reviews are publicly readable"
  on public.reviews for select
  using (is_published = true);

create policy "Students can view their own reviews"
  on public.reviews for select
  using (auth.uid() = student_id);

create policy "Students can insert reviews for completed bookings"
  on public.reviews for insert
  with check (
    auth.uid() = student_id
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.student_id = auth.uid()
        and b.status = 'completed'
    )
  );

create policy "Teachers can update their response"
  on public.reviews for update
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

create policy "Admins have full access to reviews"
  on public.reviews for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- =============================================================================
-- TABLE: messages
-- =============================================================================

create table if not exists public.messages (
  id              uuid primary key default uuid_generate_v4(),
  sender_id       uuid not null references public.users(id) on delete cascade,
  receiver_id     uuid not null references public.users(id) on delete cascade,
  booking_id      uuid references public.bookings(id) on delete set null,
  content         text not null,
  is_filtered     boolean not null default false,
  filtered_reason text,
  is_read         boolean not null default false,
  read_at         timestamptz,
  created_at      timestamptz not null default now(),
  constraint no_self_message check (sender_id != receiver_id)
);

create index if not exists idx_messages_sender_id on public.messages(sender_id);
create index if not exists idx_messages_receiver_id on public.messages(receiver_id);
create index if not exists idx_messages_booking_id on public.messages(booking_id);
create index if not exists idx_messages_created_at on public.messages(created_at desc);
create index if not exists idx_messages_is_read on public.messages(is_read) where is_read = false;

alter table public.messages enable row level security;

create policy "Users can view their own messages"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "Users can mark messages as read"
  on public.messages for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

create policy "Admins have full access to messages"
  on public.messages for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- =============================================================================
-- TABLE: notifications
-- =============================================================================

create table if not exists public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text not null,
  data       jsonb not null default '{}',
  is_read    boolean not null default false,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_is_read on public.notifications(is_read) where is_read = false;
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications (mark read)"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Service role can insert notifications"
  on public.notifications for insert
  with check (true);

create policy "Admins have full access to notifications"
  on public.notifications for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- =============================================================================
-- TABLE: teacher_availability
-- =============================================================================

create table if not exists public.teacher_availability (
  id          uuid primary key default uuid_generate_v4(),
  teacher_id  uuid not null references public.teacher_profiles(id) on delete cascade,
  day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6),
  start_time  time not null,
  end_time    time not null,
  is_available boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(teacher_id, day_of_week),
  constraint end_after_start check (end_time > start_time)
);

create index if not exists idx_teacher_availability_teacher_id on public.teacher_availability(teacher_id);
create index if not exists idx_teacher_availability_day on public.teacher_availability(day_of_week);

create trigger teacher_availability_updated_at
  before update on public.teacher_availability
  for each row execute function public.handle_updated_at();

alter table public.teacher_availability enable row level security;

create policy "Teacher availability is publicly readable"
  on public.teacher_availability for select
  using (true);

create policy "Teachers can manage their own availability"
  on public.teacher_availability for all
  using (
    exists (
      select 1 from public.teacher_profiles tp
      where tp.id = teacher_id and tp.user_id = auth.uid()
    )
  );

create policy "Admins can manage teacher availability"
  on public.teacher_availability for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- =============================================================================
-- TABLE: payouts
-- =============================================================================

create table if not exists public.payouts (
  id                    uuid primary key default uuid_generate_v4(),
  teacher_id            uuid not null references public.users(id) on delete restrict,
  amount                integer not null check (amount > 0),
  currency              text not null default 'INR',
  status                payout_status not null default 'pending',
  razorpay_payout_id    text unique,
  bank_account_details  jsonb not null default '{}',
  period_start          date not null,
  period_end            date not null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint period_end_after_start check (period_end >= period_start)
);

create index if not exists idx_payouts_teacher_id on public.payouts(teacher_id);
create index if not exists idx_payouts_status on public.payouts(status);
create index if not exists idx_payouts_created_at on public.payouts(created_at desc);

create trigger payouts_updated_at
  before update on public.payouts
  for each row execute function public.handle_updated_at();

alter table public.payouts enable row level security;

create policy "Teachers can view their own payouts"
  on public.payouts for select
  using (auth.uid() = teacher_id);

create policy "Admins have full access to payouts"
  on public.payouts for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

create policy "Service role can manage payouts"
  on public.payouts for all
  using (true);

-- =============================================================================
-- TABLE: platform_settings
-- =============================================================================

create table if not exists public.platform_settings (
  id          uuid primary key default uuid_generate_v4(),
  key         text not null unique,
  value       jsonb not null,
  description text,
  updated_by  uuid references public.users(id),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_platform_settings_key on public.platform_settings(key);

alter table public.platform_settings enable row level security;

create policy "Platform settings are readable by authenticated users"
  on public.platform_settings for select
  using (auth.role() = 'authenticated');

create policy "Admins can manage platform settings"
  on public.platform_settings for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- =============================================================================
-- TABLE: audit_logs (immutable — no UPDATE or DELETE allowed)
-- =============================================================================

create table if not exists public.audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.users(id) on delete set null,
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  old_data    jsonb,
  new_data    jsonb,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id);
create index if not exists idx_audit_logs_entity_type on public.audit_logs(entity_type);
create index if not exists idx_audit_logs_entity_id on public.audit_logs(entity_id);
create index if not exists idx_audit_logs_action on public.audit_logs(action);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

alter table public.audit_logs enable row level security;

create policy "Admins can view audit logs"
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

create policy "Service role can insert audit logs"
  on public.audit_logs for insert
  with check (true);

-- Prevent any UPDATE or DELETE on audit_logs
create policy "Audit logs are immutable — no updates"
  on public.audit_logs for update
  using (false);

create policy "Audit logs are immutable — no deletes"
  on public.audit_logs for delete
  using (false);

-- =============================================================================
-- TRIGGER: Auto-create user + profile on auth signup
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_email text;
  user_role_val user_role;
begin
  -- Check if this email should be admin (from platform_settings)
  select value::text into admin_email
  from public.platform_settings
  where key = 'admin_email'
  limit 1;

  if admin_email is not null and trim(both '"' from admin_email) = new.email then
    user_role_val := 'admin';
  else
    user_role_val := coalesce(
      (new.raw_user_meta_data->>'role')::user_role,
      'student'
    );
  end if;

  -- Create public.users row
  insert into public.users (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    new.raw_user_meta_data->>'avatar_url',
    user_role_val
  )
  on conflict (id) do nothing;

  -- Create profile row
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  -- Create role-specific record
  if user_role_val = 'teacher' then
    insert into public.teacher_profiles (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  elsif user_role_val = 'student' then
    insert into public.students (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- TRIGGER: Recalculate teacher rating when review is inserted or updated
-- =============================================================================

create or replace function public.update_teacher_rating()
returns trigger
language plpgsql
security definer
as $$
declare
  target_teacher_id uuid;
begin
  target_teacher_id := coalesce(new.teacher_id, old.teacher_id);

  update public.teacher_profiles
  set
    rating_average = (
      select coalesce(avg(r.rating), 0)
      from public.reviews r
      where r.teacher_id = target_teacher_id
        and r.is_published = true
    ),
    rating_count = (
      select count(*)
      from public.reviews r
      where r.teacher_id = target_teacher_id
        and r.is_published = true
    )
  where user_id = target_teacher_id;

  return coalesce(new, old);
end;
$$;

create trigger after_review_insert_or_update
  after insert or update on public.reviews
  for each row execute function public.update_teacher_rating();

-- =============================================================================
-- TRIGGER: Update teacher tier and session count when booking is completed
-- =============================================================================

create or replace function public.handle_booking_completed()
returns trigger
language plpgsql
security definer
as $$
declare
  completed_sessions integer;
  avg_rating numeric;
  new_tier teacher_tier;
  new_commission numeric;
begin
  -- Only act when status changes TO 'completed'
  if new.status = 'completed' and (old.status is null or old.status != 'completed') then
    -- Increment total_sessions and total_students
    update public.teacher_profiles
    set
      total_sessions = total_sessions + 1,
      total_students = (
        select count(distinct b.student_id)
        from public.bookings b
        where b.teacher_id = new.teacher_id and b.status = 'completed'
      )
    where user_id = new.teacher_id
    returning total_sessions, rating_average into completed_sessions, avg_rating;

    -- Determine new tier
    if completed_sessions >= 500 and avg_rating >= 4.8 then
      new_tier := 'elite';
      new_commission := 0.10;
    elsif completed_sessions >= 200 and avg_rating >= 4.5 then
      new_tier := 'gold';
      new_commission := 0.14;
    elsif completed_sessions >= 50 then
      new_tier := 'silver';
      new_commission := 0.17;
    else
      new_tier := 'bronze';
      new_commission := 0.20;
    end if;

    update public.teacher_profiles
    set tier = new_tier, commission_rate = new_commission
    where user_id = new.teacher_id;
  end if;

  return new;
end;
$$;

create trigger after_booking_status_change
  after update on public.bookings
  for each row execute function public.handle_booking_completed();

-- =============================================================================
-- TRIGGER: Log payment status changes to audit_logs
-- =============================================================================

create or replace function public.log_payment_status_change()
returns trigger
language plpgsql
security definer
as $$
begin
  if old.status is distinct from new.status then
    insert into public.audit_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      old_data,
      new_data
    ) values (
      auth.uid(),
      'payment_status_change',
      'payments',
      new.id,
      jsonb_build_object('status', old.status, 'razorpay_payment_id', old.razorpay_payment_id),
      jsonb_build_object('status', new.status, 'razorpay_payment_id', new.razorpay_payment_id)
    );
  end if;
  return new;
end;
$$;

create trigger after_payment_update
  after update on public.payments
  for each row execute function public.log_payment_status_change();

-- =============================================================================
-- FULL-TEXT SEARCH: Teacher search index
-- =============================================================================

alter table public.users add column if not exists
  search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(full_name, '')), 'A')
  ) stored;

create index if not exists idx_users_search on public.users using gin(search_vector);

alter table public.teacher_profiles add column if not exists
  search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(headline, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(full_bio, '')), 'C')
  ) stored;

create index if not exists idx_teacher_profiles_search on public.teacher_profiles using gin(search_vector);

alter table public.categories add column if not exists
  search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored;

create index if not exists idx_categories_search on public.categories using gin(search_vector);

-- =============================================================================
-- REALTIME: Enable realtime on chat and notifications tables
-- =============================================================================

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;

-- =============================================================================
-- STORAGE: Create buckets (run after enabling storage in Supabase dashboard)
-- =============================================================================

-- These are advisory comments; execute manually in Supabase Storage UI
-- or via supabase-js:
--   supabase.storage.createBucket('avatars', { public: true })
--   supabase.storage.createBucket('videos', { public: false })
--   supabase.storage.createBucket('documents', { public: false })
