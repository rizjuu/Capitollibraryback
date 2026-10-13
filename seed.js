require("dotenv").config();
const { supabase } = require("./db/supabase");

const books = [
  {
    barcode: "LIB-0001",
    title: "Jeoriz Gwapo kaayu",
    author: "Jeoriz Gardones Honculada",
    category: "Classic",
    shelf: "A-01",
    available: true
  },
  {
    barcode: "LIB-0002",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    category: "Fiction",
    shelf: "A-02",
    available: true
  },
  {
    barcode: "LIB-0003",
    title: "1984",
    author: "George Orwell",
    category: "Dystopian",
    shelf: "B-01",
    available: true
  },
  {
    barcode: "LIB-0004",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    category: "Romance",
    shelf: "B-02",
    available: true
  },
  {
    barcode: "LIB-0005",
    title: "The Hobbit",
    author: "J. R. R. Tolkien",
    category: "Fantasy",
    shelf: "C-01",
    available: true
  }
];

async function seedDatabase() {
  try {
    console.log("Connecting to Supabase...");

    for (const b of books) {
      const payload = {
        barcode: b.barcode,
        title: b.title,
        author: b.author,
        category: b.category,
        shelf: b.shelf,
        available: b.available,
        status: b.available ? "available" : "borrowed",
        archived: false,
        updated_at: new Date().toISOString()
      };

      const { data: existing } = await supabase
        .from("books")
        .select("id")
        .eq("barcode", b.barcode)
        .maybeSingle();

      if (existing) {
        await supabase.from("books").update(payload).eq("id", existing.id);
        console.log(`Updated: ${b.barcode} - ${b.title}`);
      } else {
        await supabase.from("books").insert(payload);
        console.log(`Inserted: ${b.barcode} - ${b.title}`);
      }
    }

    console.log("🎉 Seed finished successfully in Supabase!");
  } catch (error) {
    console.error("SEED ERROR:", error);
  }
}

seedDatabase();