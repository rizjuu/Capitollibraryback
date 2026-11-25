/**
 * Book Lock Service
 * Ensures that when staff is checking out a specific book to a patron,
 * that book is locked exclusively to that checkout session so no other staff
 * or patron can reserve, checkout, or modify that book simultaneously.
 */

const { emitBookLockEvent } = require("./socketService");

// In-memory registry of locked books: Map<bookId, LockObject>
const lockedBooks = new Map();

// Default lock duration: 2 minutes (120,000 ms) to prevent orphaned locks if browser closes
const DEFAULT_LOCK_DURATION_MS = 2 * 60 * 1000;

/**
 * Normalize an identifier for keying
 */
function normalizeKey(val) {
  if (!val) return "";
  return String(val).trim().toLowerCase();
}

/**
 * Clean up expired locks
 */
function cleanupExpiredLocks() {
  const now = Date.now();
  for (const [key, lock] of lockedBooks.entries()) {
    if (lock.expiresAt <= now) {
      lockedBooks.delete(key);
      try {
        emitBookLockEvent("unlocked", {
          bookId: lock.bookId,
          barcode: lock.barcode,
          reason: "expired"
        });
      } catch (err) {
        console.warn("Failed to emit lock expire event:", err.message);
      }
    }
  }
}

// Run periodic cleanup every 30 seconds
setInterval(cleanupExpiredLocks, 30000);

/**
 * Find an active lock by either bookId, barcode, or accession number
 */
function findActiveLock(identifier) {
  if (!identifier) return null;
  cleanupExpiredLocks();

  const key = normalizeKey(identifier);
  for (const lock of lockedBooks.values()) {
    if (
      normalizeKey(lock.bookId) === key ||
      normalizeKey(lock.barcode) === key ||
      normalizeKey(lock.accessionNumber) === key
    ) {
      if (lock.expiresAt > Date.now()) {
        return lock;
      }
    }
  }
  return null;
}

/**
 * Acquire a lock on a book for staff checkout
 * @param {Object} params
 * @param {string} params.bookId - ID of the book
 * @param {string} params.barcode - Barcode of the book
 * @param {string} [params.accessionNumber] - Accession number
 * @param {string} [params.bookTitle] - Book Title
 * @param {Object} params.user - Staff or admin acquiring the lock
 * @param {number} [params.durationMs] - Lock duration in ms
 */
function acquireLock({ bookId, barcode, accessionNumber = "", bookTitle = "", user, durationMs = DEFAULT_LOCK_DURATION_MS }) {
  if (!bookId && !barcode) {
    return { success: false, message: "Book ID or barcode is required to acquire lock." };
  }

  const userId = user?.id || "unknown";
  const userName = user?.name || user?.email || "Staff Member";
  const userRole = user?.role || "staff";

  // Check if book is already locked by someone else
  const existingLock = findActiveLock(bookId) || findActiveLock(barcode);

  if (existingLock) {
    // If locked by the SAME staff user, extend the lease
    if (existingLock.lockedByUserId === userId) {
      existingLock.expiresAt = Date.now() + durationMs;
      existingLock.updatedAt = new Date().toISOString();
      return {
        success: true,
        alreadyOwned: true,
        lock: existingLock,
        message: "Lock renewed for active checkout."
      };
    }

    // Locked by ANOTHER staff member
    return {
      success: false,
      isLocked: true,
      lock: existingLock,
      message: `Book "${existingLock.bookTitle || 'Selected Book'}" is currently locked by ${existingLock.lockedByUserName} for an active checkout. Please wait until their transaction finishes.`
    };
  }

  // Create new lock
  const lockId = bookId ? String(bookId) : normalizeKey(barcode);
  const now = Date.now();
  const expiresAt = now + durationMs;

  const newLock = {
    bookId: bookId ? String(bookId) : "",
    barcode: barcode || "",
    accessionNumber: accessionNumber || "",
    bookTitle: bookTitle || "Book",
    lockedByUserId: userId,
    lockedByUserName: userName,
    lockedByUserRole: userRole,
    lockedAt: new Date(now).toISOString(),
    expiresAt,
    expiresAtDate: new Date(expiresAt).toISOString(),
    durationMs,
    reason: "Staff Checkout in Progress"
  };

  lockedBooks.set(lockId, newLock);

  // Broadcast lock event so all connected clients (admin & patron) update immediately
  try {
    emitBookLockEvent("locked", {
      bookId: newLock.bookId,
      barcode: newLock.barcode,
      bookTitle: newLock.bookTitle,
      lockedBy: newLock.lockedByUserName,
      lockedByUserId: newLock.lockedByUserId,
      expiresAt: newLock.expiresAtDate
    });
  } catch (err) {
    console.warn("Socket lock emit warning:", err.message);
  }

  return {
    success: true,
    lock: newLock,
    message: `Book locked exclusively for checkout by ${userName}.`
  };
}

/**
 * Release a lock held on a book
 * @param {Object} params
 * @param {string} params.bookId
 * @param {string} params.barcode
 * @param {string} [params.userId]
 * @param {boolean} [params.force] - Force unlock regardless of owner (e.g. on successful checkout)
 */
function releaseLock({ bookId, barcode, userId, force = false }) {
  const existingLock = findActiveLock(bookId) || findActiveLock(barcode);

  if (!existingLock) {
    return { success: true, message: "No active lock found for this book." };
  }

  // Check ownership unless forced
  if (!force && userId && existingLock.lockedByUserId !== userId) {
    return {
      success: false,
      message: `Cannot release lock held by ${existingLock.lockedByUserName}.`
    };
  }

  // Remove from registry
  for (const [key, lock] of lockedBooks.entries()) {
    if (lock === existingLock) {
      lockedBooks.delete(key);
      break;
    }
  }

  // Broadcast unlock event
  try {
    emitBookLockEvent("unlocked", {
      bookId: existingLock.bookId,
      barcode: existingLock.barcode,
      bookTitle: existingLock.bookTitle,
      releasedBy: userId || "system"
    });
  } catch (err) {
    console.warn("Socket unlock emit warning:", err.message);
  }

  return { success: true, message: "Book lock released successfully." };
}

/**
 * Check if a book is locked
 */
function isBookLocked(identifier) {
  const lock = findActiveLock(identifier);
  return Boolean(lock);
}

/**
 * Get active lock details for a book
 */
function getLockInfo(identifier) {
  return findActiveLock(identifier);
}

/**
 * Get all currently active locks
 */
function getAllLockedBooks() {
  cleanupExpiredLocks();
  return Array.from(lockedBooks.values());
}

module.exports = {
  acquireLock,
  releaseLock,
  isBookLocked,
  getLockInfo,
  getAllLockedBooks,
  cleanupExpiredLocks
};
