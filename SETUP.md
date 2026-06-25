# myskillora — Complete Setup Guide

This guide gets myskillora running locally and deployed to production.
Follow each section in order. Every command is tested against the current codebase.

---

## 1. Prerequisites

### Required tools

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20 or later | https://nodejs.org (use LTS) |
| pnpm | 9.15.4 exactly | `npm install -g pnpm@9.15.4` |
| Git | Any | https://git-scm.com |

Verify before continuing:

```bash
node --version   # must print v20.x.x or higher
pnpm --version   # must print 9.15.4
git --version
```

### Recommended VS Code extensions

| Extension | ID |
|-----------|-----|
| ESLint | `dbaeumer.vscode-eslint` |
| Prettier | `esbenp.prettier-vscode` |
| Tailwind CSS IntelliSense | `bradlc.vscode-tailwindcss` |
| TypeScript Importer | `pmneo.tsimporter` |

---

## 2. Accounts to Create

Sign up for each service before continuing. All have free tiers sufficient for development.

| Service | URL | Used for |
|---------|-----|----------|
| Supabase | https://supabase.com | Database, Auth, Realtime |
| Razorpay | https://razorpay.com | Payments |
| Cloudinary | https://cloudinary.com | Video hosting |
| Resend | https://resend.com | Transactional email |
| Vercel | https://vercel.com | Deployment (production only) |
| GitHub | https://github.com | Version control |

---

## 3. Clone and Install

```bash
git clone https://github.com/b4sinfotech/myskillora.git
cd myskillora
pnpm install
```

---

## 4. Environment Variables

Copy the example file:

```bash
cp .env.example apps/web/.env.local
```

Open `apps/web/.env.local` and fill in every value:

| Variable | Where to Find It | Required For |
|----------|-----------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | Every database query |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public | Browser-side Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role | Server-side admin operations, test data seeder |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay → Settings → API Keys → Key ID | Opening checkout widget |
| `RAZORPAY_KEY_SECRET` | Razorpay → Settings → API Keys → Key Secret | Creating payment orders server-side |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay → Settings → Webhooks → your webhook → secret | Verifying webhook signatures |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary → Dashboard → Cloud Name | Video uploads |
| `CLOUDINARY_API_KEY` | Cloudinary → Dashboard → API Key | Signed upload requests |
| `CLOUDINARY_API_SECRET` | Cloudinary → Dashboard → API Secret | Signed upload requests |
| `RESEND_API_KEY` | Resend → API Keys → Create API Key | Sending emails |
| `RESEND_FROM_EMAIL` | Your verified Resend sender domain | From address on emails |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally; your domain in production | Webhook callbacks, email links |
| `NEXT_PUBLIC_APP_NAME` | `myskillora` | Display name |
| `ADMIN_EMAIL` | Your email address | First admin account recognition |

---

## 5. Supabase Setup

### 5a. Create a Supabase project

1. Go to https://supabase.com and sign in
2. Click **New project**
3. Name it `myskillora`, set a strong database password, pick a region close to your users
4. Wait approximately 2 minutes for provisioning

### 5b. Find your credentials

In the Supabase dashboard → **Project Settings** → **API**:
- Copy **Project URL** — starts with `https://`
- Copy **anon public** key
- Copy **service_role** key (keep this private — never put it in frontend code)

Add these to `apps/web/.env.local`.

### 5c. Run the database migration

1. In Supabase dashboard → **SQL Editor** → **New query**
2. Open `supabase/migrations/001_initial_schema.sql` from this repo
3. Copy the entire contents (1,148 lines) and paste into the SQL Editor
4. Click **Run**
5. Expect: no errors, `Success. No rows returned.`

The migration is idempotent — safe to run again if anything fails.

### 5d. Seed initial category data

1. In SQL Editor → **New query**
2. Open `supabase/seed.sql` from this repo
3. Copy and paste into the editor
4. Click **Run**

This inserts 27 categories across 3 parent types, plus 17 platform configuration settings.

### 5e. Verify tables exist

In Supabase → **Table Editor**, confirm all 17 tables are present:

`users`, `profiles`, `categories`, `teacher_profiles`, `teacher_subjects`, `teacher_fees`, `sample_videos`, `students`, `bookings`, `payments`, `reviews`, `messages`, `notifications`, `teacher_availability`, `payouts`, `platform_settings`, `audit_logs`

