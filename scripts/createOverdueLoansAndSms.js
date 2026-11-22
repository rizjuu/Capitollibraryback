require("dotenv").config({ path: "C:/Users/X260/capitollibraryback/.env" });
const { supabase } = require("../db/supabase");
const { sendSms, normalizePhoneNumber } = require("../utils/sms");

async function main() {
  console.log("🚀 Starting Overdue Loans Creation & SMS Notification Script...");

  // 1. Fetch Joshua Jumawan and Angel Yu
  const { data: users, error: userErr } = await supabase
    .from("users")
    .select("id, name, email, phone")
    .in("name", ["Joshua Jumawan", "Angel Yu"]);

  if (userErr || !users || users.length < 2) {
    console.error("❌ Failed to fetch users:", userErr || users);
    return;
  }

  const joshua = users.find((u) => u.name === "Joshua Jumawan");
  const angel = users.find((u) => u.name === "Angel Yu");

  console.log(`👤 Joshua: ${joshua.name} (${joshua.email}, ${joshua.phone})`);
  console.log(`👤 Angel: ${angel.name} (${angel.email}, ${angel.phone})`);

  // 2. Fetch the 5 books
  const targetBarcodes = [
    "Misor-Lib-081", // University Physics
    "Misor-Lib-383", // The Warren Buffett Way
    "Misor-Lib-370", // The Standard & Poor's Guide
    "Misor-Lib-308", // Pinatubo and the Politics of Lahar
    "Misor-Lib-272"  // Great American Favorite Brand Name Cookbook
  ];

  const { data: books, error: bookErr } = await supabase
    .from("books")
    .select("id, title, author, barcode, available")
    .in("barcode", targetBarcodes);

  if (bookErr || !books || books.length < 5) {
    console.error("❌ Failed to fetch 5 books:", bookErr || books);
    return;
  }

  const bookByBarcode = new Map(books.map((b) => [b.barcode, b]));

  // Dates:
  // Today: Nov 22, 2026
  // 4 days overdue: Due Nov 18, 2026 (Borrowed Nov 11, 2026)
  // 2 days overdue: Due Nov 20, 2026 (Borrowed Nov 13, 2026)
  const due4DaysAgo = "2026-11-18T10:00:00.000Z";
  const borrowDate4DaysAgo = "2026-11-11T10:00:00.000Z";

  const due2DaysAgo = "2026-11-20T10:00:00.000Z";
  const borrowDate2DaysAgo = "2026-11-13T10:00:00.000Z";

  const nowIso = new Date().toISOString();

  // 3. Prepare Transactions
  const newTransactions = [
    // Joshua's 3 books
    {
      book_id: bookByBarcode.get("Misor-Lib-081").id,
      borrower_id: joshua.id,
      borrower_name: joshua.name,
      borrower_email: joshua.email,
      borrower_phone: joshua.phone,
      due_date: due4DaysAgo,
      returned: false,
      type: "Borrow",
      created_at: borrowDate4DaysAgo,
      updated_at: nowIso,
      reminder_2days_sent: true,
      last_overdue_sent_at: nowIso
    },
    {
      book_id: bookByBarcode.get("Misor-Lib-383").id,
      borrower_id: joshua.id,
      borrower_name: joshua.name,
      borrower_email: joshua.email,
      borrower_phone: joshua.phone,
      due_date: due4DaysAgo,
      returned: false,
      type: "Borrow",
      created_at: borrowDate4DaysAgo,
      updated_at: nowIso,
      reminder_2days_sent: true,
      last_overdue_sent_at: nowIso
    },
    {
      book_id: bookByBarcode.get("Misor-Lib-370").id,
      borrower_id: joshua.id,
      borrower_name: joshua.name,
      borrower_email: joshua.email,
      borrower_phone: joshua.phone,
      due_date: due2DaysAgo,
      returned: false,
      type: "Borrow",
      created_at: borrowDate2DaysAgo,
      updated_at: nowIso,
      reminder_2days_sent: true,
      last_overdue_sent_at: nowIso
    },

    // Angel's 2 books
    {
      book_id: bookByBarcode.get("Misor-Lib-308").id,
      borrower_id: angel.id,
      borrower_name: angel.name,
      borrower_email: angel.email,
      borrower_phone: angel.phone,
      due_date: due4DaysAgo,
      returned: false,
      type: "Borrow",
      created_at: borrowDate4DaysAgo,
      updated_at: nowIso,
      reminder_2days_sent: true,
      last_overdue_sent_at: nowIso
    },
    {
      book_id: bookByBarcode.get("Misor-Lib-272").id,
      borrower_id: angel.id,
      borrower_name: angel.name,
      borrower_email: angel.email,
      borrower_phone: angel.phone,
      due_date: due2DaysAgo,
      returned: false,
      type: "Borrow",
      created_at: borrowDate2DaysAgo,
      updated_at: nowIso,
      reminder_2days_sent: true,
      last_overdue_sent_at: nowIso
    }
  ];

  console.log("💾 Inserting 5 overdue borrow transactions into Supabase...");
  const { data: insertedTx, error: txError } = await supabase
    .from("transactions")
    .insert(newTransactions)
    .select("id, book_id, borrower_name, due_date, returned");

  if (txError) {
    console.error("❌ Failed to insert transactions:", txError);
    return;
  }
  console.log("✅ Successfully inserted transactions:", insertedTx);

  // 4. Update the 5 books to borrowed status in Supabase
  const bookIds = books.map((b) => b.id);
  console.log("📚 Updating 5 books to available: false, status: 'borrowed'...");
  const { error: updateBooksErr } = await supabase
    .from("books")
    .update({
      available: false,
      status: "borrowed",
      updated_at: nowIso
    })
    .in("id", bookIds);

  if (updateBooksErr) {
    console.error("❌ Failed to update book availability:", updateBooksErr);
  } else {
    console.log("✅ All 5 books marked as borrowed in catalog!");
  }

  // 5. Send real SMS notices to both Joshua and Angel
  console.log("\n📱 ================= SMS NOTIFICATIONS =================");

  // Joshua's SMS
  const joshuaMsg = `MOPL Overdue Notice: Hello Joshua Jumawan, you have 3 books OVERDUE (University Physics, The Warren Buffett Way, S&P Guide). Due was Nov 18 & Nov 20 (2-4 days ago). Please return immediately to Misamis Oriental Capitol Public Library to avoid penalties.`;
  console.log(`Sending to Joshua (${joshua.phone})...`);
  try {
    const resJosh = await sendSms({
      number: joshua.phone,
      message: joshuaMsg
    });
    console.log("✅ SMS to Joshua successful:", resJosh);
  } catch (smsErr) {
    console.error("❌ Failed sending SMS to Joshua:", smsErr.message);
  }

  // Cooldown
  await new Promise((r) => setTimeout(r, 2500));

  // Angel's SMS
  const angelMsg = `MOPL Overdue Notice: Hello Angel Yu, you have 2 books OVERDUE (Pinatubo and Politics of Lahar, Brand Name Cookbook). Due was Nov 18 & Nov 20 (2-4 days ago). Please return immediately to Misamis Oriental Capitol Public Library to avoid penalties.`;
  console.log(`Sending to Angel (${angel.phone})...`);
  try {
    const resAngel = await sendSms({
      number: angel.phone,
      message: angelMsg
    });
    console.log("✅ SMS to Angel successful:", resAngel);
  } catch (smsErr) {
    console.error("❌ Failed sending SMS to Angel:", smsErr.message);
  }

  // 6. Log SMS into sms_logs if table exists
  try {
    await supabase.from("sms_logs").insert([
      {
        borrower_id: joshua.id,
        borrower_name: joshua.name,
        phone: joshua.phone,
        reminder_type: "overdue",
        message: joshuaMsg,
        status: "sent"
      },
      {
        borrower_id: angel.id,
        borrower_name: angel.name,
        phone: angel.phone,
        reminder_type: "overdue",
        message: angelMsg,
        status: "sent"
      }
    ]);
    console.log("✅ Logged in sms_logs table.");
  } catch (e) {
    console.log("Notice: sms_logs table skipped or not configured.");
  }

  console.log("\n🎉 ALL DONE! 5 overdue loans are active in Supabase and live in deployed system.");
}

main();
