const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const { supabase } = require("../db/supabase");
const { formatReservation, formatBook } = require("../utils/formatters");
const { sendSms } = require("../utils/sms");
const { sendEmail } = require("../utils/email");

// Local fallback store path in case Supabase reservations table is not yet migrated
const DATA_DIR = path.join(__dirname, "..", "data");
const FALLBACK_FILE = path.join(DATA_DIR, "reservations.json");

function ensureLocalFallback() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(FALLBACK_FILE)) {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify([]), "utf8");
  }
}

function readFallback() {
  try {
    ensureLocalFallback();
    const data = fs.readFileSync(FALLBACK_FILE, "utf8");
    return JSON.parse(data || "[]");
  } catch (err) {
    console.error("Error reading local reservations fallback:", err);
    return [];
  }
}

function writeFallback(records) {
  try {
    ensureLocalFallback();
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(records, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing local reservations fallback:", err);
  }
}

let isSupabaseTableAvailable = null;

async function checkSupabaseTable() {
  if (isSupabaseTableAvailable !== null) return isSupabaseTableAvailable;
  try {
    const { error } = await supabase.from("reservations").select("id").limit(1);
    if (error && (error.code === "PGRST204" || error.code === "42P01" || error.message?.includes("schema cache") || error.message?.includes("does not exist"))) {
      console.warn("ℹ️  [Reservation Service]: Supabase reservations table not yet created. Using local JSON store fallback.");
      isSupabaseTableAvailable = false;
    } else {
      console.log("✅ [Reservation Service]: Connected to Supabase reservations table.");
      isSupabaseTableAvailable = true;
      // If we previously had local fallback records, try syncing them
      await syncLocalFallbackToSupabase();
    }
  } catch (err) {
    console.warn("ℹ️  [Reservation Service]: Using local fallback storage.");
    isSupabaseTableAvailable = false;
  }
  return isSupabaseTableAvailable;
}

async function syncLocalFallbackToSupabase() {
  try {
    const locals = readFallback();
    if (!locals || locals.length === 0) return;
    for (const r of locals) {
      await supabase.from("reservations").upsert(r);
    }
    console.log(`✅ Synced ${locals.length} local fallback reservations to Supabase.`);
  } catch (err) {
    console.warn("Could not sync local reservations to Supabase:", err.message);
  }
}

/**
 * Calculates pickup deadline based on pickup date and time
 * Default library operating hours close at 5:00 PM (17:00) Asia/Manila (UTC+8)
 */
function calculatePickupDeadline(pickupDateStr) {
  const [year, month, day] = pickupDateStr.split("-").map(Number);
  // Target 5:00 PM Manila time (09:00 UTC)
  const deadline = new Date(Date.UTC(year, month - 1, day, 9, 0, 0));
  // If the computed deadline is already in the past, give 24 hours from now
  if (deadline.getTime() <= Date.now()) {
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  return deadline;
}

/**
 * Get all reservations matching optional filters
 */
async function getReservations(filter = {}) {
  await checkAndExpireReservations();

  const useDb = await checkSupabaseTable();
  if (useDb) {
    let query = supabase
      .from("reservations")
      .select("*, book:books(*), patron:users(*)")
      .order("created_at", { ascending: false });

    if (filter.bookId) query = query.eq("book_id", filter.bookId);
    if (filter.patronId) query = query.eq("patron_id", filter.patronId);
    if (filter.status) {
      if (Array.isArray(filter.status)) {
        query = query.in("status", filter.status);
      } else {
        query = query.eq("status", filter.status);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((r) => formatReservation(r, r.book, r.patron));
  } else {
    // Local fallback
    let list = readFallback();
    if (filter.bookId) list = list.filter((r) => r.book_id === filter.bookId);
    if (filter.patronId) list = list.filter((r) => r.patron_id === filter.patronId);
    if (filter.status) {
      if (Array.isArray(filter.status)) {
        list = list.filter((r) => filter.status.includes(r.status));
      } else {
        list = list.filter((r) => r.status === filter.status);
      }
    }

    // Populate book and patron data from Supabase
    const bookIds = [...new Set(list.map((r) => r.book_id))];
    const patronIds = [...new Set(list.map((r) => r.patron_id))];

    const [booksRes, patronsRes] = await Promise.all([
      bookIds.length ? supabase.from("books").select("*").in("id", bookIds) : { data: [] },
      patronIds.length ? supabase.from("users").select("*").in("id", patronIds) : { data: [] }
    ]);

    const bookMap = new Map((booksRes.data || []).map((b) => [b.id, b]));
    const patronMap = new Map((patronsRes.data || []).map((u) => [u.id, u]));

    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return list.map((r) => formatReservation(r, bookMap.get(r.book_id), patronMap.get(r.patron_id)));
  }
}

/**
 * Get reservations for logged-in patron
 */
async function getMyReservations(patronId, patronEmail) {
  await checkAndExpireReservations();

  const all = await getReservations();
  const cleanEmail = (patronEmail || "").trim().toLowerCase();

  return all.filter((r) => {
    const isIdMatch = r.patronId === patronId || r.patron?.id === patronId;
    const isEmailMatch = cleanEmail && (r.patronEmail || "").trim().toLowerCase() === cleanEmail;
    return isIdMatch || isEmailMatch;
  });
}

/**
 * Get reservations and waiting list for a specific book
 */
async function getBookReservations(bookId) {
  const all = await getReservations({ bookId });
  const active = all.filter((r) => ["ready", "waiting"].includes(r.status));
  active.sort((a, b) => a.queuePosition - b.queuePosition);
  return {
    ready: active.find((r) => r.status === "ready") || null,
    waitingList: active.filter((r) => r.status === "waiting"),
    allActive: active,
    totalCount: active.length
  };
}

/**
 * Create a reservation or join waiting list
 */
async function createReservation({ bookId, patron, pickupDate, pickupTime, notes }) {
  if (!bookId) throw new Error("Book ID is required");
  if (!patron || !patron.id) throw new Error("Patron information is required");
  if (!pickupDate) throw new Error("Expected pickup date is required");

  // Validate pickup date format and bounds
  const targetDate = new Date(pickupDate);
  if (isNaN(targetDate.getTime())) {
    throw new Error("Invalid pickup date format");
  }

  // Ensure pickup date is not before today (in Manila UTC+8)
  const now = new Date();
  const todayStr = new Date(now.getTime() + 8 * 3600000).toISOString().split("T")[0];
  if (pickupDate < todayStr) {
    throw new Error("Pickup date cannot be in the past");
  }

  // Lookup the book
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .eq("archived", false)
    .maybeSingle();

  if (bookError || !book) {
    throw new Error("Book not found in library catalog");
  }

  if (book.borrowable === false) {
    throw new Error(`"${book.title}" is designated for library reference only and cannot be reserved or checked out.`);
  }

  // Run auto-expiry check first to ensure up-to-date queue state
  await checkAndExpireReservations();

  // Check if patron already has an active reservation or is in waiting list for this book
  const existingQueue = await getBookReservations(bookId);
  const alreadyQueued = existingQueue.allActive.some((r) => {
    const isSameId = r.patronId === patron.id || (r.patron && r.patron.id === patron.id);
    const isSameEmail = patron.email && (r.patronEmail || "").trim().toLowerCase() === patron.email.trim().toLowerCase();
    return isSameId || isSameEmail;
  });

  if (alreadyQueued) {
    throw new Error(`You already have an active hold or are currently in the waiting list for "${book.title}".`);
  }

  // Determine whether this reservation is 'ready' (holding the book) or 'waiting' (in line)
  const hasReadyHold = Boolean(existingQueue.ready);
  const isBookCurrentlyBorrowed = book.status === "borrowed" || book.available === false;

  let assignedStatus = "ready";
  let assignedQueuePosition = 1;
  let deadline = null;

  if (hasReadyHold || isBookCurrentlyBorrowed) {
    // There is already a patron holding the book, or book is currently checked out: Patron joins WAITING LIST
    assignedStatus = "waiting";
    // Queue position is after existing active holds
    assignedQueuePosition = existingQueue.allActive.length + 1;
    // Deadline will be activated upon promotion
    deadline = calculatePickupDeadline(pickupDate);
  } else {
    // Book is available: Patron claims immediate active hold
    assignedStatus = "ready";
    assignedQueuePosition = 1;
    deadline = calculatePickupDeadline(pickupDate);
  }

  const reservationRecord = {
    id: require("crypto").randomUUID ? require("crypto").randomUUID() : `res_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    book_id: book.id,
    patron_id: patron.id,
    patron_name: patron.name || "Library Patron",
    patron_email: patron.email || "",
    patron_phone: patron.phone || "",
    pickup_date: pickupDate,
    pickup_time: pickupTime || "During Library Hours (8AM - 5PM)",
    pickup_deadline: deadline.toISOString(),
    queue_position: assignedQueuePosition,
    status: assignedStatus,
    notes: notes || "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const useDb = await checkSupabaseTable();
  if (useDb) {
    const { data: inserted, error: insertError } = await supabase
      .from("reservations")
      .insert(reservationRecord)
      .select("*, book:books(*), patron:users(*)")
      .single();

    if (insertError) throw insertError;
  } else {
    const list = readFallback();
    list.push(reservationRecord);
    writeFallback(list);
  }

  // If status is 'ready', mark the book as reserved
  let updatedBook = book;
  if (assignedStatus === "ready") {
    const { data: ub, error: bUpdateErr } = await supabase
      .from("books")
      .update({
        status: "reserved",
        available: false,
        updated_at: new Date().toISOString()
      })
      .eq("id", book.id)
      .select()
      .single();

    if (!bUpdateErr && ub) {
      updatedBook = ub;
    }
  }

  // Send SMS confirmation notification if mobile number exists
  if (patron.phone) {
    try {
      const formattedPickup = new Date(pickupDate + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });

      let smsText = "";
      if (assignedStatus === "ready") {
        smsText = `MOPL Notice: Hello ${patron.name}, your reservation for "${book.title}" is confirmed! Please pick it up on ${formattedPickup} (${pickupTime || "8AM-5PM"}). Books not claimed by pickup date are auto-transferred to waiting patrons.`;
      } else {
        smsText = `MOPL Notice: Hello ${patron.name}, you are #${assignedQueuePosition} on the waiting list for "${book.title}". You will be notified automatically once the book becomes available for pickup.`;
      }
      sendSms({ number: patron.phone, message: smsText }).catch(() => {});
    } catch (e) {
      // Non-blocking
    }
  }

  return {
    reservation: formatReservation(reservationRecord, updatedBook, patron),
    book: formatBook(updatedBook),
    isWaitingList: assignedStatus === "waiting",
    queuePosition: assignedQueuePosition
  };
}

/**
 * Cancel a reservation and promote next in waiting list or release book
 */
async function cancelReservation(reservationId, user) {
  const useDb = await checkSupabaseTable();
  let target = null;

  if (useDb) {
    const { data, error } = await supabase
      .from("reservations")
      .select("*, book:books(*)")
      .eq("id", reservationId)
      .maybeSingle();

    if (error || !data) throw new Error("Reservation not found");
    target = data;
  } else {
    const list = readFallback();
    target = list.find((r) => r.id === reservationId);
    if (!target) throw new Error("Reservation not found");
  }

  // Authorization check: patrons can only cancel their own reservations
  if (user && user.role === "patron") {
    const isOwner = target.patron_id === user.id || (user.email && (target.patron_email || "").toLowerCase() === user.email.toLowerCase());
    if (!isOwner) {
      throw new Error("You do not have permission to cancel this reservation");
    }
  }

  if (["cancelled", "expired", "fulfilled"].includes(target.status)) {
    throw new Error(`Reservation is already ${target.status}`);
  }

  const previousStatus = target.status;
  const bookId = target.book_id;

  // Update target to cancelled
  const nowStr = new Date().toISOString();
  if (useDb) {
    await supabase
      .from("reservations")
      .update({
        status: "cancelled",
        cancelled_at: nowStr,
        updated_at: nowStr
      })
      .eq("id", reservationId);
  } else {
    const list = readFallback();
    const idx = list.findIndex((r) => r.id === reservationId);
    if (idx !== -1) {
      list[idx].status = "cancelled";
      list[idx].cancelled_at = nowStr;
      list[idx].updated_at = nowStr;
      writeFallback(list);
    }
  }

  // If the cancelled hold was the primary active hold (ready), promote the next waiting patron
  if (previousStatus === "ready") {
    await promoteNextWaitingPatron(bookId);
  } else if (previousStatus === "waiting") {
    // Re-index remaining waiting positions
    await reindexWaitingQueue(bookId);
  }

  return { success: true, message: "Reservation cancelled successfully" };
}

/**
 * Promotes the next waiting patron in line for a book
 * If no waiting patrons exist, marks the book available
 */
async function promoteNextWaitingPatron(bookId) {
  const useDb = await checkSupabaseTable();
  let waitingList = [];

  if (useDb) {
    const { data } = await supabase
      .from("reservations")
      .select("*, book:books(*), patron:users(*)")
      .eq("book_id", bookId)
      .eq("status", "waiting")
      .order("queue_position", { ascending: true })
      .order("created_at", { ascending: true });

    waitingList = data || [];
  } else {
    const list = readFallback();
    waitingList = list
      .filter((r) => r.book_id === bookId && r.status === "waiting")
      .sort((a, b) => a.queue_position - b.queue_position || new Date(a.created_at) - new Date(b.created_at));
  }

  if (waitingList.length > 0) {
    // Promote the next in line
    const nextPatronRes = waitingList[0];
    const now = new Date();
    // Give 48 hours to collect the book
    const newDeadline = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const newPickupDate = newDeadline.toISOString().split("T")[0];
    const nowStr = now.toISOString();

    if (useDb) {
      await supabase
        .from("reservations")
        .update({
          status: "ready",
          queue_position: 1,
          pickup_date: newPickupDate,
          pickup_deadline: newDeadline.toISOString(),
          notified_at: nowStr,
          updated_at: nowStr
        })
        .eq("id", nextPatronRes.id);
    } else {
      const list = readFallback();
      const idx = list.findIndex((r) => r.id === nextPatronRes.id);
      if (idx !== -1) {
        list[idx].status = "ready";
        list[idx].queue_position = 1;
        list[idx].pickup_date = newPickupDate;
        list[idx].pickup_deadline = newDeadline.toISOString();
        list[idx].notified_at = nowStr;
        list[idx].updated_at = nowStr;
        writeFallback(list);
      }
    }

    // Keep book status as reserved
    await supabase
      .from("books")
      .update({
        status: "reserved",
        available: false,
        updated_at: nowStr
      })
      .eq("id", bookId);

    // Reindex any subsequent waiting patrons
    await reindexWaitingQueue(bookId);

    // Send SMS alert to promoted patron
    if (nextPatronRes.patron_phone || (nextPatronRes.patron && nextPatronRes.patron.phone)) {
      try {
        const phone = nextPatronRes.patron_phone || nextPatronRes.patron.phone;
        const name = nextPatronRes.patron_name || "Patron";
        const bookTitle = (nextPatronRes.book && nextPatronRes.book.title) || "your reserved book";
        const deadlineDateStr = newDeadline.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        });

        sendSms({
          number: phone,
          message: `MOPL Notice: Great news ${name}! "${bookTitle}" is now ready for pickup at Capitol Library! Please claim by ${deadlineDateStr} (8AM-5PM). After this date, it transfers to the next patron.`
        }).catch(() => {});
      } catch (e) {}
    }

    return { promoted: true, reservationId: nextPatronRes.id };
  } else {
    // No one is waiting: Restore book to available!
    await supabase
      .from("books")
      .update({
        status: "available",
        available: true,
        updated_at: new Date().toISOString()
      })
      .eq("id", bookId);

    return { promoted: false };
  }
}