### 5f. Enable Realtime

In Supabase → **Database** → **Replication**:
- Enable replication for `public.messages`
- Enable replication for `public.notifications`

This is required for live chat and push notifications.

### 5g. Create the first admin user

After signing up with the email you set as `ADMIN_EMAIL`, run this in SQL Editor:

```sql
UPDATE public.users
SET role = 'admin'
WHERE email = 'your-admin@email.com';
```

Log out and log back in — you will be redirected to `/admin`.

---

## 6. Run Test Data Seed

The seeder creates realistic test accounts and data so you can test every feature without manually creating records.

### 6a. Run the seeder

Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in `apps/web/.env.local`, then:

```bash
pnpm db:seed:test
```

This takes approximately 30–60 seconds.

### 6b. What gets created

**Hardcoded test accounts:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.myskillora.com | TestAdmin@123 |
| Teacher — English | teacher1@test.myskillora.com | TestTeacher@123 |
| Teacher — Maths | teacher2@test.myskillora.com | TestTeacher@123 |
| Teacher — Music | teacher3@test.myskillora.com | TestTeacher@123 |
| Teacher — Martial Arts | teacher4@test.myskillora.com | TestTeacher@123 |
| Teacher — Tamil | teacher5@test.myskillora.com | TestTeacher@123 |
| Student 1 | student1@test.myskillora.com | TestStudent@123 |
| Student 2 | student2@test.myskillora.com | TestStudent@123 |

**Auto-generated data:**
- 10 approved faker teachers (for browse page realism)
- 3 pending faker teachers (for admin approval testing)
- 8 faker students
- 30 bookings (40% completed, 25% confirmed, 20% pending, 15% cancelled)
- 20 reviews on completed bookings only
- 15 message conversations (3 contain phone numbers to test the content filter)
- Payment records for all non-pending bookings

### 6c. Reset and re-seed

To wipe all test data and start fresh:

```bash
pnpm db:reset:test   # deletes all test auth users (cascades to their data)
pnpm db:seed:test    # re-creates everything
```

---

## 7. Razorpay Setup

### 7a. Create account and enable test mode

1. Go to https://razorpay.com and create a business account
2. In the Razorpay dashboard, ensure you are in **Test Mode** (toggle at the top right)

### 7b. Get your API keys

1. Razorpay dashboard → **Settings** → **API Keys**
2. Click **Generate Test Key** (or **Regenerate** if one exists)
3. Copy **Key ID** → set as `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_ID` in `.env.local`
4. Copy **Key Secret** → set as `RAZORPAY_KEY_SECRET`

### 7c. Register the webhook

