const express = require("express");
const { supabase } = require("../db/supabase");
const { formatTransaction, formatAnnouncement } = require("../utils/formatters");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// GET /api/dashboard/stats - Returns live metrics from Supabase (staff/admin only)
router.get("/stats", protect, authorize("admin", "staff"), async (req, res) => {
  try {
    const now = new Date();
    const nowIso = now.toISOString();

    // Period boundaries (Asia/Manila / local timezone)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalBooksRes,
      availableBooksRes,
      borrowedBooksRes,
      overdueBooksRes,
      totalUsersRes,
      totalPatronsRes,
      totalStaffRes,
      recentTxRes,
      announcementsRes,
      // Books added per period
      booksTodayRes,
      booksWeekRes,
      booksMonthRes,
      booksYearRes,
      // Patrons registered per period
      patronsTodayRes,
      patronsWeekRes,
      patronsMonthRes,
      patronsYearRes,
      // Transactions per period
      txTodayRes,
      txWeekRes,
      txMonthRes,
      txYearRes
    ] = await Promise.all([
      supabase.from("books").select("id", { count: "exact", head: true }).eq("archived", false),
      supabase.from("books").select("id", { count: "exact", head: true }).eq("archived", false).eq("available", true),
      supabase.from("books").select("id", { count: "exact", head: true }).eq("archived", false).eq("available", false),
      supabase.from("transactions").select("id", { count: "exact", head: true }).eq("returned", false).lt("due_date", nowIso),
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "patron"),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "staff"),
      supabase.from("transactions").select("*, book:books(*)").order("created_at", { ascending: false }).limit(10),
      supabase.from("announcements").select("*").eq("active", true).order("created_at", { ascending: false }),
      // Books
      supabase.from("books").select("id", { count: "exact", head: true }).eq("archived", false).gte("created_at", startOfToday.toISOString()),
      supabase.from("books").select("id", { count: "exact", head: true }).eq("archived", false).gte("created_at", startOfWeek.toISOString()),
      supabase.from("books").select("id", { count: "exact", head: true }).eq("archived", false).gte("created_at", startOfMonth.toISOString()),
      supabase.from("books").select("id", { count: "exact", head: true }).eq("archived", false).gte("created_at", startOfYear.toISOString()),
      // Patrons
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "patron").gte("created_at", startOfToday.toISOString()),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "patron").gte("created_at", startOfWeek.toISOString()),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "patron").gte("created_at", startOfMonth.toISOString()),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "patron").gte("created_at", startOfYear.toISOString()),
      // Transactions
      supabase.from("transactions").select("id", { count: "exact", head: true }).gte("created_at", startOfToday.toISOString()),
      supabase.from("transactions").select("id", { count: "exact", head: true }).gte("created_at", startOfWeek.toISOString()),
      supabase.from("transactions").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth.toISOString()),
      supabase.from("transactions").select("id", { count: "exact", head: true }).gte("created_at", startOfYear.toISOString())
    ]);

    const periodStats = {
      today: {
        booksAdded: booksTodayRes.count || 0,
        newPatrons: patronsTodayRes.count || 0,
        circulated: txTodayRes.count || 0,
        overdue: overdueBooksRes.count || 0
      },
      week: {
        booksAdded: booksWeekRes.count || 0,
        newPatrons: patronsWeekRes.count || 0,
        circulated: txWeekRes.count || 0,
        overdue: overdueBooksRes.count || 0
      },
      month: {
        booksAdded: booksMonthRes.count || 0,
        newPatrons: patronsMonthRes.count || 0,
        circulated: txMonthRes.count || 0,
        overdue: overdueBooksRes.count || 0
      },
      year: {
        booksAdded: booksYearRes.count || totalBooksRes.count || 0,
        newPatrons: patronsYearRes.count || totalPatronsRes.count || 0,
        circulated: txYearRes.count || (recentTxRes.data || []).length,
        overdue: overdueBooksRes.count || 0
      }
    };

    res.json({
      totalBooks: totalBooksRes.count || 0,
      availableBooks: availableBooksRes.count || 0,
      borrowedBooks: borrowedBooksRes.count || 0,
      overdueBooks: overdueBooksRes.count || 0,
      totalUsers: totalUsersRes.count || 0,
      totalPatrons: totalPatronsRes.count || 0,
      totalStaff: totalStaffRes.count || 0,
      recentTransactions: (recentTxRes.data || []).map((t) => formatTransaction(t, t.book)),
      announcements: (announcementsRes.data || []).map(formatAnnouncement),
      periodStats
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats", error: error.message });
  }
});

// POST /api/dashboard/backup/drive - Admin trigger backup to Google Drive
router.post("/backup/drive", protect, authorize("admin"), async (req, res) => {
  try {
    const { performDriveWebhookBackup } = require("../services/gdriveWebhookBackupService");
    const result = await performDriveWebhookBackup();
    res.json({
      message: "Database backup successfully uploaded to Google Drive!",
      result
    });
  } catch (error) {
    console.error("Google Drive backup error:", error);
    res.status(500).json({
      message: error.message || "Failed to complete Google Drive backup",
      error: error.message
    });
  }
});

module.exports = router;