/**
 * Re-indexes queue positions for remaining waiting patrons
 */
async function reindexWaitingQueue(bookId) {
  const useDb = await checkSupabaseTable();
  if (useDb) {
    const { data: waiting } = await supabase
      .from("reservations")
      .select("id, queue_position")
      .eq("book_id", bookId)
      .eq("status", "waiting")
      .order("queue_position", { ascending: true })
      .order("created_at", { ascending: true });

    if (waiting && waiting.length > 0) {
      for (let i = 0; i < waiting.length; i++) {
        const expectedPos = i + 2; // Position 1 is reserved for 'ready'
        if (waiting[i].queue_position !== expectedPos) {
          await supabase
            .from("reservations")
            .update({ queue_position: expectedPos, updated_at: new Date().toISOString() })
            .eq("id", waiting[i].id);
        }
      }
    }
  } else {
    const list = readFallback();
    const waiting = list
      .filter((r) => r.book_id === bookId && r.status === "waiting")
      .sort((a, b) => a.queue_position - b.queue_position || new Date(a.created_at) - new Date(b.created_at));

    waiting.forEach((item, idx) => {
      item.queue_position = idx + 2;
      item.updated_at = new Date().toISOString();
    });
    writeFallback(list);
  }
}

/**
 * Called when checkout occurs: marks reservation as fulfilled
 */
