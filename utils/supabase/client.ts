import { createBrowserClient } from "@supabase/ssr";

import { supabaseKey, supabaseUrl } from "@/utils/supabase/config";

export const createClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY.",
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
};