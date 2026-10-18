const express = require("express");
const { getAccountInfo, sendSms, sendOtpSms } = require("../utils/sms");
const { checkAndSendDueReminders } = require("../services/reminderService");

const router = express.Router();

/**
 * POST /api/sms/run-reminders
 * Trigger a scan for 2-days-before due dates and overdue books
 */
router.post("/run-reminders", async (req, res) => {
  try {
    const summary = await checkAndSendDueReminders();
    res.json({
      success: true,
      message: "Automated SMS reminder check completed",
      summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to run reminder scan",
      error: error.message
    });
  }
});

/**
 * GET /api/sms/account
 * Check your SMS provider account status and settings
 */
router.get("/account", async (req, res) => {

  try {
    const account = await getAccountInfo();
    res.json(account);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch Semaphore account info",
      error: error.message
    });
  }
});

/**
 * POST /api/sms/send-test
 * Send a test SMS to any mobile number (e.g. { number: "09171234567", message: "Hello!" })
 */
router.post("/send-test", async (req, res) => {
  try {
    const { number, message } = req.body;

    if (!number) {
      return res.status(400).json({ message: "Mobile number is required (e.g. 09171234567)" });
    }

    const testMessage =
      message ||
      "MOPL Alert: This is a sample reminder from Misamis Oriental Provincial Capitol Public Library.";

    const result = await sendSms({
      number,
      message: testMessage
    });

    res.json({
      success: true,
      message: "Test SMS sent successfully via Semaphore",
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send SMS",
      error: error.message
    });
  }
});

/**
 * POST /api/sms/send-otp
 * Send an OTP code to a mobile number for verification
 */
router.post("/send-otp", async (req, res) => {
  try {
    const { number, code } = req.body;

    if (!number) {
      return res.status(400).json({ message: "Mobile number is required" });
    }

    const otpCode = code || Math.floor(100000 + Math.random() * 900000);

    const result = await sendOtpSms({
      number,
      message: "Misamis Oriental Capitol Library: Your verification code is: {otp}. Valid for 5 minutes.",
      code: otpCode
    });

    res.json({
      success: true,
      message: "OTP sent successfully",
      code: otpCode, // Helpful for development/testing
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error.message
    });
  }
});

module.exports = router;