async function fulfillReservationForBook(bookId, borrowerId, borrowerEmail) {
  const useDb = await checkSupabaseTable();
  const nowStr = new Date().toISOString();

  if (useDb) {
    let query = supabase
      .from("reservations")
      .select("*")
      .eq("book_id", bookId)
      .eq("status", "ready")
      .limit(1);

    const { data } = await query.maybeSingle();
    if (data) {
      await supabase
        .from("reservations")
        .update({
          status: "fulfilled",
          fulfilled_at: nowStr,
          updated_at: nowStr
        })
        .eq("id", data.id);
    }
  } else {
    const list = readFallback();
    const match = list.find((r) => r.book_id === bookId && r.status === "ready");
    if (match) {
      match.status = "fulfilled";
      match.fulfilled_at = nowStr;
      match.updated_at = nowStr;
      writeFallback(list);
    }
  }
}

/**
 * Called when a book is returned:
 * Checks if there are waiting patrons in the queue.
 * If yes, promotes the first waiting patron to 'ready' and keeps book reserved.
 * If no, returns false so book becomes available.
 */
async function handleBookReturnReservations(bookId) {
  const promo = await promoteNextWaitingPatron(bookId);
  return promo;
}

/**
 * Core Expiration Engine:
 * Scans for reservations where status === 'ready' and pickup_deadline < now.
 * Marks them expired, and automatically promotes the next waiting patron in line
 * or marks the book available!
 */
