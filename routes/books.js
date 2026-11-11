const express = require("express");
const fs = require("fs");
const path = require("path");
const { supabase } = require("../db/supabase");
const { formatBook } = require("../utils/formatters");
const { protect, authorize } = require("../middleware/auth");
const { generateCallNumber, resolveSublocation } = require("../utils/callNumber");
const {
  createReservation,
  cancelReservation,
  getReservations,
  getBookReservations
} = require("../services/reservationService");

const router = express.Router();
const barcodeRoles = authorize("admin", "staff");

const TAXONOMY_FILE = path.join(__dirname, "../data/taxonomy.json");

// Helper to ensure data dir exists
const ensureDataDir = () => {
  const dir = path.dirname(TAXONOMY_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// GET saved taxonomy (sections, categories, shelves)
router.get("/taxonomy", async (req, res) => {
  try {
    ensureDataDir();
    if (fs.existsSync(TAXONOMY_FILE)) {
      const raw = fs.readFileSync(TAXONOMY_FILE, "utf-8");
      return res.json(JSON.parse(raw));
    }
    return res.json({ sections: null, shelves: null });
  } catch (error) {
    console.error("Error reading taxonomy file:", error);
    res.status(500).json({ message: "Failed to read taxonomy" });
  }
});

// POST save taxonomy (sections, categories, shelves) - admin / staff
router.post("/taxonomy", protect, barcodeRoles, async (req, res) => {
  try {
    const { sections, shelves } = req.body;
    ensureDataDir();
    fs.writeFileSync(
      TAXONOMY_FILE,
      JSON.stringify({ sections: sections || [], shelves: shelves || [], updatedAt: new Date().toISOString() }, null, 2),
      "utf-8"
    );
    res.json({ message: "Taxonomy saved successfully" });
  } catch (error) {
    console.error("Error saving taxonomy file:", error);
    res.status(500).json({ message: "Failed to save taxonomy", error: error.message });
  }
});

// POST batch update field across books (e.g. when category, shelf, or section is edited/reassigned/deleted)
router.post("/batch-update-field", protect, barcodeRoles, async (req, res) => {
  try {
    const { field, oldValue, newValue } = req.body;
    if (!["category", "shelf", "section"].includes(field)) {
      return res.status(400).json({ message: "Invalid field. Must be category, shelf, or section." });
    }
    if (!oldValue) {
      return res.status(400).json({ message: "oldValue is required" });
    }
    const valToSet = newValue === undefined ? "" : String(newValue).trim();

    const { data, error } = await supabase
      .from("books")
      .update({ [field]: valToSet, updated_at: new Date().toISOString() })
      .eq(field, oldValue)
      .select("id");

    if (error) {
      console.error("Supabase batch update error:", error);
      throw error;
    }

    res.json({
      message: `Updated ${data ? data.length : 0} books`,
      count: data ? data.length : 0
    });
  } catch (error) {
    console.error("Error batch updating books:", error);
    res.status(500).json({ message: "Failed to batch update field", error: error.message });
  }
});

const buildBarcodeItems = (startNumber, count) => Array.from({ length: count }, (_, index) => {
  const num = startNumber + index;
  const sequence = String(num).padStart(3, "0");
  const accSequence = String(num).padStart(4, "0");
  return {
    accessionNumber: `ACC-CAP-${accSequence}`,
    barcode: `Misor-Lib-${sequence}`
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
      const match = String(book.barcode || "").match(/(?:Misor-Lib|LIB|LIB-CAP)-?(\d+)/i);
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

// GET all active books sorted by created_at desc (enriched with reservation details)
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

    // Attach active reservation & waiting list data
    let reservationMap = new Map();
    try {
      const activeRes = await getReservations({ status: ["ready", "waiting"] });
      for (const r of activeRes) {
        const bId = r.bookId || (r.book && r.book.id);
        if (!bId) continue;
        if (!reservationMap.has(bId)) {
          reservationMap.set(bId, { ready: null, waitingList: [] });
        }
        const entry = reservationMap.get(bId);
        if (r.status === "ready" && !entry.ready) {
          entry.ready = r;
        } else if (r.status === "waiting") {
          entry.waitingList.push(r);
        }
      }
    } catch (e) {
      console.warn("Could not enrich books with reservation queue:", e.message);
    }

    const formattedList = (books || []).map((b) => {
      const formatted = formatBook(b);
      const queueData = reservationMap.get(b.id) || null;
      formatted.activeReservation = queueData ? queueData.ready : null;
      formatted.waitingCount = queueData ? queueData.waitingList.length : 0;
      formatted.waitingList = queueData ? queueData.waitingList : [];
      return formatted;
    });

    res.json(formattedList);
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
      callNumber,
      call_number,
      sublocation,
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

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Book Title is required" });
    }

    let cleanBarcode = (barcode || "").trim();
    let cleanAccession = accessionNumber ? accessionNumber.trim() : null;

    if (!cleanBarcode) {
      const { data: existingBooks } = await supabase
        .from("books")
        .select("accession_number, barcode");
      let sequence = (existingBooks || []).reduce((highest, book) => {
        const match = String(book.barcode || "").match(/(?:Misor-Lib|LIB|LIB-CAP)-?(\d+)/i);
        return match ? Math.max(highest, Number(match[1])) : highest;
      }, 0) + 1;
      const pad = String(sequence).padStart(3, "0");
      cleanBarcode = `Misor-Lib-${pad}`;
      if (!cleanAccession) {
        cleanAccession = `ACC-CAP-${String(sequence).padStart(4, "0")}`;
      }
    } else if (!cleanAccession) {
      const match = cleanBarcode.match(/(?:Misor-Lib|LIB|LIB-CAP)-?(\d+)/i);
      if (match) {
        cleanAccession = `ACC-CAP-${match[1].padStart(4, "0")}`;
      }
    }

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
    const cleanSection = (section || "").trim() || "Circulation Section";
    const cleanCategory = (category || "").trim() || "General";
    const cleanCallNumber = (callNumber || call_number || "").trim() || generateCallNumber({
      section: cleanSection,
      category: cleanCategory,
      title: title.trim(),
      author: (author || "").trim(),
      publicationYear: publicationYear ? Number(publicationYear) : null,
      dateAdded: dateAdded
    });
    const cleanSublocation = (sublocation || "").trim() || resolveSublocation(cleanSection, cleanCategory, shelf);

    const newBookPayload = {
      isbn: (isbn || "").trim(),
      barcode: cleanBarcode,
      accession_number: cleanAccession,
      call_number: cleanCallNumber,
      sublocation: cleanSublocation,
      title: title.trim(),
      author: (author || "").trim() || "Unknown Author",
      authors: authorsArr,
      category: cleanCategory,
      section: cleanSection,
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

    let createdBook;
    let { data, error } = await supabase
      .from("books")
      .insert(newBookPayload)
      .select()
      .single();

    if (error && (error.message.includes("call_number") || error.message.includes("sublocation"))) {
      // Graceful fallback if columns are not yet applied via migration
      const fallbackPayload = { ...newBookPayload };
      delete fallbackPayload.call_number;
      delete fallbackPayload.sublocation;
      const retry = await supabase.from("books").insert(fallbackPayload).select().single();
      if (retry.error) throw retry.error;
      createdBook = { ...retry.data, call_number: cleanCallNumber, sublocation: cleanSublocation };
    } else if (error) {
      throw error;
    } else {
      createdBook = data;
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
      callNumber,
      call_number,
      sublocation,
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
    if (callNumber !== undefined || call_number !== undefined) {
      updates.call_number = String(callNumber !== undefined ? callNumber : call_number).trim();
    }
    if (sublocation !== undefined) updates.sublocation = String(sublocation).trim();
    if (category !== undefined) updates.category = String(category).trim() || "General";
    if (section !== undefined) updates.section = String(section).trim() || "Circulation Section";
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

    let updatedBook;
    let { data: upData, error: updateError } = await supabase
      .from("books")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();

    if (updateError && (updateError.message.includes("call_number") || updateError.message.includes("sublocation"))) {
      const fallbackUpdates = { ...updates };
      delete fallbackUpdates.call_number;
      delete fallbackUpdates.sublocation;
      const retry = await supabase.from("books").update(fallbackUpdates).eq("id", req.params.id).select().single();
      if (retry.error) throw retry.error;
      updatedBook = { ...retry.data, call_number: updates.call_number, sublocation: updates.sublocation };
    } else if (updateError) {
      throw updateError;
    } else {
      updatedBook = upData;
    }

    res.json({ message: "Book updated successfully", book: formatBook(updatedBook) });
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).json({ message: "Failed to update book", error: error.message });
  }
});

// POST reserve a book (patron, staff, admin) - handles pickup date and waiting list
router.post("/:id/reserve", protect, async (req, res) => {
  try {
    const bookId = req.params.id;
    let pickupDate = req.body.pickupDate;
    const pickupTime = req.body.pickupTime || "During Library Hours (8AM - 5PM)";
    const notes = req.body.notes || "";

    // If no pickup date provided, default to tomorrow (or today if morning)
    if (!pickupDate) {
      const nowManila = new Date(Date.now() + 8 * 3600000);
      nowManila.setDate(nowManila.getDate() + 1);
      pickupDate = nowManila.toISOString().split("T")[0];
    }

    const result = await createReservation({
      bookId,
      patron: req.user,
      pickupDate,
      pickupTime,
      notes
    });

    res.json({
      message: result.isWaitingList
        ? `Added to waiting list for "${result.book.title}" at position #${result.queuePosition}`
        : `Book "${result.book.title}" reserved successfully for pickup on ${pickupDate}!`,
      book: result.book,
      reservation: result.reservation,
      isWaitingList: result.isWaitingList,
      queuePosition: result.queuePosition
    });
  } catch (error) {
    console.error("Error reserving book:", error);
    res.status(400).json({ message: error.message || "Failed to reserve book" });
  }
});

// POST cancel reservation of a book
router.post("/:id/cancel-reserve", protect, async (req, res) => {
  try {
    const bookId = req.params.id;
    // Find active reservation for this book
    const queue = await getBookReservations(bookId);

    // Look for reservation owned by this user
    let userHold = queue.allActive.find(
      (r) =>
        r.patronId === req.user.id ||
        (req.user.email && (r.patronEmail || "").toLowerCase() === req.user.email.toLowerCase())
    );

    // If staff/admin and no specific patron hold matched, cancel the active ready hold
    if (!userHold && ["admin", "staff"].includes(req.user.role)) {
      userHold = queue.ready;
    }

    if (!userHold) {
      return res.status(400).json({ message: "No active reservation found for you on this book." });
    }

    await cancelReservation(userHold.id, req.user);

    // Fetch updated book
    const { data: updatedBook } = await supabase.from("books").select("*").eq("id", bookId).maybeSingle();

    res.json({
      message: `Reservation canceled successfully!`,
      book: formatBook(updatedBook)
    });
  } catch (error) {
    console.error("Error canceling reservation:", error);
    res.status(400).json({ message: error.message || "Failed to cancel reservation" });
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