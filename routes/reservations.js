const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  getReservations,
  getMyReservations,
  getBookReservations,
  createReservation,
  cancelReservation,
  checkAndExpireReservations
} = require("../services/reservationService");

const router = express.Router();

// All reservation endpoints require authentication
router.use(protect);

// GET /api/reservations - Admin & Staff: view all reservations
router.get("/", authorize("admin", "staff"), async (req, res) => {
  try {
    const { status, bookId, patronId } = req.query;
    const filter = {};
    if (status) filter.status = status.includes(",") ? status.split(",") : status;
    if (bookId) filter.bookId = bookId;
    if (patronId) filter.patronId = patronId;

    const list = await getReservations(filter);
    res.json(list);
  } catch (error) {
    console.error("Error fetching reservations:", error);
    res.status(500).json({ message: "Failed to fetch reservations", error: error.message });
  }
});

// GET /api/reservations/my-reservations - Patron: view my reservations & waiting list
router.get("/my-reservations", async (req, res) => {
  try {
    const list = await getMyReservations(req.user.id, req.user.email);
    res.json(list);
  } catch (error) {
    console.error("Error fetching my reservations:", error);
    res.status(500).json({ message: "Failed to fetch your reservations", error: error.message });
  }
});

// GET /api/reservations/stats - Overview stats for Dashboard
router.get("/stats", authorize("admin", "staff"), async (req, res) => {
  try {
    const all = await getReservations();
    const todayStr = new Date(Date.now() + 8 * 3600000).toISOString().split("T")[0];

    const readyList = all.filter((r) => r.status === "ready");
    const waitingList = all.filter((r) => r.status === "waiting");
    const pickupsToday = readyList.filter((r) => r.pickupDate === todayStr);

    res.json({
      totalReady: readyList.length,
      totalWaiting: waitingList.length,
      totalActive: readyList.length + waitingList.length,
      pickupsToday: pickupsToday.length,
      recent: all.slice(0, 10)
    });
  } catch (error) {
    console.error("Error fetching reservation stats:", error);
    res.status(500).json({ message: "Failed to fetch stats", error: error.message });
  }
});

// GET /api/reservations/book/:bookId - Get queue for a specific book
router.get("/book/:bookId", async (req, res) => {
  try {
    const data = await getBookReservations(req.params.bookId);
    res.json(data);
  } catch (error) {
    console.error("Error fetching book queue:", error);
    res.status(500).json({ message: "Failed to fetch book queue", error: error.message });
  }
});

// POST /api/reservations - Reserve a book or join waiting list
router.post("/", async (req, res) => {
  try {
    const { bookId, pickupDate, pickupTime, notes, patronId } = req.body;

    if (!bookId) {
      return res.status(400).json({ message: "Book ID is required" });
    }
    if (!pickupDate) {
      return res.status(400).json({ message: "Please specify when you will get the book (Pickup Date)" });
    }

    // Determine target patron
    let targetPatron = req.user;
    if (["admin", "staff"].includes(req.user.role) && patronId) {
      const { supabase } = require("../db/supabase");
      const { data: pUser } = await supabase.from("users").select("*").eq("id", patronId).maybeSingle();
      if (pUser) targetPatron = pUser;
    }

    const result = await createReservation({
      bookId,
      patron: targetPatron,
      pickupDate,
      pickupTime,
      notes
    });

    const actionText = result.isWaitingList
      ? `Added to waiting list at position #${result.queuePosition}`
      : `Book reserved successfully for pickup on ${pickupDate}!`;

    res.status(201).json({
      message: actionText,
      ...result
    });
  } catch (error) {
    console.error("Error creating reservation:", error);
    res.status(400).json({ message: error.message || "Failed to reserve book" });
  }
});

// POST /api/reservations/:id/cancel - Cancel reservation
router.post("/:id/cancel", async (req, res) => {
  try {
    const result = await cancelReservation(req.params.id, req.user);
    res.json(result);
  } catch (error) {
    console.error("Error cancelling reservation:", error);
    res.status(400).json({ message: error.message || "Failed to cancel reservation" });
  }
});

// POST /api/reservations/check-expired - Manual trigger for expiration check
router.post("/check-expired", authorize("admin", "staff"), async (req, res) => {
  try {
    await checkAndExpireReservations();
    res.json({ message: "Reservation expiration check completed successfully" });
  } catch (error) {
    console.error("Error checking expired reservations:", error);
    res.status(500).json({ message: "Failed to check expired reservations", error: error.message });
  }
});

module.exports = router;
