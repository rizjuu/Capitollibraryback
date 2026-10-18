const express = require("express");
const { supabase } = require("../db/supabase");
const { formatTransaction, formatBook } = require("../utils/formatters");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// All transaction routes require authentication
router.use(protect);

// GET all transactions populated with Book info (staff/admin only)
router.get("/", authorize("admin", "staff"), async (req, res) => {
  try {
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*, book:books(*)")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.json((transactions || []).map((t) => formatTransaction(t, t.book)));
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

// ==========================================
// PATRON: My currently borrowed books
// ==========================================
router.get("/my-loans", async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = (req.user.email || "").trim().toLowerCase();

    let query = supabase
      .from("transactions")
      .select("*, book:books(*)")
      .eq("returned", false);

    if (userEmail) {
      query = query.or(`borrower_id.eq.${userId},borrower_email.ilike.${userEmail}`);
    } else {
      query = query.eq("borrower_id", userId);
    }

    const { data: loans, error } = await query.order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.json((loans || []).map((l) => formatTransaction(l, l.book)));
  } catch (error) {
    console.error("Error fetching my loans:", error);
    res.status(500).json({ message: "Failed to fetch your loans" });
  }
});

// ==========================================
// PATRON: My full borrowing history
// ==========================================
router.get("/my-history", async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = (req.user.email || "").trim().toLowerCase();

    let query = supabase
      .from("transactions")
      .select("*, book:books(*)");

    if (userEmail) {
      query = query.or(`borrower_id.eq.${userId},borrower_email.ilike.${userEmail}`);
    } else {
      query = query.eq("borrower_id", userId);
    }

    const { data: history, error } = await query.order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.json((history || []).map((h) => formatTransaction(h, h.book)));
  } catch (error) {
    console.error("Error fetching my history:", error);
    res.status(500).json({ message: "Failed to fetch your borrowing history" });
  }
});

// ==========================================
// PATRON: My stats (active loans, returned count, next due date)
// ==========================================
router.get("/my-stats", async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = (req.user.email || "").trim().toLowerCase();

    let activeFilter = `borrower_id.eq.${userId}`;
    if (userEmail) {
      activeFilter = `borrower_id.eq.${userId},borrower_email.ilike.${userEmail}`;
    }

    const [activeRes, returnedRes, nextDueRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .or(activeFilter)
        .eq("returned", false),
      supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .or(activeFilter)
        .eq("returned", true),
      supabase
        .from("transactions")
        .select("due_date")
        .or(activeFilter)
        .eq("returned", false)
        .order("due_date", { ascending: true })
        .limit(1)
        .maybeSingle()
    ]);

    res.json({
      activeLoans: activeRes.count || 0,
      returnedCount: returnedRes.count || 0,
      nextDueDate: nextDueRes.data ? nextDueRes.data.due_date : null
    });
  } catch (error) {
    console.error("Error fetching my stats:", error);
    res.status(500).json({ message: "Failed to fetch your stats" });
  }
});

