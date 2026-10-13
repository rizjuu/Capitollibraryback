const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ [Supabase Warning]: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / SUPABASE_KEY is missing from environment variables.");
  console.warn("Please configure your Supabase credentials in .env or your deployment environment variables.");
}

const supabase = createClient(
  supabaseUrl || "https://placeholder-project.supabase.co",
  supabaseKey || "placeholder-key",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

module.exports = { supabase };
