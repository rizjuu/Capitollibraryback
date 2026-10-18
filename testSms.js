/**
 * Capitol Library SMS Quick Test Script
 * Supports:
 *   1. HttpSMS (Android Phone from Google Play Store + SIM unli text)
 *   2. Textbee (Android Phone Gateway)
 *   3. Semaphore API
 */

require("dotenv").config();
const {
  getAccountInfo,
  sendSms,
  sendOtpSms,
  normalizePhoneNumber,
  getActiveProvider
} = require("./utils/sms");
const { checkAndSendDueReminders } = require("./services/reminderService");

async function main() {
  const args = process.argv.slice(2);
  const provider = getActiveProvider();

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`
📚 Misamis Oriental Capitol Public Library - SMS Testing Tool
--------------------------------------------------------------
Active Provider: [ ${provider.toUpperCase()} ]

Usage:
  node testSms.js --status
      Check active SMS provider connection and status

  node testSms.js --reminders
      Manually trigger the 2-days-before & overdue loan scan

  node testSms.js <mobile_number> "<message>"
      Send an SMS reminder or notice to a recipient

  node testSms.js --otp <mobile_number>
      Send an OTP verification code to a recipient

Examples:
  node testSms.js --reminders
  node testSms.js 09638463359 "MOPL Notice: Your book is due on Friday."
  node testSms.js --otp 09638463359
--------------------------------------------------------------
`);
    return;
  }

  // Check account status
  if (args.includes("--status") || args.includes("--balance")) {
    console.log(`🔍 Checking status for active provider: [${provider}]...`);
    try {
      const info = await getAccountInfo();
      console.log("✅ Provider Info:", info);
    } catch (error) {
      console.error("❌ Failed to fetch info:", error.message);
    }
    return;
  }

  // Trigger automated reminder scan
  if (args.includes("--reminders") || args.includes("--scan")) {
    console.log("⏰ Triggering Automated 2-Days-Before & Overdue Reminder Scan...");
    try {
      const summary = await checkAndSendDueReminders();
      console.log("📊 Scan Results:", summary);
    } catch (error) {
      console.error("❌ Failed to run reminder scan:", error.message);
    }
    return;
  }

  // Send OTP
  if (args[0] === "--otp") {
    const number = args[1];
    if (!number) {
      console.error("❌ Please provide a mobile number: node testSms.js --otp 09638463359");
      return;
    }

    console.log(`📲 [${provider.toUpperCase()}] Sending OTP to ${normalizePhoneNumber(number)}...`);
    try {
      const code = Math.floor(100000 + Math.random() * 900000);
      const res = await sendOtpSms({
        number,
        message: "Capitol Public Library: Your verification code is: {otp}. Valid for 5 minutes.",
        code
      });
      console.log("✅ OTP successfully dispatched!");
      console.log("🔑 Verification Code:", code);
      console.log("📄 Response:", res);
    } catch (error) {
      console.error("❌ Failed to send OTP:", error.message);
    }
    return;
  }

  // Send standard SMS
  const number = args[0];
  const message =
    args[1] ||
    "MOPL Notice: This is a sample reminder from Misamis Oriental Provincial Capitol Public Library.";

  console.log(`📲 [${provider.toUpperCase()}] Sending message to ${normalizePhoneNumber(number)}...`);
  console.log(`📝 Message: "${message}"`);

  try {
    const res = await sendSms({ number, message });
    console.log(`✅ SMS successfully sent via ${provider}!`);
    console.log("📄 Response:", res);
  } catch (error) {
    console.error("❌ Failed to send SMS:", error.message);
  }
}

main();