async function checkAndExpireReservations() {
  try {
    const now = new Date();
    const nowIso = now.toISOString();
    const useDb = await checkSupabaseTable();

    let expiredList = [];

    if (useDb) {
      const { data, error } = await supabase
        .from("reservations")
        .select("*, book:books(*)")
        .eq("status", "ready")
        .lt("pickup_deadline", nowIso);

      if (error) {
        console.warn("Error checking expired reservations in Supabase:", error.message);
        return;
      }
      expiredList = data || [];
    } else {
      const list = readFallback();
      expiredList = list.filter((r) => r.status === "ready" && r.pickup_deadline && new Date(r.pickup_deadline) < now);
    }

    if (expiredList.length === 0) return;

    console.log(`⏰ [Reservation Service]: Found ${expiredList.length} expired reservation(s) past pickup time.`);

    for (const exp of expiredList) {
      // Mark as expired
      if (useDb) {
        await supabase
          .from("reservations")
          .update({
            status: "expired",
            expired_at: nowIso,
            updated_at: nowIso
          })
          .eq("id", exp.id);
      } else {
        const list = readFallback();
        const item = list.find((r) => r.id === exp.id);
        if (item) {
          item.status = "expired";
          item.expired_at = nowIso;
          item.updated_at = nowIso;
          writeFallback(list);
        }
      }

      // Notify patron their reservation expired
      if (exp.patron_phone) {
        try {
          const bookTitle = (exp.book && exp.book.title) || "the reserved book";
          sendSms({
            number: exp.patron_phone,
            message: `MOPL Notice: Hello ${exp.patron_name}, your reservation for "${bookTitle}" has expired as it was not claimed by the scheduled pickup time. The book has been released to the next waiting patron or returned to library shelves.`
          }).catch(() => {});
        } catch (e) {}
      }

      // Automatically promote next waiting patron or restore book availability
      await promoteNextWaitingPatron(exp.book_id);
    }
  } catch (err) {
    console.error("Error running checkAndExpireReservations:", err);
  }
}

/**
 * Initialize 5-minute background cron for automatic reservation expiry
 */
function initReservationScheduler() {
  console.log("⏱️  [Reservation Scheduler]: Initialized 5-minute automated expiration check.");
  // Run on startup
  checkAndExpireReservations();

  // Run every 5 minutes
  cron.schedule("*/5 * * * *", () => {
    checkAndExpireReservations();
  });
}

module.exports = {
  getReservations,
  getMyReservations,
  getBookReservations,
  createReservation,
  cancelReservation,
  fulfillReservationForBook,
  handleBookReturnReservations,
  checkAndExpireReservations,
  initReservationScheduler
};
