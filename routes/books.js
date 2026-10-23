const express = require("express");
const { supabase } = require("../db/supabase");
const { formatBook } = require("../utils/formatters");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();
const barcodeRoles = authorize("admin", "staff");

const buildBarcodeItems = (startNumber, count) => Array.from({ length: count }, (_, index) => {
  const sequence = String(startNumber + index).padStart(4, "0");
  return {
    accessionNumber: `ACC-CAP-${sequence}`,
    barcode: `LIB-CAP-${sequence}`
  };
});

// Generate sequential accession numbers and barcodes without creating book records
router.post("/barcodes/generate", protect, barcodeRoles, async (req, res) => {
  try {
    const count = Math.min(Math.max(Number(req.body.count) || 1, 1), 100);

    const { data: existingBooks, error } = await supabase
      .from("books")
      .select("accession_number, barcode");

    if (error) {
      throw error;
    }

    const usedAccessions = new Set((existingBooks || []).map((b) => b.accession_number).filter(Boolean));
    const usedBarcodes = new Set((existingBooks || []).map((b) => b.barcode).filter(Boolean));

    let sequence = (existingBooks || []).reduce((highest, book) => {
      const match = String(book.barcode || "").match(/(?:LIB|LIB-CAP)-?(\d+)/i);
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0) + 1;

    const generated = [];

    while (generated.length < count) {
      const item = buildBarcodeItems(sequence, 1)[0];
      sequence += 1;
      if (!usedAccessions.has(item.accessionNumber) && !usedBarcodes.has(item.barcode)) {
        generated.push(item);
        usedAccessions.add(item.accessionNumber);
        usedBarcodes.add(item.barcode);
      }
    }

    res.json({ items: generated });
  } catch (error) {
    console.error("Error generating barcodes:", error);
    res.status(500).json({ message: "Failed to generate barcodes" });
  }
});

// GET all active books sorted by created_at desc
router.get("/", async (req, res) => {
  try {
    const { data: books, error } = await supabase
      .from("books")
      .select("*")
      .eq("archived", false)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.json((books || []).map(formatBook));
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ message: "Failed to fetch books" });
  }
});

