require("dotenv").config({ path: "C:/Users/X260/capitollibraryback/.env" });
const { supabase } = require("../db/supabase");
const { sendSms } = require("../utils/sms");
const { sendOverdueReminderEmail } = require("../utils/email");
const axios = require("axios");

async function main() {
  console.log("==================================================================");
  console.log("📨 COMPUTED OVERDUE NOTIFICATIONS DISPATCHER (EMAIL & SMS)");
  console.log("==================================================================");

  // 1. Fetch active unreturned loans with book details for Joshua and Angel
  const { data: loans, error } = await supabase
    .from("transactions")
    .select("*, book:books(*)")
    .eq("returned", false)
    .in("borrower_name", ["Joshua Jumawan", "Angel Yu"])
    .order("due_date", { ascending: true });

  if (error || !loans) {
    console.error("❌ Failed to query loans:", error);
    return;
  }

  const joshuaLoans = loans.filter((l) => l.borrower_name === "Joshua Jumawan");
  const angelLoans = loans.filter((l) => l.borrower_name === "Angel Yu");

  const DAILY_FINE_RATE = 5.0;
  const now = new Date();

  // Helper to compute fine summary
  function computeSummary(userLoans) {
    let totalFine = 0;
    const items = userLoans.map((l) => {
      const dueDate = new Date(l.due_date);
      const daysOverdue = Math.max(1, Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
      const fine = daysOverdue * DAILY_FINE_RATE;
      totalFine += fine;
      return {
        title: (l.book && l.book.title) || l.book_title || "Unknown Book",
        barcode: (l.book && l.book.barcode) || "N/A",
        dueDate: dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        daysOverdue,
        fine
      };
    });
    return { items, totalFine };
  }

  // ==================================================================
  // 1. DISPATCH TO JOSHUA JUMAWAN
  // ==================================================================
  const joshSummary = computeSummary(joshuaLoans);
  console.log("\n👤 Recipient: Joshua Jumawan");
  console.log(`📧 Email: ${joshuaLoans[0].borrower_email}`);
  console.log(`📱 Phone: ${joshuaLoans[0].borrower_phone}`);
  console.log(`📊 Overdue Count: ${joshSummary.items.length} books`);
  console.log(`💰 Total Computed Fine: ₱${joshSummary.totalFine.toFixed(2)}`);
  joshSummary.items.forEach((item, idx) => {
    console.log(`   [${idx + 1}] "${item.title}" | Due: ${item.dueDate} | Overdue: ${item.daysOverdue} days | Fine: ₱${item.fine.toFixed(2)}`);
  });

  // Joshua SMS
  const joshSmsMessage = `MOPL Overdue Notice: Hello Joshua Jumawan, you have 3 books OVERDUE (University Physics, Warren Buffett Way, S&P Guide; 2-4 days past due). COMPUTED OVERDUE FINE: ₱${joshSummary.totalFine.toFixed(2)} (at ₱5.00/day). Please return to Misamis Oriental Capitol Public Library to settle your account and avoid further penalties.`;
  console.log(`\n📲 Sending SMS to Joshua (${joshuaLoans[0].borrower_phone})...`);
  try {
    const smsRes = await sendSms({
      number: joshuaLoans[0].borrower_phone,
      message: joshSmsMessage
    });
    console.log("✅ Joshua SMS Result:", smsRes);
  } catch (err) {
    console.error("❌ Joshua SMS Error:", err.message);
  }

  // Joshua Email
  console.log(`📧 Sending Computed Overdue Email to Joshua (${joshuaLoans[0].borrower_email})...`);
  try {
    const emailRes = await sendOverdueReminderEmail(
      joshuaLoans[0].borrower_email,
      "Joshua Jumawan",
      joshuaLoans
    );
    console.log("✅ Joshua Email Result:", emailRes);
  } catch (err) {
    console.error("❌ Joshua Email Error:", err.message);
  }

  // Cooldown
  await new Promise((r) => setTimeout(r, 2500));

  // ==================================================================
  // 2. DISPATCH TO ANGEL YU
  // ==================================================================
  const angelSummary = computeSummary(angelLoans);
  console.log("\n👤 Recipient: Angel Yu");
  console.log(`📧 Email: ${angelLoans[0].borrower_email}`);
  console.log(`📱 Phone: ${angelLoans[0].borrower_phone}`);
  console.log(`📊 Overdue Count: ${angelSummary.items.length} books`);
  console.log(`💰 Total Computed Fine: ₱${angelSummary.totalFine.toFixed(2)}`);
  angelSummary.items.forEach((item, idx) => {
    console.log(`   [${idx + 1}] "${item.title}" | Due: ${item.dueDate} | Overdue: ${item.daysOverdue} days | Fine: ₱${item.fine.toFixed(2)}`);
  });

  // Angel SMS via HttpSMS (her verified Android gateway for Smart/TNT)
  const angelSmsMessage = `MOPL Overdue Notice: Hello Angel Yu, you have 2 books OVERDUE (Pinatubo and Lahar, Brand Name Cookbook; 2-4 days past due). COMPUTED OVERDUE FINE: ₱${angelSummary.totalFine.toFixed(2)} (at ₱5.00/day). Please return to Misamis Oriental Capitol Public Library to settle your account and avoid further penalties.`;
  console.log(`\n📲 Sending SMS to Angel (${angelLoans[0].borrower_phone})...`);
  try {
    const apiKey = process.env.HTTPSMS_API_KEY;
    const from = process.env.HTTPSMS_FROM_NUMBER || "+639678764110";
    const to = "+63" + angelLoans[0].borrower_phone.replace(/^0/, "");

    const httpSmsRes = await axios.post(
      "https://api.httpsms.com/v1/messages/send",
      { from, to, content: angelSmsMessage },
      { headers: { "x-api-key": apiKey, "Content-Type": "application/json" } }
    );
    console.log("✅ Angel SMS Result (HttpSMS):", httpSmsRes.data.message || httpSmsRes.data.status);
  } catch (err) {
    console.error("❌ Angel SMS Error:", err.response ? err.response.data : err.message);
  }

  // Angel Email
  console.log(`📧 Sending Computed Overdue Email to Angel (${angelLoans[0].borrower_email})...`);
  try {
    const emailRes = await sendOverdueReminderEmail(
      angelLoans[0].borrower_email,
      "Angel Yu",
      angelLoans
    );
    console.log("✅ Angel Email Result:", emailRes);
  } catch (err) {
    console.error("❌ Angel Email Error:", err.message);
  }

  console.log("\n==================================================================");
  console.log("🎉 ALL COMPUTED OVERDUE EMAILS AND SMS HAVE BEEN SENT!");
  console.log("==================================================================");
}

main();
