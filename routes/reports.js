const express = require("express");
const { supabase } = require("../db/supabase");
const { formatTransaction, formatBook, formatUser } = require("../utils/formatters");
const { protect, authorize } = require("../middleware/auth");
const { sendOverdueReminderEmail } = require("../utils/email");

const router = express.Router();

// All report routes require staff/admin access
router.use(protect, authorize("admin", "staff"));

// ==========================================
// GET /api/reports/circulation - Full circulation report data
// ==========================================
router.get("/circulation", async (req, res) => {
  try {
    const { data: rawTransactions, error } = await supabase
      .from("transactions")
      .select("*, book:books(*)")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const transactions = (rawTransactions || []).map((t) => formatTransaction(t, t.book));
    const now = new Date();

    const summary = {
      totalTransactions: transactions.length,
      activeLoans: transactions.filter((t) => !t.returned).length,
      returnedLoans: transactions.filter((t) => t.returned).length,
      overdueLoans: transactions.filter((t) => !t.returned && new Date(t.dueDate) < now).length
    };

    res.json({ summary, transactions });
  } catch (error) {
    console.error("Circulation report error:", error);
    res.status(500).json({ message: "Failed to generate circulation report" });
  }
});

// ==========================================
// GET /api/reports/overdue - List of overdue loans
// ==========================================
router.get("/overdue", async (req, res) => {
  try {
    const nowIso = new Date().toISOString();
    const { data: overdueLoans, error } = await supabase
      .from("transactions")
      .select("*, book:books(*)")
      .eq("returned", false)
      .lt("due_date", nowIso)
      .order("due_date", { ascending: true });

    if (error) {
      throw error;
    }

    res.json((overdueLoans || []).map((t) => formatTransaction(t, t.book)));
  } catch (error) {
    console.error("Overdue report error:", error);
    res.status(500).json({ message: "Failed to generate overdue report" });
  }
});

// ==========================================
// GET /api/reports/fines - Book Fine & Overdue Penalty Monitor (₱5.00/day)
// ==========================================
router.get("/fines", async (req, res) => {
  try {
    const DAILY_FINE_RATE = 5.0; // ₱5.00 per calendar day policy
    const now = new Date();
    const nowIso = now.toISOString();

    const { data: rawOverdue, error } = await supabase
      .from("transactions")
      .select("*, book:books(*), borrower:users(*)")
      .eq("returned", false)
      .lt("due_date", nowIso)
      .order("due_date", { ascending: true });

    if (error) {
      throw error;
    }

    let totalAccumulatedFines = 0;
    const uniquePatronsSet = new Set();
    let maxDaysOverdue = 0;

    const overdueWithFines = (rawOverdue || []).map((t) => {
      const dueDate = new Date(t.due_date);
      const diffMs = now.getTime() - dueDate.getTime();
      // Difference in days, rounded up to count full calendar days overdue
      const daysOverdue = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const fineAmount = daysOverdue * DAILY_FINE_RATE;

      totalAccumulatedFines += fineAmount;
      if (t.borrower_id || t.borrower_name) {
        uniquePatronsSet.add(t.borrower_id || t.borrower_name);
      }
      if (daysOverdue > maxDaysOverdue) {
        maxDaysOverdue = daysOverdue;
      }

      const formatted = formatTransaction(t, t.book);
      if (t.borrower) {
        formatted.borrower = formatUser(t.borrower);
      }
      formatted.borrowerPhone = t.borrower_phone || (t.borrower ? t.borrower.phone : "");
      formatted.daysOverdue = daysOverdue;
      formatted.dailyRate = DAILY_FINE_RATE;
      formatted.fineAmount = fineAmount;
      return formatted;
    });

    res.json({
      policy: {
        dailyRate: DAILY_FINE_RATE,
        currency: "PHP",
        symbol: "₱",
        description: "₱5.00 per calendar day overdue"
      },
      summary: {
        totalOverdueCount: overdueWithFines.length,
        totalAccumulatedFines,
        uniquePatronsWithFines: uniquePatronsSet.size,
        maxDaysOverdue
      },
      records: overdueWithFines
    });
  } catch (error) {
    console.error("Fines report error:", error);
    res.status(500).json({ message: "Failed to generate fines report", error: error.message });
  }
});

