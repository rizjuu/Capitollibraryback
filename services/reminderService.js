const cron = require("node-cron");
const { supabase } = require("../db/supabase");
const { sendSms, normalizePhoneNumber } = require("../utils/sms");

/**
 * Formats a date into a clean string, e.g. "Oct 20, 2026"
 */
function formatDate(dateObj) {
  try {
    return new Date(dateObj).toLocaleDateString("en-US", {
      timeZone: "Asia/Manila",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch (e) {
    return String(dateObj);
  }
}

/**
 * Checks if a given timestamp was within the last 20 hours (to avoid duplicate texts on the same day)
 */
function wasSentToday(timestamp) {
  if (!timestamp) return false;
  const sentTime = new Date(timestamp).getTime();
  const now = Date.now();
  return now - sentTime < 20 * 60 * 60 * 1000;
}

/**
 * Core Reminder Engine:
 * 1. Checks all active, unreturned book loans.
 * 2. Looks up patron's mobile number from their user account.
 * 3. Sends 2-days-before due date reminder.
 * 4. Sends overdue alert if loan is past due.
 */
async function checkAndSendDueReminders() {
  console.log("⏰ [SMS Reminder Service]: Scanning active loans for due dates & overdue books...");

  try {
    // 1. Fetch active (unreturned) loans with book data
    const { data: activeLoans, error: txError } = await supabase
      .from("transactions")
      .select("*, book:books(*)")
      .eq("returned", false);

    if (txError) {
      throw txError;
    }

    if (!activeLoans || activeLoans.length === 0) {
      console.log("ℹ️  [SMS Reminder Service]: No active loans found.");
      return { totalChecked: 0, sent: 0, skipped: 0, errors: [] };
    }

    // 2. Fetch all registered users to map mobile numbers
    const { data: users } = await supabase
      .from("users")
      .select("id, name, email, phone");

    const userById = new Map();
    const userByEmail = new Map();

    (users || []).forEach((u) => {
      if (u.id) userById.set(String(u.id), u);
      if (u.email) userByEmail.set(String(u.email).toLowerCase().trim(), u);
    });

    const now = new Date();
    const results = {
      totalChecked: activeLoans.length,
      sent2DaysBefore: 0,
      sentOverdue: 0,
      skippedNoPhone: 0,
      skippedAlreadySent: 0,
      errors: []
    };

    for (const loan of activeLoans) {
      const bookTitle = (loan.book && loan.book.title) || loan.book_title || "Borrowed Book";
      const dueDate = new Date(loan.due_date);

      if (isNaN(dueDate.getTime())) {
        continue;
      }

      // Resolve borrower user account
      let userAccount = null;
      if (loan.borrower_id && userById.has(String(loan.borrower_id))) {
        userAccount = userById.get(String(loan.borrower_id));
      } else if (loan.borrower_email && userByEmail.has(String(loan.borrower_email).toLowerCase().trim())) {
        userAccount = userByEmail.get(String(loan.borrower_email).toLowerCase().trim());
      }

      // Resolve phone number: User Account Phone -> Transaction Phone
      const rawPhone = (userAccount && userAccount.phone) || loan.borrower_phone || "";
      const normalizedPhone = normalizePhoneNumber(rawPhone);
      const borrowerName = (userAccount && userAccount.name) || loan.borrower_name || "Patron";

      if (!normalizedPhone) {
        console.log(`⚠️  [Skip]: No phone number for ${borrowerName} (Loan ID: ${loan.id})`);
        results.skippedNoPhone++;
        continue;
      }

      const diffMs = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const isPastDue = diffMs < 0;
      const formattedDue = formatDate(dueDate);

      // ========================================================
      // CASE 1: Exactly 2 Days Before Due Date
      // ========================================================
      if (diffDays === 2 && !isPastDue) {
        // Check if 2-day reminder already sent
        if (loan.reminder_2days_sent) {
          results.skippedAlreadySent++;
          continue;
        }

        const message = `MOPL Reminder: Hello ${borrowerName}, your borrowed book "${bookTitle}" is due in 2 days on ${formattedDue}. Please return during library hours (8AM-5PM, M-F). Misamis Oriental Capitol Public Library.`;

        console.log(`📲 Sending 2-Day Reminder to ${borrowerName} (${normalizedPhone})...`);

        try {
          await sendSms({ number: normalizedPhone, message });
          results.sent2DaysBefore++;

          // Mark reminder sent on transaction
          await supabase
            .from("transactions")
            .update({ reminder_2days_sent: true, updated_at: new Date().toISOString() })
            .eq("id", loan.id);

          // Log in sms_logs table (fail-safe if table doesn't exist yet)
          try {
            await supabase.from("sms_logs").insert({
              transaction_id: loan.id,
              borrower_id: userAccount ? userAccount.id : null,
              borrower_name: borrowerName,
              phone: normalizedPhone,
              reminder_type: "2days_before",
              message,
              status: "sent"
            });
          } catch (e) {
            // Ignore logging error if migration not yet applied
          }

          // 2.5 second cooldown between SMS to respect SIM Fair Use Policy
          await new Promise((resolve) => setTimeout(resolve, 2500));
        } catch (err) {
          console.error(`❌ Failed sending 2-day reminder to ${normalizedPhone}:`, err.message);
          results.errors.push({ loanId: loan.id, type: "2days_before", error: err.message });
        }
      }

      // ========================================================
      // CASE 2: Overdue Book
      // ========================================================
      else if (isPastDue) {
        // Prevent sending multiple overdue alerts on the exact same day
        if (wasSentToday(loan.last_overdue_sent_at)) {
          results.skippedAlreadySent++;
          continue;
        }

        const overdueDays = Math.max(1, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
        const message = `MOPL Overdue Alert: Hello ${borrowerName}, your borrowed book "${bookTitle}" is now OVERDUE by ${overdueDays} day(s) (was due on ${formattedDue}). Please return the book immediately to avoid penalties. Misamis Oriental Capitol Public Library.`;

        console.log(`📲 Sending Overdue Alert to ${borrowerName} (${normalizedPhone}) - ${overdueDays} days overdue...`);

        try {
          await sendSms({ number: normalizedPhone, message });
          results.sentOverdue++;

          // Update last overdue sent timestamp on transaction
          await supabase
            .from("transactions")
            .update({ last_overdue_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq("id", loan.id);

          // Log in sms_logs table
          try {
            await supabase.from("sms_logs").insert({
              transaction_id: loan.id,
              borrower_id: userAccount ? userAccount.id : null,
              borrower_name: borrowerName,
              phone: normalizedPhone,
              reminder_type: "overdue",
              message,
              status: "sent"
            });
          } catch (e) {
            // Ignore logging error if migration not yet applied
          }

          // 2.5 second cooldown between SMS
          await new Promise((resolve) => setTimeout(resolve, 2500));
        } catch (err) {
          console.error(`❌ Failed sending overdue alert to ${normalizedPhone}:`, err.message);
          results.errors.push({ loanId: loan.id, type: "overdue", error: err.message });
        }
      }
    }

    console.log("✅ [SMS Reminder Service]: Scan completed.", results);
    return results;
  } catch (error) {
    console.error("❌ [SMS Reminder Service Error]:", error);
    throw error;
  }
}

/**
 * Initializes the automated daily Cron Job (Runs every day at 8:00 AM Manila time)
 */
function initReminderScheduler() {
  // Cron syntax: "0 8 * * *" -> Everyday at 08:00 AM
  cron.schedule(
    "0 8 * * *",
    async () => {
      console.log("⏰ [Cron Job Triggered]: Running scheduled 8:00 AM SMS reminder routine...");
      try {
        await checkAndSendDueReminders();
      } catch (err) {
        console.error("Cron reminder error:", err.message);
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Manila"
    }
  );

  console.log("📅 [Scheduler Active]: Daily SMS Due & Overdue reminders scheduled at 8:00 AM (Asia/Manila).");
}

module.exports = {
  checkAndSendDueReminders,
  initReminderScheduler
};
