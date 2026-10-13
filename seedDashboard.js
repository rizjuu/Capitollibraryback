require("dotenv").config();
const { supabase } = require("./db/supabase");

async function seedDashboardData() {
  try {
    console.log("Connecting to Supabase for Dashboard Seeding...");

    // 1. Seed Announcements
    const { count: announcementCount, error: countErr } = await supabase
      .from("announcements")
      .select("id", { count: "exact", head: true });

    if (countErr) {
      console.warn("Notice checking announcements:", countErr.message);
    }

    if (!announcementCount || announcementCount === 0) {
      await supabase.from("announcements").insert([
        {
          title: "Extended Public Library Operating Hours",
          content: "Starting June 1, the Misamis Oriental Provincial Capitol Public Library will remain open until 8:00 PM on weekdays.",
          priority: "high",
          author: "Head Librarian",
          date: "2026-05-20",
          active: true
        },
        {
          title: "New Filipiniana & Historical Collection",
          content: "120 new titles have been cataloged and added to the Filipiniana shelf section for public research and loaning.",
          priority: "normal",
          author: "Cataloging Dept",
          date: "2026-05-18",
          active: true
        },
        {
          title: "Passwordless Email Login & SMS Alerts Active",
          content: "Library patrons can now log in using passwordless email authentication and receive automated loan due date alerts.",
          priority: "normal",
          author: "IT System Admin",
          date: "2026-05-15",
          active: true
        }
      ]);
      console.log("✅ Announcements seeded successfully into Supabase!");
    } else {
      console.log(`Found ${announcementCount} existing announcements in Supabase.`);
    }

    // 2. Ensure initial sample books exist if table is empty
    const { count: booksCount } = await supabase
      .from("books")
      .select("id", { count: "exact", head: true });

    if (!booksCount || booksCount === 0) {
      const { data: sampleBooks } = await supabase.from("books").insert([
        { barcode: "LIB-0001", title: "To Kill a Mockingbird", author: "Harper Lee", category: "Fiction", shelf: "Shelf A-1", available: true },
        { barcode: "LIB-0002", title: "1984", author: "George Orwell", category: "Classics", shelf: "Shelf B-2", available: false },
        { barcode: "LIB-0003", title: "Introduction to Algorithms", author: "Thomas H. Cormen", category: "Technology", shelf: "Shelf C-3", available: false },
        { barcode: "LIB-0004", title: "Clean Code", author: "Robert C. Martin", category: "Technology", shelf: "Shelf C-4", available: true },
        { barcode: "LIB-0005", title: "Cosmos", author: "Carl Sagan", category: "Science", shelf: "Shelf D-1", available: true }
      ]).select();
      console.log("✅ Sample books seeded successfully!");
    }

    console.log("🎉 Supabase dashboard seeding complete!");
  } catch (error) {
    console.error("Dashboard Seeding Error:", error);
  }
}

seedDashboardData();
