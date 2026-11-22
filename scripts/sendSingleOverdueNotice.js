require("dotenv").config({ path: "C:/Users/X260/capitollibraryback/.env" });
const { supabase } = require("../db/supabase");
const { sendSms } = require("../utils/sms");
const { sendOverdueReminderEmail } = require("../utils/email");
const axios = require("axios");

async function sendUpdated() {
  const { data: loans } = await supabase
    .from("transactions")
    .select("*, book:books(*)")
    .eq("returned", false)
    .in("borrower_name", ["Joshua Jumawan", "Angel Yu"]);

  for (const loan of loans) {
    const isJosh = loan.borrower_name === "Joshua Jumawan";
    const bookTitle = loan.book.title;
    const phone = loan.borrower_phone;
    const email = loan.borrower_email;

    const smsMsg = `MOPL Overdue Notice: Hello ${loan.borrower_name}, your borrowed book "${bookTitle}" is 4 days OVERDUE (due Nov 18, 2026). COMPUTED OVERDUE FINE: ₱20.00 (at ₱5.00/day). Please return immediately to Misamis Oriental Capitol Public Library to settle your account.`;

    console.log(`Sending SMS to ${loan.borrower_name} (${phone})...`);
    if (isJosh) {
      await sendSms({ number: phone, message: smsMsg }).catch((e) => console.error("Josh SMS error:", e.message));
    } else {
      const apiKey = process.env.HTTPSMS_API_KEY;
      const from = process.env.HTTPSMS_FROM_NUMBER || "+639678764110";
      const to = "+63" + phone.replace(/^0/, "");
      await axios
        .post(
          "https://api.httpsms.com/v1/messages/send",
          { from, to, content: smsMsg },
          { headers: { "x-api-key": apiKey, "Content-Type": "application/json" } }
        )
        .catch((e) => console.error("Angel SMS error:", e.message));
    }

    console.log(`Sending Email to ${loan.borrower_name} (${email})...`);
    await sendOverdueReminderEmail(email, loan.borrower_name, [loan]).catch((e) => console.error("Email error:", e.message));

    await new Promise((r) => setTimeout(r, 2000));
  }
  console.log("✅ Updated 1-book notices successfully dispatched.");
}

sendUpdated();
