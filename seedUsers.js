const bcrypt = require("bcryptjs");
require("dotenv").config();
const { supabase } = require("./db/supabase");

async function seedUsers() {
  try {
    console.log("Connecting to Supabase...");

    const adminPassword = await bcrypt.hash("admin123", 10);
    const staffPassword = await bcrypt.hash("staff123", 10);

    // Delete existing admin/staff to prevent duplicates
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .in("role", ["admin", "staff"]);

    if (deleteError) {
      console.warn("Notice during cleanup:", deleteError.message);
    }

    const { data, error: insertError } = await supabase
      .from("users")
      .insert([
        {
          username: "admin",
          password: adminPassword,
          role: "admin",
          name: "System Administrator",
          status: "active"
        },
        {
          username: "staff",
          password: staffPassword,
          role: "staff",
          name: "Library Staff",
          status: "active"
        }
      ])
      .select();

    if (insertError) {
      throw insertError;
    }

    console.log("✅ Admin and Staff accounts created in Supabase!");
    console.log("");
    console.log("ADMIN ACCOUNT:");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("");
    console.log("STAFF ACCOUNT:");
    console.log("Username: staff");
    console.log("Password: staff123");
    console.log("");
  } catch (error) {
    console.error("SEED USERS ERROR:", error);
  }
}

seedUsers();