1. Razorpay dashboard → **Settings** → **Webhooks** → **Add New Webhook**
2. Set URL: `https://your-ngrok-or-local-tunnel.io/api/webhooks/razorpay`
   - For local development, use [ngrok](https://ngrok.com): `ngrok http 3000`
   - For production: `https://yourdomain.com/api/webhooks/razorpay`
3. Select events: `payment.captured` and `payment.failed`
4. Click **Create Webhook** and copy the **Webhook Secret** → set as `RAZORPAY_WEBHOOK_SECRET`

### 7d. Test payment credentials

Use these in the Razorpay checkout widget during local testing:

| Method | Details |
|--------|---------|
| Card | 4111 1111 1111 1111 — any future expiry date — any 3-digit CVV |
| UPI | `success@razorpay` |
| Net Banking | Select any bank → use test credentials shown in the pop-up |

---

## 8. Cloudinary Setup

### 8a. Create account

1. Go to https://cloudinary.com and sign up for a free account
2. In your Cloudinary dashboard, find:
   - **Cloud Name** — shown at the top of the dashboard
   - **API Key**
   - **API Secret**

Add all three to `apps/web/.env.local`.

### 8b. Configure the upload preset for videos

Teacher profile videos use signed uploads via a backend API call.

1. Cloudinary dashboard → **Settings** → **Upload** → **Upload presets**
2. Click **Add upload preset**
3. Set:
   - **Preset name**: `myskillora_videos`
   - **Signing mode**: Signed
   - **Folder**: `myskillora/videos`
   - **Resource type**: Video
4. Click **Save**

The `CLOUDINARY_API_SECRET` is used server-side in `/api/uploads/signed` to generate signatures. It is never exposed to the browser.

---

## 9. Resend Setup

### 9a. Create account and add sending domain

1. Go to https://resend.com and sign up
2. Go to **Domains** → **Add Domain**
3. Enter your domain (e.g. `myskillora.com`)
4. Add the DNS records Resend shows you (takes a few minutes to verify)

For local testing you can use Resend's sandbox: any `@resend.dev` address will be accepted as the sender without domain verification.

### 9b. Get your API key

1. Resend dashboard → **API Keys** → **Create API Key**
2. Copy the key → set as `RESEND_API_KEY`
3. Set `RESEND_FROM_EMAIL` to a verified sender (e.g. `noreply@yourverifieddomain.com`)

### 9c. Test email sending

Booking confirmation emails are sent automatically when a payment is verified. Check your Resend dashboard → **Emails** to confirm delivery after completing a test payment.

---

## 10. Run Locally

```bash
pnpm dev
```

Open http://localhost:3000 in your browser.

**Confirm Supabase is connected:**
- The landing page loads without errors
- Go to `/auth/signup` and create an account — it should write to your Supabase `users` table

**Confirm auth is working:**
- After signup, you should be redirected to `/auth/verify` (email verification prompt)
- In Supabase → Auth → Users, confirm your new user appears

**Confirm test data loaded:**
- Go to `/teachers` — you should see teacher cards with names, ratings, and fees
- This confirms the seeder ran successfully and Supabase is returning data

---

## 11. Manual Testing Checklist

Run through this after setting up. Use the test accounts from Section 6.

### As Student (student1@test.myskillora.com / TestStudent@123)

- [ ] Log in → redirected to `/dashboard/student`
- [ ] Browse `/teachers` → seeded teacher cards visible with name, rating, fee
- [ ] Use subject filter dropdown → results update to matching teachers
- [ ] Click a teacher card → profile page loads with bio, fees, availability
- [ ] Click **Request Booking** → booking modal opens
- [ ] Step 1: select a fee plan → Next button activates
- [ ] Step 2: select a date → only days matching teacher's availability shown (Mon–Sat)
- [ ] Step 2: select a time slot → within teacher's 9am–7pm hours
- [ ] Step 3: click **Proceed to Payment** → Razorpay checkout opens
- [ ] Pay with test card `4111 1111 1111 1111` → any future expiry → any CVV
- [ ] After payment: redirected to `/dashboard/student/bookings` with booking listed
- [ ] Open `/dashboard/student/notifications` → "Booking Confirmed" notification appears
- [ ] Open `/dashboard/student/messages` → conversation list appears
- [ ] Send a message containing a phone number: `Call me at 98765 43210`
- [ ] Message displayed as `[contact info removed]` in the chat
- [ ] Open `/dashboard/student/reviews` → reviews left on completed bookings listed

### As Teacher (teacher1@test.myskillora.com / TestTeacher@123)

- [ ] Log in → redirected to `/dashboard/teacher`
- [ ] Open `/dashboard/teacher/bookings` → bookings from students listed
- [ ] Open `/dashboard/teacher/earnings` → earnings totals and session history
- [ ] Open `/dashboard/teacher/messages` → conversations with students visible
- [ ] Open `/dashboard/teacher/notifications` → booking and payment notifications
- [ ] Open `/dashboard/teacher/onboarding` → 5-step wizard pre-fills existing data
- [ ] Update Step 2 (fees) → save → check `/teachers/[slug]` confirms updated fee

### As Admin (admin@test.myskillora.com / TestAdmin@123)

- [ ] Log in → redirected to `/admin`
- [ ] Dashboard shows platform KPI cards (users, bookings, revenue, reviews)
- [ ] Open `/admin/teachers?status=pending` → 3 pending faker teachers listed
- [ ] Approve one teacher → status changes to approved; teacher appears in `/teachers`
- [ ] Reject another teacher with a reason → logged in audit trail
- [ ] Open `/admin/categories` → all 27 categories listed with parent/child structure
- [ ] Add a new category using the form → appears in list immediately
- [ ] Toggle a category active/inactive → change persists on page refresh
- [ ] Open `/admin/bookings` → all 30 seed bookings listed
- [ ] Open `/admin/payments` → payment records matching bookings
- [ ] Open `/admin/reviews` → 20 seed reviews listed
- [ ] Open `/admin/settings` → platform settings editable (commission rates, etc.)
- [ ] Open `/admin/audit` → audit log entries for approval actions

---

## 12. Deploy to Vercel

### 12a. Push to GitHub

If you forked this repo or made changes:

```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

### 12b. Import to Vercel

1. Go to https://vercel.com → **New Project**
2. Click **Import Git Repository** → select `myskillora`
3. **Root Directory**: set to `apps/web` (critical — do not leave blank)
4. **Framework Preset**: Next.js (auto-detected)
5. Do not click Deploy yet — add environment variables first

### 12c. Add environment variables in Vercel

In **Environment Variables**, add every variable from Section 4 with production values:

- Use **live** Razorpay keys (not test)
- Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL (e.g. `https://myskillora.vercel.app`)
- Set `NEXT_PUBLIC_SUPABASE_URL` and keys to your production Supabase project

Click **Deploy**.

### 12d. Post-deployment configuration

**Add your Vercel URL to Supabase allowed URLs:**
1. Supabase → **Authentication** → **URL Configuration**
2. Add `https://your-vercel-url.vercel.app` to **Site URL**
3. Add `https://your-vercel-url.vercel.app/**` to **Redirect URLs**

**Update Razorpay webhook URL:**
1. Razorpay → **Settings** → **Webhooks** → edit your webhook
2. Change URL to `https://your-vercel-url.vercel.app/api/webhooks/razorpay`

**Test the production URL:**
- Open your Vercel URL → landing page loads
- Sign up with a new account → auth flow works
- Complete a test payment → webhook fires → booking confirmed

---

## 13. Go Live Checklist

Complete every item before accepting real payments.

- [ ] Switch Razorpay from test mode to live mode in the Razorpay dashboard
- [ ] Update `NEXT_PUBLIC_RAZORPAY_KEY_ID` to live Key ID in Vercel environment variables
- [ ] Update `RAZORPAY_KEY_SECRET` to live Key Secret
- [ ] Update `RAZORPAY_WEBHOOK_SECRET` to the live webhook's secret
- [ ] Verify Cloudinary upload preset is set to **Signed** (not Unsigned)
- [ ] Verify Resend domain is verified for production (no `@resend.dev` workaround)
- [ ] Create a real admin account using `ADMIN_EMAIL` and run the SQL to set `role = 'admin'`
- [ ] Run `pnpm db:reset:test` to delete all test accounts from production database
- [ ] Enable Supabase → **Auth** → **Email rate limiting** to prevent abuse
- [ ] Enable Supabase → **Database** → **Backups** → daily backups
- [ ] Set `NEXT_PUBLIC_APP_URL` to your final production domain (not Vercel preview URL)
- [ ] Update Supabase allowed URLs and redirect URLs to your production domain

---

## 14. Troubleshooting

### 1. `pnpm install` fails

**Symptom**: Error during install, often about node version or lockfile.  
**Cause**: Wrong Node.js version or pnpm version.  
**Fix**: Run `node --version` — must be 20 or later. Run `pnpm --version` — must be 9.15.4. Install the correct version:
```bash
npm install -g pnpm@9.15.4
```
Then delete `node_modules` and `pnpm-lock.yaml` and retry `pnpm install`.

---

### 2. Supabase connection refused

**Symptom**: The app loads but data doesn't appear. Console shows `Failed to fetch` or `ECONNREFUSED`.  
**Cause**: `NEXT_PUBLIC_SUPABASE_URL` is missing, has a trailing slash, or the anon key is from the wrong project.  
**Fix**:
- Check `apps/web/.env.local` — the URL must have no trailing slash
- Verify the anon key matches the project URL (both from the same Supabase project)
- Restart the dev server after editing `.env.local`

---

### 3. Auth redirect loop

**Symptom**: After login you are immediately redirected back to the login page.  
**Cause**: The middleware is not receiving a valid session cookie, usually because the Supabase URL or anon key is wrong.  
**Fix**: Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. Clear browser cookies for `localhost:3000` and try again.

---

### 4. RLS blocking all queries (empty results everywhere)

**Symptom**: Tables exist but queries return empty arrays or permission errors.  
**Cause**: The migration either was not run, or the RLS policies were not created.  
**Fix**: Re-run the migration in Supabase SQL Editor. It is idempotent — re-running it drops and recreates all policies. Check that the tables have RLS enabled: Supabase → Table Editor → click table → Policies tab should show policies, not "No policies."

---

### 5. Razorpay payment not confirming

**Symptom**: Payment succeeds in the Razorpay test checkout but booking stays in `pending` status.  
**Cause**: The webhook is not reaching `/api/webhooks/razorpay`, or the signature verification is failing.  
**Fix**:
- For local dev: expose port 3000 via `ngrok http 3000` and update the webhook URL in Razorpay to the ngrok URL
- Check `RAZORPAY_WEBHOOK_SECRET` matches the secret in the Razorpay webhook settings exactly
- Check the Razorpay dashboard → Webhooks → your webhook → **Delivery logs** for error details

---

### 6. Video upload failing on Cloudinary

**Symptom**: Clicking "Upload Video" in teacher onboarding gives a network error or 401.  
**Cause**: `CLOUDINARY_API_SECRET` or `CLOUDINARY_API_KEY` is wrong, or the upload preset does not exist.  
**Fix**:
- Verify `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` in `.env.local`
- Confirm the `myskillora_videos` upload preset exists in Cloudinary → Settings → Upload → Upload presets
- The preset must be set to **Signed**, not Unsigned

---

### 7. Email not sending via Resend

**Symptom**: Booking confirmation emails are not arriving.  
**Cause**: `RESEND_API_KEY` is invalid, or `RESEND_FROM_EMAIL` is not a verified sender.  
**Fix**:
- Check `RESEND_API_KEY` starts with `re_`
- In Resend → Domains, verify your domain shows **Verified** status
- `RESEND_FROM_EMAIL` must exactly match a verified sender domain (e.g. `noreply@yourverifieddomain.com`)
- Check Resend → Emails for delivery errors

---

### 8. Middleware infinite redirect

**Symptom**: Any page results in `ERR_TOO_MANY_REDIRECTS`.  
**Cause**: The middleware session refresh is failing, causing the auth guard to always redirect.  
**Fix**:
- Clear all cookies for `localhost:3000` in your browser
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly
- Restart the Next.js dev server

---

### 9. TypeScript errors after schema change

**Symptom**: `pnpm type-check` shows errors about missing properties after you add a column.  
**Cause**: `packages/types/src/database.ts` is out of sync with the actual Supabase schema.  
**Fix**: Manually update `packages/types/src/database.ts` to add the new column to the relevant table's `Row`, `Insert`, and `Update` types. Follow the existing pattern exactly.

---

### 10. Build failing on Vercel

**Symptom**: Vercel deployment fails with a build error.  
**Cause**: Usually missing environment variables or a TypeScript error that wasn't caught locally.  
**Fix**:
- Check Vercel → Deployment → Build Logs for the specific error
- Run `pnpm run build` locally to reproduce — fix locally first, then push
- Confirm all environment variables from Section 4 are added in Vercel → Project Settings → Environment Variables

---

### 11. Chat messages not updating in real time

**Symptom**: Messages appear only after page refresh, not instantly.  
**Cause**: Supabase Realtime is not enabled for the `messages` table, or the channel subscription failed.  
**Fix**:
- In Supabase → Database → Replication, confirm `public.messages` is enabled
- Check browser console for WebSocket errors
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct (Realtime uses the same connection)

---

### 12. Admin panel showing no data

**Symptom**: Admin pages show empty tables even though data exists.  
**Cause**: The logged-in user does not have `role = 'admin'` in the `users` table.  
**Fix**:
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';
```
Log out and log back in. The middleware reads the role on each request.

---

### 13. Seed script failing

**Symptom**: `pnpm db:seed:test` exits with an error.  
**Cause**: `SUPABASE_SERVICE_ROLE_KEY` is missing or incorrect, or the schema migration was not run.  
**Fix**:
- Verify `SUPABASE_SERVICE_ROLE_KEY` is in `apps/web/.env.local` (the service role key, not the anon key)
- Run the schema migration first (Section 5c)
- If users already exist from a previous run, the script handles this gracefully — check the error message

---

### 14. Google OAuth not working locally

**Symptom**: Clicking "Continue with Google" gives an error or redirects incorrectly.  
**Cause**: The Supabase OAuth callback URL is not configured for localhost.  
**Fix**:
1. In Supabase → Authentication → URL Configuration:
   - Add `http://localhost:3000` to **Site URL**
   - Add `http://localhost:3000/**` to **Redirect URLs**
2. In Supabase → Authentication → Providers → Google:
   - Add your Google OAuth Client ID and Client Secret
   - The redirect URL to whitelist in Google Cloud Console is shown in this panel

---

### 15. Environment variables not loading in production

**Symptom**: Features work locally but fail on Vercel (e.g. Razorpay checkout doesn't open, emails don't send).  
**Cause**: Environment variables are not set in Vercel, or they are set for the wrong environment (Preview vs Production).  
**Fix**:
1. Vercel → Project → Settings → Environment Variables
2. Ensure each variable is checked for both **Production** and **Preview** environments
3. After adding or changing variables, trigger a new deployment — existing deployments do not pick up changes
4. `NEXT_PUBLIC_` variables are baked into the client bundle at build time — changing them requires a rebuild

---

## 15. Upgrade Paths

When to upgrade each component and exactly how to do it.

| When to upgrade | Component | Upgrade to | Steps |
|----------------|-----------|------------|-------|
| More than 10,000 teachers or complex faceted filters | Search (Supabase full-text) | Algolia | 1. Create Algolia account. 2. Install `algoliasearch`. 3. Write a Supabase Edge Function that syncs teacher_profiles inserts/updates to Algolia via REST. 4. Replace `/api/search/route.ts` with Algolia client search. |
| Storage costs become significant or CDN speed matters | File storage (Supabase Storage) | AWS S3 + CloudFront | 1. Create S3 bucket with public-read policy. 2. Add CloudFront distribution in front of the bucket. 3. Update `/api/uploads/signed` to generate S3 presigned PUT URLs instead of Cloudinary signatures. |
| API response times regularly exceed 500ms | Caching (none) | Redis via Upstash | 1. Create Upstash Redis account. 2. Install `@upstash/redis`. 3. Wrap expensive Supabase queries in the teacher and category routes with `redis.get` / `redis.set` with a 60s TTL. |
| Video hosting costs spike above acceptable levels | Video (Cloudinary) | Mux | 1. Create Mux account. 2. Install `@mux/mux-node`. 3. Replace `CLOUDINARY_*` env vars with `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET`. 4. Update `OnboardingStep3` to call Mux's direct upload API. 5. Replace video display with Mux Player component. |
| Webhooks need guaranteed delivery with retries | Event queue (direct HTTP calls) | Inngest | 1. Create Inngest account. 2. Install `inngest`. 3. Add `/api/inngest` route. 4. Replace the direct `fetch` calls in webhook handlers with `inngest.send()`. 5. Move business logic (email, notifications) into Inngest event handlers. |
| Database read queries become a bottleneck at 100k+ users | Database (Supabase shared) | Dedicated Postgres | 1. Upgrade Supabase plan to Pro or Enterprise for dedicated compute. 2. Alternatively, provision a dedicated Postgres on Railway or Neon. 3. Update `NEXT_PUBLIC_SUPABASE_URL` — no code changes needed as Supabase abstracts the connection. |

---

## Project Structure Reference

```
myskillora/
├── apps/web/                    → Next.js 14 application (deploy this)
│   ├── app/                     → App Router pages and API routes
│   ├── components/              → React components
│   ├── hooks/                   → Custom React hooks
│   ├── lib/                     → Supabase clients, Razorpay, Resend, utils
│   ├── store/                   → Zustand state stores
│   └── middleware.ts            → Route protection and session refresh
├── packages/types/              → Shared TypeScript types (Database, API, domain)
├── packages/config/             → Shared ESLint, Tailwind, tsconfig
├── packages/utils/              → Pure utility functions (formatCurrency, etc.)
├── supabase/
│   ├── migrations/001_initial_schema.sql  → Full database schema
│   ├── seed.sql                           → Categories and platform settings
│   ├── seed-test-data.ts                  → Test accounts and data
│   └── reset-test-data.ts                 → Wipes test data
├── .env.example                 → Template for environment variables
└── SETUP.md                     → This file
```

For questions or issues, open a GitHub issue at https://github.com/b4sinfotech/myskillora/issues