// ==========================================
// GET /api/reports/inventory - Inventory grouped by category & section
// ==========================================
router.get("/inventory", async (req, res) => {
  try {
    const { data: rawBooks, error } = await supabase
      .from("books")
      .select("*")
      .eq("archived", false);

    if (error) {
      throw error;
    }

    const books = (rawBooks || []).map(formatBook);
    const byCategory = {};
    const bySection = {};

    books.forEach((book) => {
      const cat = book.category || "General";
      if (!byCategory[cat]) {
        byCategory[cat] = { category: cat, total: 0, available: 0, borrowed: 0 };
      }
      byCategory[cat].total += 1;
      if (book.available === false) {
        byCategory[cat].borrowed += 1;
      } else {
        byCategory[cat].available += 1;
      }

      const sec = book.section || "Circulation Section";
      if (!bySection[sec]) {
        bySection[sec] = { section: sec, total: 0, available: 0, borrowed: 0 };
      }
      bySection[sec].total += 1;
      if (book.available === false) {
        bySection[sec].borrowed += 1;
      } else {
        bySection[sec].available += 1;
      }
    });

    res.json({
      totalTitles: books.length,
      categories: Object.values(byCategory).sort((a, b) => b.total - a.total),
      sections: Object.values(bySection).sort((a, b) => b.total - a.total),
      officialBenchmark: {
        totalPrintedResources: 9951,
        sections: [
          { name: "Reference Section", titles: 3644, volumes: 3644, floor: "2nd Floor (Theses 3rd Floor)" },
          { name: "Circulation Section", titles: 2900, volumes: 2900, floor: "2nd Floor (Fiction Ground Floor)" },
          { name: "Periodical Section", titles: 1518, volumes: 1518, floor: "Ground Floor" },
          { name: "Filipiniana Section", titles: 1119, volumes: 1119, floor: "2nd Floor" },
          { name: "Special Collection Section", titles: 491, volumes: 491, floor: "2nd Floor" },
          { name: "Reserved Section", titles: 279, volumes: 279, floor: "2nd Floor" }
        ]
      }
    });
  } catch (error) {
    console.error("Inventory report error:", error);
    res.status(500).json({ message: "Failed to generate inventory report" });
  }
});

