/**
 * Data Formatters for Capitol Library Management System
 * Maps PostgreSQL snake_case columns to camelCase objects
 * ensuring 100% compatibility with frontend components expecting Mongoose shapes (_id, id, etc.)
 */

const { formatPatronId } = require("./patronId");
const { generateCallNumber, resolveSublocation } = require("./callNumber");

function formatUser(row) {
  if (!row) return null;
  const patronId = row.role === "patron" ? (row.username || formatPatronId(row)) : (row.username || null);
  return {
    _id: row.id,
    id: row.id,
    username: row.username || null,
    patronId: patronId,
    email: row.email || null,
    role: row.role,
    name: row.name,
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    phone: row.phone || "",
    address: row.address || "",
    patronType: row.patron_type || "resident",
    school: row.school || "",
    yearLevel: row.year_level || "",
    age: row.age !== undefined && row.age !== null ? row.age : "",
    isProfileCompleted: Boolean(row.is_profile_completed),
    avatar: row.avatar || null,
    status: row.status || "active",
    googleId: row.google_id || null,
    activeLoans: row.activeLoans ?? 0,
    totalLoans: row.totalLoans ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function formatBook(row) {
  if (!row) return null;

  let parsedAuthors = [];
  if (Array.isArray(row.authors)) {
    parsedAuthors = row.authors;
  } else if (typeof row.authors === "string") {
    try {
      parsedAuthors = JSON.parse(row.authors);
    } catch {
      parsedAuthors = row.authors ? [row.authors] : [];
    }
  }

  let archivedByData = row.archived_by || null;
  if (row.archived_by_user && typeof row.archived_by_user === "object") {
    archivedByData = {
      _id: row.archived_by_user.id,
      id: row.archived_by_user.id,
      name: row.archived_by_user.name,
      email: row.archived_by_user.email
    };
  }

  const cleanSection = row.section || "Circulation Section";
  const callNumber = (row.call_number || row.callNumber || "").trim() || generateCallNumber({
    section: cleanSection,
    category: row.category,
    title: row.title,
    author: row.author,
    publicationYear: row.publication_year,
    dateAdded: row.date_added || row.created_at
  });
  const sublocation = (row.sublocation || "").trim() || resolveSublocation(cleanSection, row.category, row.shelf);

  return {
    _id: row.id,
    id: row.id,
    isbn: row.isbn || "",
    barcode: row.barcode,
    accessionNumber: row.accession_number || null,
    callNumber: callNumber,
    call_number: callNumber,
    sublocation: sublocation,
    title: row.title,
    author: row.author || "Unknown",
    authors: parsedAuthors,
    category: row.category || "General",
    section: cleanSection,
    publisher: row.publisher || "N/A",
    publicationYear: row.publication_year !== null && row.publication_year !== undefined ? Number(row.publication_year) : null,
    shelf: row.shelf || "General Shelf",
    status: row.status || "available",
    available: row.available !== false,
    dateAdded: row.date_added || row.created_at,
    description: row.description || "",
    coverUrl: row.cover_url || "",
    openLibraryKey: row.open_library_key || "",
    source: row.source || "manual",
    condition: row.condition || "Good",
    copies: Number(row.copies) || 1,
    borrowable: row.borrowable !== false,
    archived: Boolean(row.archived),
    archivedAt: row.archived_at || null,
    archivedBy: archivedByData,
    weedingReason: row.weeding_reason || "Damaged / Outdated / Weeded",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function formatTransaction(row, bookData) {
  if (!row) return null;
  const book = bookData || row.book || row.books;

  return {
    _id: row.id,
    id: row.id,
    bookId: book ? formatBook(book) : row.book_id,
    borrowerId: row.borrower_id || null,
    borrowerName: row.borrower_name,
    borrowerEmail: row.borrower_email || "",
    dueDate: row.due_date,
    returned: Boolean(row.returned),
    returnDate: row.return_date || null,
    type: row.type || "Borrow",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function formatAnnouncement(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    title: row.title,
    content: row.content,
    date: row.date || (row.created_at ? new Date(row.created_at).toISOString().split("T")[0] : ""),
    priority: row.priority || "normal",
    author: row.author || "Library Admin",
    active: row.active !== false,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function formatReservation(row, bookData, patronData) {
  if (!row) return null;
  const book = bookData || row.book;
  const patron = patronData || row.patron;

  return {
    _id: row.id,
    id: row.id,
    bookId: row.book_id,
    book: book ? formatBook(book) : null,
    patronId: row.patron_id,
    patron: patron ? formatUser(patron) : null,
    patronName: row.patron_name,
    patronEmail: row.patron_email || "",
    patronPhone: row.patron_phone || "",
    pickupDate: row.pickup_date,
    pickupTime: row.pickup_time || "During Library Hours (8AM - 5PM)",
    pickupDeadline: row.pickup_deadline,
    queuePosition: Number(row.queue_position) || 1,
    status: row.status || "ready",
    notes: row.notes || "",
    notifiedAt: row.notified_at || null,
    fulfilledAt: row.fulfilled_at || null,
    cancelledAt: row.cancelled_at || null,
    expiredAt: row.expired_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

module.exports = {
  formatUser,
  formatBook,
  formatTransaction,
  formatAnnouncement,
  formatReservation
};