// POST add new book (All fields supported) - staff/admin only
router.post("/", protect, authorize("admin", "staff"), async (req, res) => {
  try {
    const {
      isbn,
      barcode,
      accessionNumber,
      title,
      author,
      authors,
      category,
      section,
      publisher,
      publicationYear,
      shelf,
      status,
      dateAdded,
      description,
      coverUrl,
      condition,
      copies,
      borrowable
    } = req.body;

    if (!barcode || !title) {
      return res.status(400).json({ message: "Barcode and Title are required" });
    }

    const cleanBarcode = barcode.trim();
    const { data: existingBarcode } = await supabase
      .from("books")
      .select("id")
      .eq("barcode", cleanBarcode)
      .maybeSingle();

    if (existingBarcode) {
      return res.status(400).json({ message: `Book with barcode "${cleanBarcode}" already exists` });
    }

    const isAvailable = status ? status === "available" : true;
    const authorsArr = Array.isArray(authors) ? authors : author ? [author] : [];

    const newBookPayload = {
      isbn: (isbn || "").trim(),
      barcode: cleanBarcode,
      accession_number: accessionNumber ? accessionNumber.trim() : null,
      title: title.trim(),
      author: (author || "").trim() || "Unknown Author",
      authors: authorsArr,
      category: (category || "").trim() || "General",
      section: (section || "").trim() || "Circulation Section (includes Fiction Books & Children's Corner)",
      publisher: (publisher || "").trim() || "N/A",
      publication_year: publicationYear ? Number(publicationYear) : null,
      shelf: (shelf || "").trim() || "General Shelf",
      status: status || "available",
      available: isAvailable,
      date_added: dateAdded ? new Date(dateAdded).toISOString() : new Date().toISOString(),
      description: description || "",
      cover_url: coverUrl || "",
      condition: condition || "Good",
      copies: copies ? Number(copies) : 1,
      borrowable: borrowable !== undefined ? Boolean(borrowable) : true,
      archived: false
    };

    const { data: createdBook, error } = await supabase
      .from("books")
      .insert(newBookPayload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(formatBook(createdBook));
  } catch (error) {
    console.error("Error creating book:", error);
    res.status(500).json({ message: "Failed to add book", error: error.message });
  }
});

// PUT update an existing book - staff/admin only
router.put("/:id", protect, authorize("admin", "staff"), async (req, res) => {
  try {
    const {
      isbn,
      title,
      author,
      authors,
      category,
      section,
      publisher,
      publicationYear,
      shelf,
      status,
      condition,
      copies,
      borrowable,
      description,
      coverUrl
    } = req.body;

    const { data: book, error: findError } = await supabase
      .from("books")
      .select("*")
      .eq("id", req.params.id)
      .eq("archived", false)
      .maybeSingle();

    if (findError || !book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const updates = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) {
      if (!String(title).trim()) {
        return res.status(400).json({ message: "Title cannot be empty" });
      }
      updates.title = String(title).trim();
    }
    if (isbn !== undefined) updates.isbn = String(isbn).trim();
    if (author !== undefined) updates.author = String(author).trim() || "Unknown Author";
    if (authors !== undefined) updates.authors = Array.isArray(authors) ? authors : [authors];
    if (category !== undefined) updates.category = String(category).trim() || "General";
    if (section !== undefined) updates.section = String(section).trim() || "Circulation Section (includes Fiction Books & Children's Corner)";
    if (publisher !== undefined) updates.publisher = String(publisher).trim() || "N/A";
    if (publicationYear !== undefined) {
      updates.publication_year = publicationYear === null || publicationYear === "" ? null : Number(publicationYear);
    }
    if (shelf !== undefined) updates.shelf = String(shelf).trim() || "General Shelf";
    if (condition !== undefined) updates.condition = String(condition).trim() || "Good";
    if (copies !== undefined) updates.copies = Math.max(1, Number(copies) || 1);
    if (borrowable !== undefined) updates.borrowable = Boolean(borrowable);
    if (description !== undefined) updates.description = String(description);
    if (coverUrl !== undefined) updates.cover_url = String(coverUrl);

    if (status !== undefined) {
      if (!["available", "borrowed", "maintenance", "reserved"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      updates.status = status;
      updates.available = status === "available";
    }

    const { data: updatedBook, error: updateError } = await supabase
      .from("books")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({ message: "Book updated successfully", book: formatBook(updatedBook) });
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).json({ message: "Failed to update book", error: error.message });
  }
});

// POST reserve a book (patron, staff, admin)
router.post("/:id/reserve", protect, async (req, res) => {
  try {
    const { data: book, error: findError } = await supabase
      .from("books")
      .select("*")
      .eq("id", req.params.id)
      .eq("archived", false)
      .maybeSingle();

    if (findError || !book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.status === "borrowed") {
      return res.status(400).json({ message: `Cannot reserve: "${book.title}" is currently borrowed.` });
    }

    if (book.status === "reserved") {
      return res.status(400).json({ message: `"${book.title}" is already reserved.` });
    }

    const { data: updatedBook, error: updateError } = await supabase
      .from("books")
      .update({
        status: "reserved",
        available: false,
        updated_at: new Date().toISOString()
      })
      .eq("id", req.params.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({
      message: `Book "${book.title}" reserved successfully!`,
      book: formatBook(updatedBook)
    });
  } catch (error) {
    console.error("Error reserving book:", error);
    res.status(500).json({ message: "Failed to reserve book", error: error.message });
  }
});

// POST cancel reservation of a book
router.post("/:id/cancel-reserve", protect, async (req, res) => {
  try {
    const { data: book, error: findError } = await supabase
      .from("books")
      .select("*")
      .eq("id", req.params.id)
      .eq("archived", false)
      .maybeSingle();

    if (findError || !book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.status !== "reserved") {
      return res.status(400).json({ message: `"${book.title}" is not currently reserved.` });
    }

    const { data: updatedBook, error: updateError } = await supabase
      .from("books")
      .update({
        status: "available",
        available: true,
        updated_at: new Date().toISOString()
      })
      .eq("id", req.params.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({
      message: `Reservation for "${book.title}" canceled successfully!`,
      book: formatBook(updatedBook)
    });
  } catch (error) {
    console.error("Error canceling reservation:", error);
    res.status(500).json({ message: "Failed to cancel reservation", error: error.message });
  }
});

// GET book by barcode
router.get("/barcode/:barcode", async (req, res) => {
  try {
    const { data: book, error } = await supabase
      .from("books")
      .select("*")
      .eq("barcode", req.params.barcode)
      .eq("archived", false)
      .maybeSingle();

    if (error || !book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json(formatBook(book));
  } catch (error) {
    res.status(500).json({ message: "Error looking up barcode" });
  }
});

// Assign a generated accession number and barcode to an existing book
router.patch("/:id/assign-barcode", protect, barcodeRoles, async (req, res) => {
  try {
    const accessionNumber = String(req.body.accessionNumber || "").trim();
    const barcode = String(req.body.barcode || "").trim();
    if (!accessionNumber || !barcode) {
      return res.status(400).json({ message: "Accession number and barcode are required" });
    }

    const { data: duplicate } = await supabase
      .from("books")
      .select("id")
      .or(`accession_number.eq.${accessionNumber},barcode.eq.${barcode}`)
      .neq("id", req.params.id)
      .maybeSingle();

    if (duplicate) {
      return res.status(409).json({ message: "Accession number or barcode is already assigned" });
    }

    const { data: updated, error } = await supabase
      .from("books")
      .update({
        accession_number: accessionNumber,
        barcode,
        updated_at: new Date().toISOString()
      })
      .eq("id", req.params.id)
      .eq("archived", false)
      .select()
      .maybeSingle();

    if (error || !updated) {
      return res.status(404).json({ message: "Active book not found" });
    }

    res.json({ message: "Barcode assigned successfully", book: formatBook(updated) });
  } catch (error) {
    console.error("Error assigning barcode:", error);
    res.status(500).json({ message: "Failed to assign barcode" });
  }
});

// GET archived books for the admin Weeding page
router.get("/archived", protect, authorize("admin"), async (req, res) => {
  try {
    const { data: books, error } = await supabase
      .from("books")
      .select("*, archived_by_user:users!books_archived_by_fkey(id, name, email)")
      .eq("archived", true)
      .order("archived_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.json((books || []).map(formatBook));
  } catch (error) {
    console.error("Error fetching archived books:", error);
    res.status(500).json({ message: "Failed to fetch archived books" });
  }
});

// Archive/Weed a book without deleting its catalog record (admins only)
router.patch("/:id/archive", protect, authorize("admin"), async (req, res) => {
  try {
    const reason = String(req.body.reason || req.body.weedingReason || "Physical wear / Damaged").trim();

    const { data: book, error } = await supabase
      .from("books")
      .update({
        archived: true,
        archived_at: new Date().toISOString(),
        archived_by: req.user.id,
        weeding_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq("id", req.params.id)
      .eq("archived", false)
      .select()
      .maybeSingle();

    if (error || !book) {
      return res.status(404).json({ message: "Book not found or already weeded" });
    }

    res.json({ message: "Book weeded successfully", book: formatBook(book) });
  } catch (error) {
    console.error("Error weeding book:", error);
    res.status(500).json({ message: "Failed to weed book" });
  }
});

// Restore a weeded book back to the active catalog (admins only)
const restoreHandler = async (req, res) => {
  try {
    const { data: book, error } = await supabase
      .from("books")
      .update({
        archived: false,
        archived_at: null,
        archived_by: null,
        weeding_reason: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", req.params.id)
      .eq("archived", true)
      .select()
      .maybeSingle();

    if (error || !book) {
      return res.status(404).json({ message: "Book not found or not in weeded records" });
    }

    res.json({ message: "Book restored to active catalog successfully", book: formatBook(book) });
  } catch (error) {
    console.error("Error restoring book:", error);
    res.status(500).json({ message: "Failed to restore book" });
  }
};

router.patch("/:id/restore", protect, authorize("admin"), restoreHandler);
router.patch("/:id/unarchive", protect, authorize("admin"), restoreHandler);

module.exports = router;