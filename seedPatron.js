require("dotenv").config();
const { supabase } = require("./db/supabase");

async function seedPatron() {
  try {
    console.log("Connecting to Supabase...");

    await supabase.from("users").delete().eq("email", "patron@example.com");

    const { data, error } = await supabase
      .from("users")
      .insert({
        email: "patron@example.com",
        role: "patron",
        name: "Juan Dela Cruz",
        status: "active"
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log("✅ Patron account created in Supabase!");
    console.log("Email: patron@example.com");
  } catch (error) {
    console.error("SEED PATRON ERROR:", error);
  }
}

seedPatron();