const axios = require("axios");

const HTTPSMS_API_BASE = "https://api.httpsms.com/v1";
const SEMAPHORE_API_BASE = "https://api.semaphore.co/api/v4";
const TEXTBEE_API_BASE = "https://api.textbee.dev/api/v1";
const IPROGSMS_API_BASE = "https://www.iprogsms.com/api/v1";

/**
 * Normalizes Philippine mobile numbers to E.164 format (e.g., +639638463359)
 * Used by HttpSMS and international telco gateways.
 */
function toE164(rawNumber) {
  if (!rawNumber) return "";
  let digits = String(rawNumber).replace(/[^\d]/g, "");

  if (digits.startsWith("09") && digits.length === 11) {
    return "+63" + digits.slice(1);
  }
  if (digits.startsWith("639") && digits.length === 12) {
    return "+" + digits;
  }
  if (digits.startsWith("9") && digits.length === 10) {
    return "+63" + digits;
  }
  return digits.startsWith("+") ? digits : "+" + digits;
}

/**
 * Normalizes Philippine mobile numbers to standard local format (e.g., 09638463359)
 */
function normalizePhoneNumber(rawNumber) {
  if (!rawNumber) return "";
  let cleaned = String(rawNumber).replace(/[^\d+]/g, "");

  if (cleaned.startsWith("+63")) {
    cleaned = "0" + cleaned.slice(3);
  } else if (cleaned.startsWith("63") && cleaned.length === 12) {
    cleaned = "0" + cleaned.slice(2);
  } else if (cleaned.startsWith("9") && cleaned.length === 10) {
    cleaned = "0" + cleaned;
  }

  return cleaned;
}

/**
 * Determine active SMS Provider: 'iprogsms', 'httpsms', 'textbee', or 'semaphore'
 */
function getActiveProvider() {
  if (process.env.SMS_PROVIDER) {
    return process.env.SMS_PROVIDER.toLowerCase();
  }
  if (process.env.IPROGSMS_API_TOKEN || process.env.IPROGSMS_API_KEY) {
    return "iprogsms";
  }
  if (process.env.HTTPSMS_API_KEY) {
    return "httpsms";
  }
  if (process.env.TEXTBEE_API_KEY && process.env.TEXTBEE_DEVICE_ID) {
    return "textbee";
  }
  if (process.env.SEMAPHORE_API_KEY) {
    return "semaphore";
  }
  return "iprogsms";
}

/**
 * Check provider account / connection details
 */
async function getAccountInfo() {
  const provider = getActiveProvider();

  if (provider === "iprogsms" || provider === "iprog") {
    const apiToken = (process.env.IPROGSMS_API_TOKEN || process.env.IPROGSMS_API_KEY || "").trim();
    return {
      provider: "iProgSMS (https://www.iprogsms.com)",
      status: apiToken ? "Configured & Active" : "Missing IPROGSMS_API_TOKEN in .env",
      api_token: apiToken ? `${apiToken.substring(0, 8)}...` : "Not set",
      sms_provider_id: parseInt(process.env.IPROGSMS_PROVIDER || "0", 10),
      notes: "For Smart/TNT recipients, ensure an approved sender name is registered at https://www.iprogsms.com/sender-names/new"
    };
  }

  if (provider === "httpsms") {
    const apiKey = (process.env.HTTPSMS_API_KEY || "").trim();
    if (!apiKey) {
      throw new Error("HTTPSMS_API_KEY is not defined in .env");
    }

    const response = await axios.get(`${HTTPSMS_API_BASE}/users/me`, {
      headers: {
        "x-api-key": apiKey,
        Accept: "application/json"
      }
    });

    return {
      provider: "HttpSMS (Android Phone Gateway - Google Play)",
      user: response.data.data ? response.data.data.email : response.data,
      from_number: process.env.HTTPSMS_FROM_NUMBER || "Not set",
      cost_per_sms: "₱0.00 (Uses SIM Unlimited Text Promo)"
    };
  }

  if (provider === "textbee") {
    const apiKey = (process.env.TEXTBEE_API_KEY || "").trim();
    const deviceId = (process.env.TEXTBEE_DEVICE_ID || "").trim();
    return {
      provider: "Textbee (Android Phone Gateway)",
      status: apiKey && deviceId ? "Configured & Active" : "Missing credentials",
      cost_per_sms: "₱0.00 (Uses SIM Unlimited Text Promo)"
    };
  }

  // Semaphore
  const apikey = (process.env.SEMAPHORE_API_KEY || "").trim();
  if (!apikey) {
    throw new Error("SEMAPHORE_API_KEY is not defined in .env");
  }
  const response = await axios.get(`${SEMAPHORE_API_BASE}/account`, {
    params: { apikey }
  });
  return response.data;
}