// POST borrow a book (staff/admin only)
router.post("/borrow", authorize("admin", "staff"), async (req, res) => {
  try {
    const { barcode, borrowerName, borrowerEmail, borrowerId, dueDate } = req.body;

    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("*")
      .eq("barcode", barcode)
      .eq("archived", false)
      .maybeSingle();

    if (bookError || !book) {
      return res.status(404).json({ message: "Book not found with provided barcode" });
    }

    if (book.available === false) {
      return res.status(400).json({ message: `Book "${book.title}" is currently unavailable/borrowed` });
    }

    // Validate due date if provided
    let calculatedDueDate = new Date(Date.now() + 7 * 86400000);
    if (dueDate) {
      const parsed = new Date(dueDate);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ message: "Invalid due date format" });
      }
      if (parsed.getTime() < Date.now() - 86400000) {
        return res.status(400).json({ message: "Due date cannot be in the past" });
      }
      calculatedDueDate = parsed;
    }

    // Resolve borrower from users table to link account and retrieve phone
    let resolvedBorrowerId = borrowerId || null;
    let borrowerPhone = req.body.borrowerPhone || "";
    let borrowerUser = null;

    if (resolvedBorrowerId) {
      const { data: u } = await supabase
        .from("users")
        .select("id, name, phone, email")
        .eq("id", resolvedBorrowerId)
        .maybeSingle();
      if (u) borrowerUser = u;
    } else if (borrowerEmail) {
      const cleanBorrowerEmail = borrowerEmail.trim().toLowerCase();
      const { data: u } = await supabase
        .from("users")
        .select("id, name, phone, email")
        .eq("email", cleanBorrowerEmail)
        .maybeSingle();
      if (u) borrowerUser = u;
    } else if (borrowerName) {
      const { data: u } = await supabase
        .from("users")
        .select("id, name, phone, email")
        .ilike("name", borrowerName.trim())
        .maybeSingle();
      if (u) borrowerUser = u;
    }

    if (borrowerUser) {
      resolvedBorrowerId = borrowerUser.id;
      if (!borrowerPhone && borrowerUser.phone) {
        borrowerPhone = borrowerUser.phone;
      }
    }

    // Insert transaction
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        book_id: book.id,
        borrower_id: resolvedBorrowerId,
        borrower_name: borrowerName || (borrowerUser && borrowerUser.name) || "Library Patron",
        borrower_email: borrowerEmail
          ? borrowerEmail.trim().toLowerCase()
          : (borrowerUser && borrowerUser.email) || "",
        due_date: calculatedDueDate.toISOString(),
        returned: false,
        type: "Borrow"
      })
      .select("*, book:books(*)")
      .single();

    if (txError) {
      throw txError;
    }

    // Update book status
    await supabase
      .from("books")
      .update({
        available: false,
        status: "borrowed",
        updated_at: new Date().toISOString()
      })
      .eq("id", book.id);

    // Send instant SMS checkout notification if patron has a mobile number
    if (borrowerPhone) {
      try {
        const { sendSms } = require("../utils/sms");
        const formattedDate = calculatedDueDate.toLocaleDateString("en-US", {
          timeZone: "Asia/Manila",
          month: "short",
          day: "numeric",
          year: "numeric"
        });
        const cleanName = borrowerName || (borrowerUser && borrowerUser.name) || "Patron";
        sendSms({
          number: borrowerPhone,
          message: `MOPL Notice: Hello ${cleanName}, you have borrowed "${book.title}". Due date: ${formattedDate}. Return during library hours (8AM-5PM, M-F). Misamis Oriental Capitol Public Library.`
        }).catch((e) => console.warn("Instant checkout SMS notice:", e.message));
      } catch (smsErr) {
        // Non-blocking
      }
    }

    res.status(201).json(formatTransaction(transaction, transaction.book || book));
  } catch (error) {
    console.error("Borrow transaction error:", error);
    res.status(500).json({ message: "Borrow transaction failed", error: error.message });
  }
});

// POST return a book (staff/admin only)
router.post("/return", authorize("admin", "staff"), async (req, res) => {
  try {
    const { barcode } = req.body;

    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("*")
      .eq("barcode", barcode)
      .maybeSingle();

    if (bookError || !book) {
      return res.status(404).json({ message: "Book not found with provided barcode" });
    }

    // Verify there is an active loan for this book before returning
    const { data: activeLoan, error: loanError } = await supabase
      .from("transactions")
      .select("*")
      .eq("book_id", book.id)
      .eq("returned", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (loanError || !activeLoan) {
      return res.status(400).json({ message: `Book "${book.title}" has no active loan record to return` });
    }

    // Mark book available
    await supabase
      .from("books")
      .update({
        available: true,
        status: "available",
        updated_at: new Date().toISOString()
      })
      .eq("id", book.id);

    // Update transaction
    const { data: updatedTx, error: txUpdateError } = await supabase
      .from("transactions")
      .update({
        returned: true,
        return_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", activeLoan.id)
      .select("*, book:books(*)")
      .single();

    if (txUpdateError) {
      throw txUpdateError;
    }

    res.json({
      message: `Book "${book.title}" returned successfully`,
      transaction: formatTransaction(updatedTx, updatedTx.book || book)
    });
  } catch (error) {
    console.error("Return transaction error:", error);
    res.status(500).json({ message: "Return transaction failed", error: error.message });
  }
});

module.exports = router;