// ==========================================
// GET /api/reports/provincial-library-details - Official Details from LMS PROVINCIAL LIBRARY DETAILS
// ==========================================
router.get("/provincial-library-details", async (req, res) => {
  res.json({
    institution: {
      country: "Republic of the Philippines",
      province: "PROVINCE OF MISAMIS ORIENTAL",
      office: "OFFICE OF THE PROVINCIAL LIBRARIAN",
      name: "Misamis Oriental Provincial Library",
      legalBasis: "Republic Act No. 7743",
      mandate: "Misamis Oriental Provincial Library provides free and equitable access to library services which meet the changing needs of the community.",
      businessHours: {
        schedule: "8:00 AM - 5:00 PM, Monday - Friday",
        closure: "Closed on Saturday, Sunday & Holiday",
        openTime: "08:00",
        closeTime: "17:00",
        days: "Monday - Friday"
      }
    },
    collection: {
      totalPrintedResources: 9951,
      totalVolumes: 9951,
      breakdown: [
        { section: "Reference Section", titles: 3644, volumes: 3644, floor: "2nd Floor", note: "Includes Theses & Dissertations (3rd Floor)" },
        { section: "Circulation Section", titles: 2900, volumes: 2900, floor: "2nd Floor", note: "Includes Fiction Books (Ground Floor)" },
        { section: "Periodical Section", titles: 1518, volumes: 1518, floor: "Ground Floor", note: "Includes Journals, Magazines, Leaflets, Brochures, Clippings" },
        { section: "Filipiniana Section", titles: 1119, volumes: 1119, floor: "2nd Floor", note: "Houses Philippine history, Rizaliana, grammar, literature" },
        { section: "Special Collection Section", titles: 491, volumes: 491, floor: "2nd Floor", note: "Includes Law Books, GAD Corner, Peace & Order Corner, Children's Corner & Governor's Collection" },
        { section: "Reserved Section", titles: 279, volumes: 279, floor: "2nd Floor", note: "Includes M.R. Books for in-library use" }
      ],
      outdatedPolicy: "The book collection consists largely of donated materials. Due to limited allocated budget for collection development in public libraries, weeding-out activities are not currently conducted. All 9,951 printed library resources remain active in circulation.",
      damagedReport: "Condition assessment is conducted during quarterly or yearly inventory. Approximately 10 to 15 books are found dilapidated or damaged due to age per year."
    },
    operationalBenchmarks: {
      manualProcessingTime: "15–20 minutes per book (ownership stamping, accessioning, cataloging/classification, cards/pockets/due date slips, plastic acetate covering)",
      searchTime: "5–10 minutes at most (books segregated and categorized by section and subject)",
      reportGenerationTime: "15–20 minutes for resource quantity tallies; ~3 days per section for detailed bibliographic entries",
      inventoryAuditTime: "30–40 minutes for total collection count (team of 3–4 staff); 1–2 weeks for physical verification of actual titles and quantities"
    },
    callNumberSpecification: {
      system: "Dewey Decimal Classification (DDC) with Cutter Sanborn notation",
      format: "[Section Code] [DDC Number] [Cutter Number] [Year of Publication]",
      example: "CIR 550 A123b 2020",
      placement: "Located at the Spine of the book"
    },
    libraryServices: [
      {
        category: "Reading Services",
        facilities: [
          "Circulation Section (2nd Floor)",
          "Filipiniana Section (2nd Floor)",
          "Reference Section (2nd Floor)",
          "Reserved Section (2nd Floor)",
          "Fiction & Periodical Section (Ground Floor)",
          "Theses & Dissertation Section (3rd Floor)"
        ]
      },
      {
        category: "Online and Electronic Services",
        facilities: [
          "Tech4Ed Center (Transform & Empower)",
          "eGov Services (DFA Online Passport New & Renewal, NBI Online, PSA Online / NSO, PRC Online Application)",
          "Free Wi-Fi for All (Strictly for Research Purposes; 2-3 pages printing & photocopying with user-provided bond paper)",
          "Online Storytelling"
        ]
      },
      {
        category: "Public Library Services",
        facilities: [
          "Evaluation and assessment among Public Libraries in Misamis Oriental with National Library of the Philippines"
        ]
      },
      {
        category: "Other Programs and Activities",
        facilities: [
          "World Read Aloud Day (February 4)",
          "67th Public Library Day (March 9)",
          "National Book Week (November 24–30)",
          "National Arts Month (February)",
          "Summer Reading Program (May 26 – Culmination June 20 at Event Hall, SM CDO Downtown Premier)",
          "Mindanao Book Fair - CDO"
        ]
      }
    ],
    personnel: {
      preparedBy: {
        name: "MERALUNA T. PELIGRO, RL",
        title: "Librarian I"
      },
      notedBy: {
        name: "RICHEL I. PAJARA, RL, MLIS",
        title: "Provincial Librarian"
      }
    }
  });
});

// ==========================================
// POST /api/reports/send-overdue-reminders - Email all overdue patrons
// ==========================================
router.post("/send-overdue-reminders", async (req, res) => {
  try {
    const nowIso = new Date().toISOString();
    const { data: rawOverdue, error } = await supabase
      .from("transactions")
      .select("*, book:books(*)")
      .eq("returned", false)
      .lt("due_date", nowIso)
      .order("due_date", { ascending: true });

    if (error) {
      throw error;
    }

    const overdueLoans = (rawOverdue || []).map((t) => formatTransaction(t, t.book));

    // Group overdue loans by borrower email
    const byBorrower = {};
    overdueLoans.forEach((loan) => {
      const email = (loan.borrowerEmail || "").trim().toLowerCase();
      if (!email || !email.includes("@")) return;
      if (!byBorrower[email]) {
        byBorrower[email] = { name: loan.borrowerName, loans: [] };
      }
      byBorrower[email].loans.push(loan);
    });

    const results = { sent: 0, skipped: 0, failed: 0, details: [] };

    for (const [email, data] of Object.entries(byBorrower)) {
      const result = await sendOverdueReminderEmail(email, data.name, data.loans);
      if (result.success) {
        results.sent += 1;
      } else if (result.reason === "NO_SMTP") {
        results.skipped += 1;
        break; // No SMTP configured; don't attempt the rest
      } else {
        results.failed += 1;
      }
      results.details.push({ email, status: result.success ? "sent" : result.reason || "failed" });
    }

    res.json({
      message: `Overdue reminders processed. Sent: ${results.sent}, Failed: ${results.failed}, Skipped: ${results.skipped}`,
      overdueCount: overdueLoans.length,
      ...results
    });
  } catch (error) {
    console.error("Send overdue reminders error:", error);
    res.status(500).json({ message: "Failed to send overdue reminders" });
  }
});

module.exports = router;