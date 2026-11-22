const bcrypt = require("bcryptjs");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { supabase } = require("../db/supabase");

async function verify() {
  const { data: patrons, error } = await supabase
    .from("users")
    .select("*")
    .eq("role", "patron")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  console.log("Total Patrons in Database:", patrons.length);

  console.log("\n--- Top 5 patrons in User Management (Newest created_at, Genuine accounts) ---");
  patrons.slice(0, 5).forEach((p, idx) => {
    console.log(`${idx + 1}. [${p.username}] ${p.name} | ${p.email} | Created: ${p.created_at}`);
  });

  console.log("\n--- Boundary around transition (Rows 35 to 40) ---");
  patrons.slice(34, 40).forEach((p, idx) => {
    console.log(`${idx + 35}. [${p.username}] ${p.name} | ${p.school || "N/A"} | Created: ${p.created_at}`);
  });

  console.log("\n--- Last 5 patrons in User Management (Oldest created_at in October) ---");
  patrons.slice(-5).forEach((p, idx) => {
    console.log(`${patrons.length - 4 + idx}. [${p.username}] ${p.name} | ${p.school} | Phone: ${p.phone} | Created: ${p.created_at}`);
  });

  const testPatron = patrons.find((p) => p.username === "MISORLIB-2026-038");
  const testPatron2 = patrons.find((p) => p.username === "MISORLIB-2026-101");
  const pass1 = await bcrypt.compare("patron123", testPatron.password);
  const pass2 = await bcrypt.compare("patron123", testPatron2.password);
  console.log("\nPassword verification ('patron123'):");
  console.log("MISORLIB-2026-038:", pass1 ? "VALID ✅" : "FAILED ❌");
  console.log("MISORLIB-2026-101:", pass2 ? "VALID ✅" : "FAILED ❌");

  // Check CDO schools
  const dummyPatrons = patrons.filter((p) => p.created_at.startsWith("2026-10"));
  console.log("\nTotal October dummy patrons:", dummyPatrons.length);
  const schools = [...new Set(dummyPatrons.map((p) => p.school))];
  console.log("Schools used in dummy accounts:");
  schools.forEach((s) => console.log(" - " + s));
}

verify();