/**
 * Send SMS using HttpSMS (Android app from Google Play Store)
 * Uses the phone's SIM card and unlimited text promo!
 */
async function sendViaHttpSms({ number, message }) {
  const apiKey = (process.env.HTTPSMS_API_KEY || "").trim();
  const fromNumber = (process.env.HTTPSMS_FROM_NUMBER || "").trim();

  if (!apiKey) {
    console.warn("⚠️  [HttpSMS Warning]: HTTPSMS_API_KEY is missing in .env.");
    return {
      success: false,
      mocked: true,
      message: "HTTPSMS_API_KEY not configured. Message logged to console.",
      recipient: number,
      body: message
    };
  }

  if (!fromNumber) {
    throw new Error(
      "HTTPSMS_FROM_NUMBER is missing in .env. Set your phone's SIM mobile number (e.g. 09638463359 or +639638463359)"
    );
  }

  const recipient = toE164(number);
  const sender = toE164(fromNumber);

  const payload = {
    content: String(message || "").trim(),
    from: sender,
    to: recipient
  };

  try {
    const response = await axios.post(`${HTTPSMS_API_BASE}/messages/send`, payload, {
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json"
      }
    });

    return {
      success: true,
      provider: "httpsms",
      data: response.data
    };
  } catch (error) {
    const errDetails = error.response ? error.response.data : error.message;
    console.error("❌ [HttpSMS Error]:", errDetails);
    throw new Error(
      typeof errDetails === "string" ? errDetails : JSON.stringify(errDetails)
    );
  }
}

/**
 * Send SMS using Textbee
 */
async function sendViaTextbee({ number, message }) {
  const apiKey = (process.env.TEXTBEE_API_KEY || "").trim();
  const deviceId = (process.env.TEXTBEE_DEVICE_ID || "").trim();

  if (!apiKey || !deviceId) {
    return {
      success: false,
      mocked: true,
      message: "Textbee not configured in .env."
    };
  }

  const rawList = Array.isArray(number) ? number : String(number).split(",");
  const recipients = rawList.map(normalizePhoneNumber).filter(Boolean);

  const payload = {
    recipients,
    message: String(message || "").trim()
  };

  try {
    const response = await axios.post(
      `${TEXTBEE_API_BASE}/gateway/devices/${deviceId}/sendSMS`,
      payload,
      {
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json"
        }
      }
    );
    return {
      success: true,
      provider: "textbee",
      data: response.data
    };
  } catch (error) {
    const errDetails = error.response ? error.response.data : error.message;
    throw new Error(
      typeof errDetails === "string" ? errDetails : JSON.stringify(errDetails)
    );
  }
}

/**
 * Send SMS using Semaphore API
 */
async function sendViaSemaphore({ number, message, sendername }) {
  const apikey = (process.env.SEMAPHORE_API_KEY || "").trim();
  if (!apikey) {
    return {
      success: false,
      mocked: true,
      message: "SEMAPHORE_API_KEY not configured in .env."
    };
  }

  const rawList = Array.isArray(number) ? number : String(number).split(",");
  const normalizedList = rawList.map(normalizePhoneNumber).filter(Boolean);

  let cleanMessage = String(message || "").trim();
  if (/^test\b/i.test(cleanMessage)) {
    cleanMessage = "Sample: " + cleanMessage.replace(/^test\b/i, "").trim();
  }

  const payload = {
    apikey,
    number: normalizedList.join(","),
    message: cleanMessage
  };

  const sender = sendername || process.env.SEMAPHORE_SENDER_NAME;
  if (sender) {
    payload.sendername = sender;
  }

  try {
    const response = await axios.post(`${SEMAPHORE_API_BASE}/messages`, payload);
    return {
      success: true,
      provider: "semaphore",
      data: response.data
    };
  } catch (error) {
    const errDetails = error.response ? error.response.data : error.message;
    throw new Error(
      typeof errDetails === "string" ? errDetails : JSON.stringify(errDetails)
    );
  }
}

/**
 * Send SMS using iProgSMS (https://www.iprogsms.com)
 */
