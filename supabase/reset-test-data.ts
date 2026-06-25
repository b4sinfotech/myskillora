/**
 * myskillora — Test Data Reset
 *
 * Deletes all test accounts and their data, then re-seeds.
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Run with: pnpm db:reset:test
 */

import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_EMAIL_PATTERNS = [
  "@test.myskillora.com",
  "@test.myskillora.com",
  "faker.teacher.",
  "faker.student.",
];

async function reset() {
  console.log("\n🗑️  Resetting test data...\n");

  // List all auth users and find test accounts
  const { data: allUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const testUsers = allUsers?.users?.filter(u =>
    TEST_EMAIL_PATTERNS.some(p => u.email?.includes(p))
  ) ?? [];

  console.log(`Found ${testUsers.length} test auth users to delete`);

  for (const user of testUsers) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) {
      console.warn(`  ⚠ Could not delete ${user.email}: ${error.message}`);
    } else {
      console.log(`  ✓ Deleted ${user.email}`);
    }
  }

  console.log("\n✅ Reset complete. Run pnpm db:seed:test to re-seed.\n");
}

reset().catch(err => {
  console.error("Reset failed:", err);
  process.exit(1);
});
