import { supabase } from "./src/config/supabase.js";

async function testConnection() {
  console.log("--------------------------------------------------");
  console.log("🔍 Testing Supabase Connection...");
  console.log("--------------------------------------------------");

  if (!supabase) {
    console.log("❌ Supabase client is NOT initialized.");
    console.log("👉 Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) into backend/.env");
    return;
  }

  try {
    const { data, error } = await supabase.from("inquiries").select("id").limit(1);

    if (error) {
      console.log("⚠️ Connected to Supabase, but table 'inquiries' was not found or access denied:");
      console.log("Error details:", error.message);
      console.log("👉 Make sure you ran the SQL script in backend/supabase_schema.sql in your Supabase SQL Editor!");
    } else {
      console.log("✅ SUCCESS! Connected to Supabase and 'inquiries' table is ready!");
      console.log(`Current inquiries count query executed successfully.`);
    }
  } catch (err) {
    console.log("❌ Connection error:", err.message);
  }
}

testConnection();
