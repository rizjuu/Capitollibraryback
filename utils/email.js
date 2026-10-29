const SibApiV3Sdk = require("sib-api-v3-sdk");
const nodemailer = require("nodemailer");

/**
 * Configure and return Brevo TransactionalEmailsApi client
 */
function getBrevoApiInstance() {
  const apiKey = (process.env.BREVO_API_KEY || "").trim();
  if (!apiKey) return null;

  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKeyAuth = defaultClient.authentications["api-key"];
  apiKeyAuth.apiKey = apiKey;
  return new SibApiV3Sdk.TransactionalEmailsApi();
}

/**
 * Configure fallback Nodemailer transporter
 */
function createTransporter() {
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || "").trim();
  const rawPass = process.env.SMTP_PASS || process.env.GMAIL_PASS || "";
  const pass = rawPass.replace(/\s+/g, "");

  if (!user || !pass) {
    return null;
  }

  const host = (process.env.SMTP_HOST || "").toLowerCase();
  const isGmail = host.includes("gmail") || user.endsWith("@gmail.com");

  if (isGmail) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass }
    });
  }

  const port = parseInt(process.env.SMTP_PORT || "587");
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false
    }
  });
}

/**
 * Unified email sender using Brevo as the primary engine with SMTP fallback
 */
async function dispatchEmail({ to, toName, subject, htmlContent }) {
  const brevoApiKey = (process.env.BREVO_API_KEY || "").trim();

  // 1. Try sending via Brevo
  if (brevoApiKey) {
    try {
      const apiInstance = getBrevoApiInstance();
      const senderEmail = (
        process.env.BREVO_SENDER_EMAIL ||
        process.env.SMTP_USER ||
        "misamisorientalcapitollib@gmail.com"
      ).trim();
      const senderName =
        process.env.BREVO_SENDER_NAME || "Misamis Oriental Public Library";

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = htmlContent;
      sendSmtpEmail.sender = { name: senderName, email: senderEmail };
      sendSmtpEmail.to = [{ email: to, name: toName || to.split("@")[0] }];

      const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
      const messageId = response.messageId || response.messageIds || "OK";
      console.log(`[Brevo Email] Successfully sent to ${to}. Message ID: ${JSON.stringify(messageId)}`);
      return { success: true, provider: "brevo", messageId };
    } catch (brevoError) {
      let errorDetail = brevoError.message;
      if (brevoError.response && brevoError.response.text) {
        errorDetail = brevoError.response.text;
      }
      console.error(`[Brevo Email Error] Failed to send email to ${to}:`, errorDetail);

      // Check for permission issue on API key
      if (typeof errorDetail === "string" && errorDetail.includes("transactional.email")) {
        console.warn(
          "[Brevo Note]: Your Brevo API key needs 'Transactional Emails' permission enabled in https://app.brevo.com/settings/keys/api"
        );
      }
    }
  }

  // 2. Fallback to Nodemailer SMTP if Brevo fails or is unconfigured
  const transporter = createTransporter();
  if (transporter) {
    try {
      console.log(`[Email] Falling back to SMTP transport for ${to}...`);
      const user = (process.env.SMTP_USER || process.env.GMAIL_USER || "").trim();
      const fromAddress = user
        ? `"Misamis Oriental Public Library" <${user}>`
        : (process.env.SMTP_FROM || '"Misamis Oriental Public Library" <noreply@mopl.gov.ph>');

      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html: htmlContent
      });
      console.log(`[SMTP Email] Successfully sent to ${to}. Message ID: ${info.messageId}`);
      return { success: true, provider: "smtp", messageId: info.messageId };
    } catch (smtpError) {
      console.error(`[SMTP Email Error] Failed fallback for ${to}:`, smtpError.message);
      return { success: false, error: smtpError.message };
    }
  }

  console.warn(`[Email Warning] No email provider succeeded for ${to}.`);
  return { success: false, error: "NO_EMAIL_SERVICE_AVAILABLE" };
}

/**
 * 1. Send Patron Welcome Email
 */
