const SibApiV3Sdk = require("sib-api-v3-sdk");
const nodemailer = require("nodemailer");

const SENDER_EMAIL = (process.env.BREVO_SENDER_EMAIL || "misamisorientalcapitollib@gmail.com").trim();
const SENDER_NAME = (process.env.BREVO_SENDER_NAME || "Misamis Oriental Public Library").trim();

/**
 * Brevo Transactional Emails API (PRIMARY — works on all hosting platforms)
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
 * Brevo Email Campaigns API
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
 * Gmail SMTP transporter (FALLBACK — only works locally; Render.com blocks outbound SMTP port 587).
 * Only used when SMTP_ENABLED=true is set in environment variables.
 */
function createSmtpTransporter() {
  // Skip SMTP entirely unless explicitly enabled (avoids timeout delays on Render/cloud hosting)
  if (process.env.SMTP_ENABLED !== "true") return null;

  const user = (process.env.SMTP_USER || "").trim();
  const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");
  if (!user || !pass || pass.startsWith("REPLACE_WITH")) return null;

  const host = (process.env.SMTP_HOST || "").toLowerCase();
  const isGmail = host.includes("gmail") || user.endsWith("@gmail.com");

  if (isGmail) {
    return nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
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
 * Core sendEmail function.
 *
 * Priority:
 *   1. Brevo API  — works on Render, Vercel, Railway, etc. (no port restrictions)
 *   2. Gmail SMTP — only when SMTP_ENABLED=true (for local dev / self-hosted servers)
 *
 * Note: Render.com blocks outbound SMTP (port 587/465) on free plans, so SMTP will
 * always time-out there. Brevo is the correct provider for the deployed server.
 *
 * Spam tip: Brevo sends from a brevosend.com relay domain. If emails land in spam,
 * recipients should mark as "Not Spam" or add misamisorientalcapitollib@gmail.com to contacts.
 * A verified Brevo sender domain (DNS records) will fully resolve this.
 */
async function sendEmail({ to, toName = "", subject, htmlContent, textContent = "" }) {
  // ── PRIMARY: Brevo API ──────────────────────────────────────────────────
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
      console.log(`[Email] "${subject}" → ${to} ✓ (Brevo | ID: ${messageId})`);
      return { success: true, messageId, provider: "brevo" };
    } catch (error) {
      const errMsg = error?.response?.body?.message || error?.response?.text || error?.message;
      console.error(`[Brevo Error] Failed to send "${subject}" to ${to}:`, errMsg);
      // Fall through to SMTP fallback
    }
  }

  // ── FALLBACK: Gmail SMTP (local/self-hosted only, SMTP_ENABLED=true) ────
  const smtpTransporter = createSmtpTransporter();

  if (smtpTransporter) {
    const smtpUser = (process.env.SMTP_USER || "").trim();
    try {
      const info = await smtpTransporter.sendMail({
        from: `"${SENDER_NAME}" <${smtpUser}>`,
        to,
        subject,
        html: htmlContent,
        text: textContent || undefined
      });
      console.log(`[Email] "${subject}" → ${to} ✓ (SMTP | ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId, provider: "smtp" };
    } catch (smtpErr) {
      console.error(`[SMTP Error] Failed to send to ${to}:`, smtpErr.message);
      return { success: false, error: smtpErr.message, reason: "SMTP_ERROR" };
    }
  }

  console.warn(`[Email] No provider configured. Skipping email to ${to}.`);
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
  const DAILY_FINE_RATE = 5.0;
  let totalComputedFine = 0;

  const loanRows = overdueLoans
    .map((loan) => {
      const title = loan.bookId?.title || loan.book?.title || loan.title || "Unknown Title";
      const barcode = loan.bookId?.barcode || loan.book?.barcode || loan.barcode || "N/A";
      const dueDateRaw = loan.dueDate || loan.due_date;
      const due = dueDateRaw
        ? new Date(dueDateRaw).toLocaleDateString("en-US", {
            timeZone: "Asia/Manila",
            year: "numeric",
            month: "short",
            day: "numeric"
          })
        : "N/A";
      const daysOverdue = dueDateRaw
        ? Math.max(1, Math.ceil((Date.now() - new Date(dueDateRaw).getTime()) / 86400000))
        : 1;
      const itemFine = daysOverdue * DAILY_FINE_RATE;
      totalComputedFine += itemFine;

      return `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #fee2e2; color: #1e293b; font-weight: 600;">${title}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #fee2e2; color: #475569; font-family: monospace;">${barcode}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #fee2e2; color: #b91c1c; font-weight: 600;">${due}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #fee2e2; color: #b91c1c; font-weight: 700; text-align: center;">${daysOverdue} day(s)</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #fee2e2; color: #b91c1c; font-weight: 800; text-align: right;">₱${itemFine.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");

  const subject = `Overdue Notice: ₱${totalComputedFine.toFixed(2)} Computed Fine — Misamis Oriental Public Library`;
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #ef4444;">
        <h2 style="color: #4B3832; margin: 0;">📚 Misamis Oriental Public Library</h2>
        <p style="color: #8C7768; margin: 5px 0 0 0; font-size: 14px;">Official Overdue Material Notice &amp; Computed Fine Statement</p>
      </div>

      <div style="padding: 24px 8px; color: #334155;">
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px 20px; margin-bottom: 20px; border-radius: 6px;">
          <h3 style="color: #b91c1c; margin: 0 0 6px 0;">⏰ Overdue Borrowed Books Notice</h3>
          <p style="margin: 0; font-size: 14px; color: #7f1d1d;">
            Hello <strong>${userName || "Patron"}</strong>, our records indicate that you have <strong>${overdueLoans.length}</strong> overdue borrowed book(s) under account <strong>${recipientEmail}</strong>.
          </p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13.5px;">
          <thead>
            <tr style="background-color: #fef2f2;">
              <th style="padding: 10px 12px; text-align: left; color: #b91c1c;">Title</th>
              <th style="padding: 10px 12px; text-align: left; color: #b91c1c;">Barcode</th>
              <th style="padding: 10px 12px; text-align: left; color: #b91c1c;">Due Date</th>
              <th style="padding: 10px 12px; text-align: center; color: #b91c1c;">Overdue</th>
              <th style="padding: 10px 12px; text-align: right; color: #b91c1c;">Computed Fine (₱5/day)</th>
            </tr>
          </thead>
          <tbody>${loanRows}</tbody>
          <tfoot>
            <tr style="background-color: #fef2f2; font-size: 14.5px;">
              <td colspan="4" style="padding: 12px; text-align: right; font-weight: 800; color: #4B3832;">Total Computed Overdue Fine:</td>
              <td style="padding: 12px; text-align: right; font-weight: 900; color: #b91c1c; font-size: 16px;">₱${totalComputedFine.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <div style="background: #FAF7F2; border: 1px solid #DCC7AA; padding: 16px 20px; margin: 20px 0; border-radius: 8px;">
          <h4 style="margin: 0 0 6px 0; color: #4B3832;">📌 Overdue Policy &amp; Settlement Instructions:</h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #5D443B; line-height: 1.6;">
            <li>Overdue fine accrues at <strong>₱5.00 per calendar day</strong> per book under library regulations.</li>
            <li>Please return the book(s) immediately to the Circulation Desk (Capitol Compound, Velez St., Cagayan de Oro City).</li>
            <li>Operating hours: <strong>Monday – Friday, 8:00 AM – 5:00 PM</strong>.</li>
            <li>Settling your overdue balance will restore full borrowing privileges.</li>
          </ul>
        </div>

        <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
          If you have already returned these materials or believe there is a discrepancy, please contact us at <a href="mailto:misamisorientalcapitollib@gmail.com" style="color: #6F4E37;">misamisorientalcapitollib@gmail.com</a> or call (088) 856-1234.
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
    htmlContent,
    textContent: `Hello ${userName || "Patron"}, you have ${overdueLoans.length} overdue book(s). Total computed overdue fine: ₱${totalComputedFine.toFixed(2)} (accruing at ₱5.00/day). Please return immediately to Misamis Oriental Capitol Public Library.`
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
 * Send a 6-digit email verification code for patron registration
 */
async function sendPatronSignupCodeEmail(recipientEmail, userName, verificationCode) {
  const safeName = String(userName || "Patron").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]);
  const subject = "Your Library Sign-Up Verification Code";
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #6F4E37;">
        <h2 style="color: #4B3832; margin: 0;">Misamis Oriental Public Library</h2>
        <p style="color: #8C7768; margin: 6px 0 0 0; font-size: 13.5px;">Patron Account Verification</p>
      </div>
      <div style="padding: 24px 8px; color: #334155;">
        <h3 style="color: #4B3832; margin-top: 0;">Confirm your email address</h3>
        <p>Hello <strong>${safeName}</strong>,</p>
        <p>Enter this code on the sign-up page to confirm your email and create your library account:</p>
        <div style="background-color: #FAF7F2; border: 2px dashed #DCC7AA; padding: 18px; margin: 20px 0; text-align: center; border-radius: 8px;">
          <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4B3832;">${verificationCode}</span>
        </div>
        <p style="font-size: 13px; color: #64748b;">This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    toName: userName,
    subject,
    htmlContent,
    textContent: `Hello ${userName || "Patron"}, your library sign-up verification code is ${verificationCode}. It expires in 10 minutes.`
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
  sendPatronSignupCodeEmail,
  createEmailCampaign,
  getBrevoTransactionalApi,
  getBrevoCampaignApi,
  SENDER_EMAIL,
  SENDER_NAME
};
