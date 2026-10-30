const SibApiV3Sdk = require("sib-api-v3-sdk");
const nodemailer = require("nodemailer");

const SENDER_EMAIL = (process.env.BREVO_SENDER_EMAIL || "misamisorientalcapitollib@gmail.com").trim();
const SENDER_NAME = (process.env.BREVO_SENDER_NAME || "Misamis Oriental Public Library").trim();

/**
 * Creates Gmail SMTP transporter using the LIBRARY'S own Gmail account.
 * SMTP_USER must be misamisorientalcapitollib@gmail.com (or whichever Gmail has an App Password).
 * Gmail App Password = 16-char password from Google Account > Security > App Passwords.
 */
function createSmtpTransporter() {
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || "").trim();
  const rawPass = process.env.SMTP_PASS || process.env.GMAIL_PASS || "";
  const pass = rawPass.replace(/\s+/g, "");

  if (!user || !pass) return null;

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
    tls: { rejectUnauthorized: false }
  });
}

/**
 * Initializes and returns the Brevo Transactional Emails API client (used as fallback)
 */
function getBrevoTransactionalApi() {
  const apiKey = (process.env.BREVO_API_KEY || "").trim();
  if (!apiKey) return null;
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKeyAuth = defaultClient.authentications["api-key"];
  apiKeyAuth.apiKey = apiKey;
  return new SibApiV3Sdk.TransactionalEmailsApi();
}

/**
 * Initializes and returns the Brevo Email Campaigns API client
 */
function getBrevoCampaignApi() {
  const apiKey = (process.env.BREVO_API_KEY || "").trim();
  if (!apiKey) return null;
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKeyAuth = defaultClient.authentications["api-key"];
  apiKeyAuth.apiKey = apiKey;
  return new SibApiV3Sdk.EmailCampaignsApi();
}

/**
 * Core sendEmail — tries Gmail SMTP first (sends from real Gmail = no spam issues),
 * then falls back to Brevo API if SMTP is not configured or fails.
 */
async function sendEmail({ to, toName = "", subject, htmlContent, textContent = "" }) {
  // ── PRIMARY: Gmail SMTP ──────────────────────────────────────────────────
  const smtpTransporter = createSmtpTransporter();

  if (smtpTransporter) {
    // Derive the display "from" address from SMTP_USER so it matches the authenticated sender
    const smtpUser = (process.env.SMTP_USER || process.env.GMAIL_USER || "").trim();
    const fromAddress = `"${SENDER_NAME}" <${smtpUser}>`;

    try {
      const info = await smtpTransporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html: htmlContent,
        text: textContent || undefined
      });
      console.log(`[SMTP Email] "${subject}" delivered to ${to}. Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId, provider: "smtp" };
    } catch (smtpErr) {
      console.error(`[SMTP Error] Failed to send to ${to}:`, smtpErr.message, "— trying Brevo fallback...");
    }
  }

  // ── FALLBACK: Brevo API ──────────────────────────────────────────────────
  const brevoApi = getBrevoTransactionalApi();

  if (brevoApi) {
    try {
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.sender = { name: SENDER_NAME, email: SENDER_EMAIL };
      sendSmtpEmail.to = [{ email: to.trim(), name: toName || to.trim() }];
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = htmlContent;
      if (textContent) sendSmtpEmail.textContent = textContent;

      const response = await brevoApi.sendTransacEmail(sendSmtpEmail);
      const messageId = response?.messageId || "brevo-sent";
      console.log(`[Brevo Email] "${subject}" delivered to ${to}. Message ID: ${messageId}`);
      return { success: true, messageId, provider: "brevo" };
    } catch (error) {
      const errMsg = error?.response?.body?.message || error?.response?.text || error?.message;
      console.error(`[Brevo Error] Failed to send "${subject}" to ${to}:`, errMsg);
      return { success: false, error: errMsg, reason: "BREVO_ERROR" };
    }
  }

  console.warn(`[Email] No email provider configured. Skipping email to ${to}.`);
  return { success: false, reason: "NO_PROVIDER" };
}

/**
 * Send welcome email to new patrons upon registration
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

  return sendEmail({
    to: recipientEmail,
    toName: userName,
    subject,
    htmlContent
  });
}

/**
 * Send overdue reminder email with list of past-due books
 */
async function sendOverdueReminderEmail(recipientEmail, userName, overdueLoans = []) {
  const loanRows = overdueLoans
    .map((loan) => {
      const title = loan.bookId?.title || loan.title || "Unknown Title";
      const barcode = loan.bookId?.barcode || loan.barcode || "N/A";
      const due = loan.dueDate
        ? new Date(loan.dueDate).toLocaleDateString("en-US", {
            timeZone: "Asia/Manila",
            year: "numeric",
            month: "long",
            day: "numeric"
          })
        : "N/A";
      const daysOverdue = loan.dueDate
        ? Math.max(1, Math.ceil((Date.now() - new Date(loan.dueDate).getTime()) / 86400000))
        : 1;
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

  return sendEmail({
    to: recipientEmail,
    toName: userName,
    subject,
    htmlContent
  });
}

/**
 * Send 6-digit password reset verification code
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

  return sendEmail({
    to: recipientEmail,
    toName: userName,
    subject,
    htmlContent
  });
}

/**
 * Brevo Campaign Creation API (for bulk announcements or newsletters)
 */
async function createEmailCampaign({
  name,
  subject,
  htmlContent,
  listIds = [],
  scheduledAt = null
}) {
  const campaignApi = getBrevoCampaignApi();
  if (!campaignApi) {
    throw new Error("BREVO_API_KEY is not configured.");
  }

  const emailCampaigns = new SibApiV3Sdk.CreateEmailCampaign();
  emailCampaigns.name = name;
  emailCampaigns.subject = subject;
  emailCampaigns.sender = {
    name: SENDER_NAME,
    email: SENDER_EMAIL
  };
  emailCampaigns.type = "classic";
  emailCampaigns.htmlContent = htmlContent;
  if (listIds && listIds.length > 0) {
    emailCampaigns.recipients = { listIds };
  }
  if (scheduledAt) {
    emailCampaigns.scheduledAt = scheduledAt;
  }

  return await campaignApi.createEmailCampaign(emailCampaigns);
}

module.exports = {
  sendEmail,
  sendPatronWelcomeEmail,
  sendOverdueReminderEmail,
  sendPasswordResetEmail,
  createEmailCampaign,
  getBrevoTransactionalApi,
  getBrevoCampaignApi,
  SENDER_EMAIL,
  SENDER_NAME
};
