/**
 * Brevo Email Test Tool
 * Capitol Library Management System
 * Sender: misamisorientalcapitollib@gmail.com
 */

require("dotenv").config();
const {
  sendEmail,
  sendPatronWelcomeEmail,
  sendPasswordResetEmail,
  sendOverdueReminderEmail,
  SENDER_EMAIL,
  SENDER_NAME
} = require("./utils/email");

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`
📚 Misamis Oriental Capitol Public Library - Brevo Email Testing Tool
-----------------------------------------------------------------------
Sender: ${SENDER_NAME} <${SENDER_EMAIL}>
Brevo API Key Configured: ${process.env.BREVO_API_KEY ? "YES" : "NO"}

Usage:
  node testEmail.js <recipient_email>
      Send a general test email to verify Brevo configuration

  node testEmail.js --welcome <recipient_email> [name]
      Test the patron welcome email template

  node testEmail.js --reset <recipient_email> [name]
      Test the 6-digit password reset verification code email

  node testEmail.js --overdue <recipient_email> [name]
      Test the overdue book notice email

Examples:
  node testEmail.js patron@example.com
  node testEmail.js --welcome patron@example.com "Juan Dela Cruz"
  node testEmail.js --reset patron@example.com "Maria Santos"
-----------------------------------------------------------------------
`);
    return;
  }

  const mode = args[0];

  if (mode === "--welcome") {
    const to = args[1];
    const name = args[2] || "Library Patron";
    if (!to) {
      console.error("Please specify a recipient email: node testEmail.js --welcome <email>");
      return;
    }
    console.log(`Sending Welcome Email via Brevo to ${to}...`);
    const res = await sendPatronWelcomeEmail(to, name);
    console.log("Result:", res);
    return;
  }

  if (mode === "--reset") {
    const to = args[1];
    const name = args[2] || "Library User";
    if (!to) {
      console.error("Please specify a recipient email: node testEmail.js --reset <email>");
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Sending Password Reset Email (${code}) via Brevo to ${to}...`);
    const res = await sendPasswordResetEmail(to, name, code);
    console.log("Result:", res);
    return;
  }

  if (mode === "--overdue") {
    const to = args[1];
    const name = args[2] || "Library Patron";
    if (!to) {
      console.error("Please specify a recipient email: node testEmail.js --overdue <email>");
      return;
    }
    const sampleLoans = [
      {
        bookId: { title: "Florante at Laura", barcode: "CL-FIL-0010" },
        dueDate: new Date(Date.now() - 3 * 86400000).toISOString()
      },
      {
        bookId: { title: "Introduction to Algorithms", barcode: "CL-CS-0042" },
        dueDate: new Date(Date.now() - 1 * 86400000).toISOString()
      }
    ];
    console.log(`Sending Overdue Notice Email via Brevo to ${to}...`);
    const res = await sendOverdueReminderEmail(to, name, sampleLoans);
    console.log("Result:", res);
    return;
  }

  // Default: generic test email
  const to = mode;
  console.log(`Sending test email via Brevo to ${to}...`);
  const res = await sendEmail({
    to,
    toName: "Library Member",
    subject: "Brevo Email Integration Test - Capitol Library",
    htmlContent: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #1e3a8a;">Capitol Public Library - Email Test</h2>
        <p>This email confirms that the <strong>Brevo API</strong> integration is fully functional.</p>
        <p><strong>Sender:</strong> ${SENDER_NAME} &lt;${SENDER_EMAIL}&gt;</p>
        <p><strong>Status:</strong> Active &amp; Ready</p>
      </div>
    `
  });
  console.log("Result:", res);
}

main().catch((err) => {
  console.error("Fatal error:", err);
});
