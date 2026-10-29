/**
 * Capitol Library Email Test Script (Brevo)
 * Usage:
 *   node testEmail.js <recipient_email> [type]
 *   types: welcome | reset | overdue
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const {
  dispatchEmail,
  sendPatronWelcomeEmail,
  sendPasswordResetEmail,
  sendOverdueReminderEmail
} = require("./utils/email");

async function main() {
  const args = process.argv.slice(2);
  const targetEmail = args[0];
  const type = (args[1] || "reset").toLowerCase();

  if (!targetEmail) {
    console.log(`
📚 Misamis Oriental Capitol Public Library - Email Test Tool (Brevo)
--------------------------------------------------------------------
Usage:
  node testEmail.js <recipient_email> [type]

Types:
  reset    - Test 6-digit password reset code email (default)
  welcome  - Test patron account welcome email
  overdue  - Test overdue book notice email

Examples:
  node testEmail.js misamisorientalcapitollib@gmail.com
  node testEmail.js misamisorientalcapitollib@gmail.com welcome
  node testEmail.js misamisorientalcapitollib@gmail.com overdue
--------------------------------------------------------------------
`);
    return;
  }

  console.log(`🚀 Sending test [${type.toUpperCase()}] email to: ${targetEmail}`);

  let result;
  if (type === "welcome") {
    result = await sendPatronWelcomeEmail(targetEmail, "Test Patron");
  } else if (type === "overdue") {
    result = await sendOverdueReminderEmail(targetEmail, "Test Patron", [
      {
        bookId: { title: "To Kill a Mockingbird", barcode: "BK-10029" },
        dueDate: new Date(Date.now() - 3 * 86400000).toISOString()
      }
    ]);
  } else {
    result = await sendPasswordResetEmail(targetEmail, "Test User", "849201");
  }

  console.log("Result:", result);
}

main().catch(console.error);
