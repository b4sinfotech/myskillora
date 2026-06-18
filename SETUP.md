# myskillora — Setup Guide

This guide gets myskillora running locally and deployed to production.
No DevOps experience required — follow each section in order.

---

## 1. Prerequisites

Install these tools before starting:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 20 or later | https://nodejs.org |
| pnpm | 9.15.4 | `npm install -g pnpm@9.15.4` |
| Git | Any | https://git-scm.com |
| Supabase CLI | Latest | `npm install -g supabase` |

Verify everything works:
```bash
node --version   # should print v20.x.x or higher
pnpm --version   # should print 9.15.4
git --version
supabase --version
```

---

## 2. Clone the Repository

```bash
git clone https://github.com/b4sinfotech/myskillora.git
cd myskillora
```

---

## 3. Install Dependencies

```bash
pnpm install
```

This installs all packages for every app and package in the monorepo.

---

## 4. Set Up Supabase (Database)

### 4a. Create a Supabase project
1. Go to https://supabase.com and sign in
2. Click "New project"
3. Choose a name (e.g., `myskillora`), set a strong database password, pick a region close to your users
4. Wait ~2 minutes for the project to provision

### 4b. Get your credentials
In the Supabase dashboard → Project Settings → API:
- Copy **Project URL** (looks like `https://xxxx.supabase.co`)
- Copy **anon public** key
- Copy **service_role** key (keep this secret — never expose in frontend code)

### 4c. Run the database migration
In Supabase dashboard → SQL Editor, paste and run the contents of:
```
supabase/migrations/001_initial_schema.sql
```

### 4d. Seed initial data
In SQL Editor, paste and run the contents of:
```
supabase/seed.sql
```

### 4e. Enable Realtime (for chat and notifications)
In Supabase dashboard → Database → Replication:
- Enable replication for `public.messages`
- Enable replication for `public.notifications`

---

## 5. Set Up Razorpay (Payments)

1. Go to https://razorpay.com and create an account
2. Complete KYC verification (required for live payments)
3. Go to Settings → API Keys → Generate Test Key
4. Copy **Key ID** and **Key Secret**
5. Go to Settings → Webhooks → Add Webhook:
   - URL: `https://your-domain.com/api/webhooks/razorpay`
   - Events to select: `payment.captured`, `payment.failed`
   - Copy the **Webhook Secret**

---

## 6. Set Up Cloudinary (Video Hosting)

1. Go to https://cloudinary.com and sign up for a free account
2. In your dashboard, find:
   - **Cloud Name** (shown at top)
   - **API Key**
   - **API Secret**
3. Go to Settings → Upload → Upload presets → Add upload preset:
   - Name: `myskillora_videos`
   - Signing mode: Signed
   - Folder: `myskillora/videos`

---

## 7. Set Up Resend (Email)

1. Go to https://resend.com and create an account
2. Add and verify your sending domain (DNS records provided by Resend)
3. Go to API Keys → Create API Key
4. Set the From address (e.g., `noreply@yourdomain.com`)

---

## 8. Configure Environment Variables

Copy the example file:
```bash
cp .env.example apps/web/.env.local
```

Open `apps/web/.env.local` and fill in every value:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Resend
RESEND_API_KEY=re_xxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=myskillora

# Admin
ADMIN_EMAIL=admin@yourdomain.com
```

---

## 9. Run Locally

```bash
pnpm dev
```

The app will start at http://localhost:3000.

To verify everything is working:
- Open http://localhost:3000 — you should see the landing page
- Click "Get Started" and create a student account
- Create a second account and register as a teacher

---

## 10. Create the First Admin

After signing up with the email you set as `ADMIN_EMAIL`:

1. In Supabase → SQL Editor, run:
```sql
UPDATE public.users
SET role = 'admin'
WHERE email = 'your-admin@email.com';
```

2. Log in with that account — you'll be redirected to `/admin`

---

## 11. Deploy to Vercel

### 11a. Push to GitHub
```bash
git add .
git commit -m "Initial setup"
git push origin main
```

### 11b. Import to Vercel
1. Go to https://vercel.com → New Project
2. Import from GitHub → select `myskillora`
3. Set Root Directory to `apps/web`
4. Add all environment variables from step 8 (use production values, not test keys)
5. Click Deploy

### 11c. Set up Vercel environment variables
In Vercel → Project Settings → Environment Variables, add each variable from `.env.example`.
For production:
- Use live Razorpay keys (not test)
- Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL

### 11d. Configure GitHub Actions secrets
In GitHub → Repository Settings → Secrets and variables → Actions, add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

CI will run automatically on every push to `main`.

---

## Troubleshooting

**`pnpm install` fails**
- Make sure you're using Node.js 20+: `node --version`
- Delete `node_modules` and `pnpm-lock.yaml` and retry

**Supabase connection error**
- Check that `NEXT_PUBLIC_SUPABASE_URL` has no trailing slash
- Verify the anon key matches the project URL

**Payments not working**
- Use test card number `4111 1111 1111 1111`, expiry any future date, CVV any 3 digits
- Check the Razorpay dashboard webhook logs for delivery failures

**Videos not uploading**
- Confirm the Cloudinary upload preset is set to "Signed"
- Check that `CLOUDINARY_API_SECRET` is correct (not the API Key)

**Emails not sending**
- Verify your domain is confirmed in Resend
- Check the `RESEND_FROM_EMAIL` matches a verified sender domain

---

## Project Structure Reference

```
myskillora/
├── apps/web/          → Next.js 14 application
├── packages/types/    → Shared TypeScript types
├── packages/config/   → Shared ESLint, Tailwind, tsconfig
├── packages/utils/    → Pure utility functions
├── supabase/          → Database migrations and seed data
└── .github/           → CI pipeline
```

For questions or issues, open a GitHub issue at https://github.com/b4sinfotech/myskillora/issues
