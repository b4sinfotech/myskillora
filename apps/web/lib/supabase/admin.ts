import { createClient } from "@supabase/supabase-js";
import type { Database } from "@myskillora/types/database";

/**
 * Admin client with service role key — bypasses RLS.
 * Only use in API routes or server-side code. NEVER expose to the browser.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
