const axios = require("axios");
const { supabase } = require("../db/supabase");
const path = require("path");
const fs = require("fs");
const cron = require("node-cron");
const crypto = require("crypto");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const META_FILE_PATH = path.resolve(__dirname, "../data/last_backup_meta.json");

/**
 * Loads metadata of last successful backup
 */
function getLastBackupMeta() {
  try {
    if (fs.existsSync(META_FILE_PATH)) {
      const raw = fs.readFileSync(META_FILE_PATH, "utf8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Notice: Could not read backup metadata file:", err.message);
  }
  return null;
}

/**
 * Saves metadata after a successful backup
 */
function saveBackupMeta(meta) {
  try {
    const dir = path.dirname(META_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(META_FILE_PATH, JSON.stringify(meta, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save backup metadata:", err.message);
  }
}

/**
 * Helper to escape and format an array of values into a CSV row
 */
function toCsvRow(items) {
  return items
    .map((val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    })
    .join(",");
}

/**
 * Generates CSV content from headers and rows
 */
function generateCsv(headers, rows) {
  const headerLine = toCsvRow(headers);
  const dataLines = rows.map((r) => toCsvRow(r));
  return [headerLine, ...dataLines].join("\r\n");
}

/**
 * Computes a fingerprint representing the current database state
 */
async function getDatabaseFingerprint() {
  const [usersRes, booksRes, txRes, resRes, annRes] = await Promise.all([
    supabase.from("users").select("id, updated_at", { count: "exact" }).order("updated_at", { ascending: false }).limit(1),
    supabase.from("books").select("id, updated_at", { count: "exact" }).order("updated_at", { ascending: false }).limit(1),
    supabase.from("transactions").select("id, created_at", { count: "exact" }).order("created_at", { ascending: false }).limit(1),
    supabase.from("reservations").select("id, created_at", { count: "exact" }).order("created_at", { ascending: false }).limit(1),
    supabase.from("announcements").select("id, created_at", { count: "exact" }).order("created_at", { ascending: false }).limit(1)
  ]);

  const rawString = [
    `users:${usersRes.count || 0}:${usersRes.data?.[0]?.updated_at || ""}`,
    `books:${booksRes.count || 0}:${booksRes.data?.[0]?.updated_at || ""}`,
    `tx:${txRes.count || 0}:${txRes.data?.[0]?.created_at || ""}`,
    `res:${resRes.count || 0}:${resRes.data?.[0]?.created_at || ""}`,
    `ann:${annRes.count || 0}:${annRes.data?.[0]?.created_at || ""}`
  ].join("|");

  const hash = crypto.createHash("md5").update(rawString).digest("hex");

  return {
    fingerprint: hash,
    summary: {
      users: usersRes.count || 0,
      books: booksRes.count || 0,
      transactions: txRes.count || 0,
      reservations: resRes.count || 0,
      announcements: annRes.count || 0
    }
  };
}

/**
 * Uploads raw CSV spreadsheets for Books, Users, and Circulation to Google Drive
 */
async function performDriveWebhookBackup(options = {}) {
  const { force = false } = options;
  const webhookUrl = process.env.GDRIVE_WEBHOOK_URL;
  const folderId = process.env.GDRIVE_BACKUP_FOLDER_ID || "12gfAh5MNVeohialmAY19z88Soy4xDdeL";

  if (!webhookUrl) {
    console.log("ℹ️  [Daily Backup]: GDRIVE_WEBHOOK_URL not configured in .env. Skipping backup.");
    return { skipped: true, reason: "No webhook URL configured" };
  }

  // 1. Check for data changes
  const { fingerprint, summary } = await getDatabaseFingerprint();
  const lastMeta = getLastBackupMeta();

  if (!force && lastMeta && lastMeta.fingerprint === fingerprint) {
    console.log("ℹ️  [Daily Backup]: No new or modified data detected since last backup. Skipping upload.");
    return {
      skipped: true,
      reason: "No new data",
      lastBackupAt: lastMeta.lastBackupAt
    };
  }

  console.log("🔔 [Daily Backup]: New or modified data detected! Exporting raw CSV files to Google Drive...");

  // 2. Fetch Books, Users, and Transactions
  const [booksRes, usersRes, txRes] = await Promise.all([
    supabase.from("books").select("*").order("title", { ascending: true }),
    supabase.from("users").select("*").order("name", { ascending: true }),
    supabase.from("transactions").select("*, book:books(*)").order("created_at", { ascending: false })
  ]);

  const books = booksRes.data || [];
  const users = usersRes.data || [];
  const transactions = txRes.data || [];

  // 3. Build CSV for Books Catalog
  const bookHeaders = [
    "Barcode",
    "Accession Number",
    "Call Number",
    "Title",
    "Author",
    "Category",
    "Section",
    "Shelf",
    "Publisher",
    "Publication Year",
    "Status",
    "Available",
    "Condition",
    "Copies",
    "Date Added",
    "Description"
  ];
  const bookRows = books.map((b) => [
    b.barcode || "",
    b.accession_number || "",
    b.call_number || "",
    b.title || "",
    b.author || "",
    b.category || "",
    b.section || "",
    b.shelf || "",
    b.publisher || "",
    b.publication_year || "",
    b.status || "",
    b.available ? "Yes" : "No",
    b.condition || "Good",
    b.copies || 1,
    b.date_added || b.created_at || "",
    b.description || ""
  ]);
  const booksCsv = generateCsv(bookHeaders, bookRows);

  // 4. Build CSV for Users Directory
  const userHeaders = [
    "User / Patron ID",
    "Username",
    "Full Name",
    "Email",
    "Phone Number",
    "Role",
    "Classification",
    "School",
    "Year Level",
    "Age",
    "Address",
    "Status",
    "Profile Completed",
    "Date Created"
  ];
  const userRows = users.map((u) => [
    u.username || u.id,
    u.username || "",
    u.name || "",
    u.email || "",
    u.phone || "",
    u.role || "patron",
    u.patron_type || "resident",
    u.school || "",
    u.year_level || "",
    u.age ?? "",
    u.address || "",
    u.status || "active",
    u.is_profile_completed ? "Yes" : "No",
    u.created_at || ""
  ]);
  const usersCsv = generateCsv(userHeaders, userRows);

  // 5. Build CSV for Circulation / Transactions
  const txHeaders = [
    "Transaction ID",
    "Date Borrowed",
    "Due Date",
    "Date Returned",
    "Status",
    "Book Barcode",
    "Book Title",
    "Borrower Name",
    "Borrower Email"
  ];
  const txRows = transactions.map((t) => {
    const isOverdue = !t.returned && t.due_date && new Date(t.due_date) < new Date();
    const status = t.returned ? "Returned" : isOverdue ? "Overdue" : "Active";
    return [
      t.id,
      t.created_at || "",
      t.due_date || "",
      t.return_date || "",
      status,
      t.book?.barcode || "",
      t.book?.title || "",
      t.borrower_name || "",
      t.borrower_email || ""
    ];
  });
  const transactionsCsv = generateCsv(txHeaders, txRows);

  // 6. Upload files to Google Drive
  const dateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const filesToUpload = [
    {
      fileName: `books_catalog_${dateStr}.csv`,
      csv: booksCsv,
      description: "Books Catalog Spreadsheet"
    },
    {
      fileName: `users_directory_${dateStr}.csv`,
      csv: usersCsv,
      description: "Users and Patrons Directory Spreadsheet"
    },
    {
      fileName: `circulation_transactions_${dateStr}.csv`,
      csv: transactionsCsv,
      description: "Circulation and Borrowing Transactions Spreadsheet"
    }
  ];

  const uploadResults = [];

  for (const item of filesToUpload) {
    console.log(`📤 [Daily Backup]: Uploading ${item.fileName} (${(Buffer.byteLength(item.csv, "utf8") / 1024).toFixed(2)} KB) to Google Drive...`);

    const base64Data = Buffer.from(item.csv, "utf8").toString("base64");

    const response = await axios.post(
      webhookUrl,
      {
        fileName: item.fileName,
        fileBase64: base64Data,
        mimeType: "text/csv",
        folderId
      },
      {
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        maxRedirects: 10,
        timeout: 120000
      }
    );

    const resData = response.data;
    if (resData && resData.status === "error") {
      throw new Error(`Google Apps Script reported an error on ${item.fileName}: ${resData.message}`);
    }

    console.log(`✅ [Daily Backup]: ${item.fileName} uploaded successfully! File ID: ${resData?.fileId || "uploaded"}`);
    uploadResults.push({
      fileName: item.fileName,
      fileId: resData?.fileId,
      url: resData?.url,
      sizeBytes: Buffer.byteLength(item.csv, "utf8")
    });

    // Small delay between uploads
    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  // 7. Save metadata
  saveBackupMeta({
    fingerprint,
    lastBackupAt: new Date().toISOString(),
    format: "csv_spreadsheets",
    files: uploadResults,
    summary
  });

  return {
    success: true,
    format: "csv_spreadsheets",
    uploadedFiles: uploadResults,
    summary
  };
}

/**
 * Initializes automated daily Google Drive backup scheduler (Midnight Manila time)
 */
function initDriveWebhookScheduler() {
  const webhookUrl = process.env.GDRIVE_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("ℹ️  [Daily Backup]: Scheduler inactive (GDRIVE_WEBHOOK_URL missing in .env).");
    return;
  }

  // Run everyday at 00:00 (Midnight) Asia/Manila
  cron.schedule(
    "0 0 * * *",
    async () => {
      console.log("⏰ [Daily Backup Cron]: Checking if new data exists for daily CSV backup...");
      try {
        await performDriveWebhookBackup();
      } catch (err) {
        console.error("❌ [Daily Auto CSV Backup Failed]:", err.message);
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Manila"
    }
  );

  console.log("📅 [Scheduler Active]: Daily Google Drive CSV backup active (runs every midnight at 12:00 AM Manila time; exports Books & Users as Google Sheets CSV).");
}

module.exports = {
  performDriveWebhookBackup,
  initDriveWebhookScheduler
};