async function sendPatronWelcomeEmail(recipientEmail, userName = "Patron") {
  const now = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Manila",
    dateStyle: "full",
    timeStyle: "short"
  });

  const subject = "Welcome to Misamis Oriental Provincial Capitol Public Library";
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #3b82f6;">
        <h2 style="color: #1e3a8a; margin: 0;">📚 Misamis Oriental Public Library</h2>
        <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">Provincial Capitol Public Library Portal</p>
      </div>
      
      <div style="padding: 30px 10px; color: #334155;">
        <h3 style="color: #0f172a; margin-top: 0;">Welcome to the Library</h3>
        <p>Hello <strong>${userName}</strong>,</p>
        <p>Your patron account was created on <strong>${now}</strong>. Welcome to the <strong>Misamis Oriental Provincial Capitol Public Library System</strong>.</p>
        <p>Your account (<strong>${recipientEmail}</strong>) is active. You can now explore the digital catalog, view available titles, and check your loan records.</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 14px 18px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 13.5px; color: #475569;">
            ℹ️ <strong>Security Tip:</strong> If you did not initiate this sign-in, please notify library staff or contact administration immediately.
          </p>
        </div>
      </div>
      
      <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
        © 2026 Misamis Oriental Provincial Capitol Public Library · All rights reserved.
      </div>
    </div>
  `;

  return await dispatchEmail({
    to: recipientEmail,
    toName: userName,
    subject,
    htmlContent
  });
}

/**
 * 2. Send Overdue Reminder Email
 */
async function sendOverdueReminderEmail(recipientEmail, userName, overdueLoans = []) {
  const loanRows = overdueLoans
    .map((loan) => {
      const title = loan.bookId?.title || "Unknown Title";
      const barcode = loan.bookId?.barcode || "N/A";
      const due = new Date(loan.dueDate).toLocaleDateString("en-US", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      const daysOverdue = Math.max(1, Math.ceil((Date.now() - new Date(loan.dueDate).getTime()) / 86400000));
      return `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${title}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #475569;">${barcode}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #b91c1c; font-weight: 600;">${due}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #b91c1c;">${daysOverdue} day(s)</td>
        </tr>
      `;
    })
    .join("");

  const subject = "Overdue Book Reminder — Misamis Oriental Public Library";
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #ef4444;">
        <h2 style="color: #1e3a8a; margin: 0;">📚 Misamis Oriental Public Library</h2>
        <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">Overdue Material Reminder</p>
      </div>

      <div style="padding: 30px 10px; color: #334155;">
        <h3 style="color: #b91c1c; margin-top: 0;">⏰ Overdue Books Notice</h3>
        <p>Hello <strong>${userName || "Patron"}</strong>,</p>
        <p>Our records show that the following item(s) borrowed under your account (<strong>${recipientEmail}</strong>) are now <strong>past their due date</strong>:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13.5px;">
          <thead>
            <tr style="background-color: #fef2f2;">
              <th style="padding: 8px 12px; text-align: left; color: #b91c1c;">Title</th>
              <th style="padding: 8px 12px; text-align: left; color: #b91c1c;">Barcode</th>
              <th style="padding: 8px 12px; text-align: left; color: #b91c1c;">Due Date</th>
              <th style="padding: 8px 12px; text-align: left; color: #b91c1c;">Overdue</th>
            </tr>
          </thead>
          <tbody>${loanRows}</tbody>
        </table>

        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 18px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 13.5px; color: #7f1d1d;">
            📌 Please return the item(s) to the library at your earliest convenience. Overdue materials may affect your borrowing privileges.
          </p>
        </div>

        <p>If you believe you have already returned these items, please contact library staff so we can update our records.</p>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
        © 2026 Misamis Oriental Provincial Capitol Public Library · All rights reserved.
      </div>
    </div>
  `;

  return await dispatchEmail({
    to: recipientEmail,
    toName: userName,
    subject,
    htmlContent
  });
}

/**
 * 3. Send Password Reset Email with Verification Code
 */
async function sendPasswordResetEmail(recipientEmail, userName, resetCode) {
  const subject = "Your Password Reset Code - Misamis Oriental Public Library";
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #6F4E37;">
        <h2 style="color: #4B3832; margin: 0;">📚 Misamis Oriental Public Library</h2>
        <p style="color: #8C7768; margin: 6px 0 0 0; font-size: 13.5px;">Account Security &amp; Password Recovery</p>
      </div>

      <div style="padding: 24px 8px; color: #334155;">
        <h3 style="color: #4B3832; margin-top: 0;">Password Reset Request</h3>
        <p>Hello <strong>${userName || "User"}</strong>,</p>
        <p>We received a request to reset the password for your library account. Use the verification code below to complete your reset:</p>

        <div style="background-color: #FAF7F2; border: 2px dashed #DCC7AA; padding: 18px; margin: 20px 0; text-align: center; border-radius: 8px;">
          <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4B3832;">
            ${resetCode}
          </span>
        </div>

        <p style="font-size: 13px; color: #64748b;">
          ⏱️ This verification code is valid for <strong>15 minutes</strong>. If you did not request a password reset, please ignore this email or contact library administration immediately.
        </p>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
        © 2026 Misamis Oriental Provincial Capitol Public Library · All rights reserved.
      </div>
    </div>
  `;

  return await dispatchEmail({
    to: recipientEmail,
    toName: userName,
    subject,
    htmlContent
  });
}

module.exports = {
  dispatchEmail,
  sendPatronWelcomeEmail,
  sendOverdueReminderEmail,
  sendPasswordResetEmail
};
