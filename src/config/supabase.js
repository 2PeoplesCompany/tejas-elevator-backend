import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

export let supabase = null;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes("your-project-id")) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
    console.log("[Database] Connected to Supabase PostgreSQL at", supabaseUrl);
  } catch (error) {
    console.warn("[Database] Failed to initialize Supabase client:", error.message);
    supabase = null;
  }
} else {
  console.log("[Database] Running with in-memory persistence fallback (Configure SUPABASE_SERVICE_ROLE_KEY in backend/.env to connect to live database)");
}
