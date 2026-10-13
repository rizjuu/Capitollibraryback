const express = require("express");
const { supabase } = require("../db/supabase");
const { formatTransaction, formatAnnouncement } = require("../utils/formatters");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// GET /api/dashboard/stats - Returns live metrics from Supabase (staff/admin only)
router.get("/stats", protect, authorize("admin", "staff"), async (req, res) => {
  try {
    const nowIso = new Date().toISOString();

    const [
      totalBooksRes,
      availableBooksRes,
      borrowedBooksRes,
      overdueBooksRes,
      totalUsersRes,
      totalPatronsRes,
      totalStaffRes,
      recentTxRes,
      announcementsRes
    ] = await Promise.all([
      supabase.from("books").select("id", { count: "exact", head: true }).eq("archived", false),
      supabase.from("books").select("id", { count: "exact", head: true }).eq("archived", false).eq("available", true),
      supabase.from("books").select("id", { count: "exact", head: true }).eq("archived", false).eq("available", false),
      supabase.from("transactions").select("id", { count: "exact", head: true }).eq("returned", false).lt("due_date", nowIso),
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "patron"),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "staff"),
      supabase.from("transactions").select("*, book:books(*)").order("created_at", { ascending: false }).limit(10),
      supabase.from("announcements").select("*").eq("active", true).order("created_at", { ascending: false })
    ]);

    res.json({
      totalBooks: totalBooksRes.count || 0,
      availableBooks: availableBooksRes.count || 0,
      borrowedBooks: borrowedBooksRes.count || 0,
      overdueBooks: overdueBooksRes.count || 0,
      totalUsers: totalUsersRes.count || 0,
      totalPatrons: totalPatronsRes.count || 0,
      totalStaff: totalStaffRes.count || 0,
      recentTransactions: (recentTxRes.data || []).map((t) => formatTransaction(t, t.book)),
      announcements: (announcementsRes.data || []).map(formatAnnouncement)
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats", error: error.message });
  }
});

module.exports = router;