async function sendViaIprogSms({ number, message, sendername }) {
  const apiToken = (process.env.IPROGSMS_API_TOKEN || process.env.IPROGSMS_API_KEY || "").trim();
  if (!apiToken) {
    return {
      success: false,
      mocked: true,
      message: "IPROGSMS_API_TOKEN not configured in .env."
    };
  }

  const rawList = Array.isArray(number) ? number : String(number).split(",");
  const normalizedList = rawList.map(normalizePhoneNumber).filter(Boolean);

  if (normalizedList.length === 0) {
    throw new Error("No valid phone number provided for iProgSMS.");
  }

  const smsProvider = parseInt(process.env.IPROGSMS_PROVIDER || "0", 10);
  const cleanMessage = String(message || "").trim();

  const results = [];
  for (const phone of normalizedList) {
    const payload = {
      api_token: apiToken,
      phone_number: phone,
      message: cleanMessage,
      sms_provider: isNaN(smsProvider) ? 0 : smsProvider
    };

    if (sendername || process.env.IPROGSMS_SENDER_NAME) {
      payload.sender_name = sendername || process.env.IPROGSMS_SENDER_NAME;
    }

    try {
      const response = await axios.post(`${IPROGSMS_API_BASE}/sms_messages`, payload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        }
      });

      // iProgSMS returns status: 500 inside 200 HTTP if telco blocks (e.g. Smart/TNT shared sender name)
      if (response.data && response.data.status && response.data.status !== 200) {
        const errText = Array.isArray(response.data.message)
          ? response.data.message.join(" ")
          : response.data.message || "Failed to send SMS via iProgSMS";
        throw new Error(errText);
      }

      results.push(response.data);
    } catch (error) {
      const errDetails = error.response ? error.response.data : error.message;
      let parsedMsg = errDetails;
      if (typeof errDetails === "object") {
        if (errDetails && Array.isArray(errDetails.message)) {
          parsedMsg = errDetails.message.join(" ");
        } else if (errDetails && errDetails.message) {
          parsedMsg = errDetails.message;
        } else {
          parsedMsg = JSON.stringify(errDetails);
        }
      }
      throw new Error(parsedMsg);
    }
  }

  return {
    success: true,
    provider: "iprogsms",
    data: results.length === 1 ? results[0] : results
  };
}

/**
 * Universal Send SMS Function
 * Automatically routes to the configured provider (iProgSMS, HttpSMS, Textbee, or Semaphore)
 */
async function sendSms({ number, message, sendername }) {
  const provider = getActiveProvider();

  if (provider === "iprogsms" || provider === "iprog") {
    return await sendViaIprogSms({ number, message, sendername });
  }

  if (provider === "httpsms") {
    return await sendViaHttpSms({ number, message });
  }

  if (provider === "textbee") {
    return await sendViaTextbee({ number, message });
  }

  return await sendViaSemaphore({ number, message, sendername });
}

/**
 * Universal Send OTP Function
 */
async function sendOtpSms({ number, message, code }) {
  const provider = getActiveProvider();
  const otpCode = code || Math.floor(100000 + Math.random() * 900000);
  const otpMessage = (
    message || "Capitol Public Library: Your verification code is: {otp}. Valid for 5 minutes."
  ).replace("{otp}", otpCode);

  if (provider === "iprogsms" || provider === "iprog" || provider === "httpsms" || provider === "textbee") {
    const result = await sendSms({ number, message: otpMessage });
    return {
      ...result,
      code: otpCode
    };
  }

  // Semaphore dedicated OTP route
  const apikey = (process.env.SEMAPHORE_API_KEY || "").trim();
  if (!apikey) {
    return {
      success: false,
      mocked: true,
      code: otpCode,
      message: "SEMAPHORE_API_KEY not configured."
    };
  }

  try {
    const response = await axios.post(`${SEMAPHORE_API_BASE}/otp`, {
      apikey,
      number: normalizePhoneNumber(number),
      message: message || "Capitol Public Library: Your verification code is: {otp}. Valid for 5 minutes.",
      code: otpCode
    });
    return {
      success: true,
      provider: "semaphore",
      code: otpCode,
      data: response.data
    };
  } catch (error) {
    const errDetails = error.response ? error.response.data : error.message;
    throw new Error(
      typeof errDetails === "string" ? errDetails : JSON.stringify(errDetails)
    );
  }
}

module.exports = {
  toE164,
  normalizePhoneNumber,
  getActiveProvider,
  getAccountInfo,
  sendSms,
  sendOtpSms,
  sendViaIprogSms
};
