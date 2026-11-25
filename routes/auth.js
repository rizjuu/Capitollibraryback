const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createHmac, randomInt, randomUUID, timingSafeEqual } = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const { supabase } = require("../db/supabase");
const { formatUser } = require("../utils/formatters");
const {
  sendPatronWelcomeEmail,
  sendPasswordResetEmail,
  sendPatronSignupCodeEmail
} = require("../utils/email");
const { protect } = require("../middleware/auth");
const { generateNextPatronId } = require("../utils/patronId");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function isMissingColumnError(error) {
  if (!error) return false;
  const code = String(error.code || "");
  const msg = String(error.message || "").toLowerCase();
  const details = String(error.details || "").toLowerCase();
  return (
    code === "42703" ||
    code === "PGRST204" ||
    msg.includes("schema cache") ||
    msg.includes("does not exist") ||
    details.includes("does not exist") ||
    msg.includes("approval_status") ||
    msg.includes("id_type") ||
    msg.includes("id_number")
  );
}

function getSignupVerificationStorageError(error) {
  const mentionsVerificationTable = String(error?.message || "")
    .includes("patron_signup_verifications");
  if (error?.code === "PGRST205" || error?.code === "42P01") {
    return "Email verification is not set up in the library database yet. Run migrations/04_add_patron_signup_email_verification.sql in Supabase.";
  }
  if (mentionsVerificationTable && error?.code === "42501") {
    return "The library database service role is not configured to access signup verification. Set SUPABASE_SERVICE_ROLE_KEY on the backend.";
  }
  return null;
}

router.get("/test", (req, res) => {
  res.json({
    message: "Auth route is working (Supabase)"
  });
});

// ================================
// UNIFIED LOGIN HELPER
// ================================
async function authenticateUser({ username, password, allowedRoles = null, portalLabel = "" }) {
  if (!username || !password) {
    return { status: 400, data: { message: "Username/email and password are required" } };
  }

  const cleanIdentifier = username.trim().toLowerCase();

  // Find user by username or email
  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .or(`username.ilike.${cleanIdentifier},email.ilike.${cleanIdentifier}`)
    .limit(1);

  if (error) {
    console.error("Supabase user search error:", error);
    return { status: 500, data: { message: "Database query error", error: error.message } };
  }

  const user = users && users.length > 0 ? users[0] : null;

  if (!user) {
    return { status: 401, data: { message: "Invalid username or password" } };
  }

  if (user.status === "disabled") {
    return {
      status: 403,
      data: { message: "Your account has been disabled by administration. Please contact the library." }
    };
  }

  // Check portal role restriction if specified
  if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
    // Return standard invalid credentials response to prevent user enumeration
    return {
      status: 401,
      data: { message: "Invalid username or password" }
    };
  }

  if (!user.password) {
    return {
      status: 401,
      data: { message: "No password set for this account. Please use Google sign-in or contact the administrator." }
    };
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return { status: 401, data: { message: "Invalid username or password" } };
  }

  if (!process.env.JWT_SECRET) {
    return { status: 500, data: { message: "JWT_SECRET is not configured" } };
  }

  // Single Session Enforcement for patron and staff (admin is exempt)
  const singleSessionRoles = ["patron", "staff"];
  const sessionId = singleSessionRoles.includes(user.role) ? randomUUID() : undefined;

  if (sessionId) {
    await supabase
      .from("users")
      .update({ current_session_id: sessionId, updated_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.name,
      ...(sessionId && { sessionId })
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    status: 200,
    data: {
      message: "Login successful",
      token,
      user: formatUser(user)
    }
  };
}

// Standard Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await authenticateUser({ username, password });
    return res.status(result.status).json(result.data);
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Staff & Admin Portal Dedicated Login
router.post("/admin-login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await authenticateUser({
      username,
      password,
      allowedRoles: ["admin", "staff"],
      portalLabel: "Staff & Admin Portal"
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Patron Portal Dedicated Login
router.post("/patron-login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await authenticateUser({
      username,
      password,
      allowedRoles: ["patron"],
      portalLabel: "Patron Portal"
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    console.error("PATRON LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Send an email verification code before completing patron registration
router.post("/patron-register", async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body || {};
    const cleanFirstName = typeof firstName === "string" ? firstName.trim() : "";
    const cleanLastName = typeof lastName === "string" ? lastName.trim() : "";
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!cleanFirstName || cleanFirstName.length > 80 || !cleanLastName || cleanLastName.length > 80) {
      return res.status(400).json({ message: "Please enter your first and last name." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail) || cleanEmail.length > 254) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Account registration is unavailable right now." });
    }

    const { error: expiredCodesError } = await supabase
      .from("patron_signup_verifications")
      .delete()
      .lte("expires_at", new Date().toISOString());
    if (expiredCodesError) {
      throw expiredCodesError;
    }

    const { data: existingUser, error: lookupError } = await supabase
      .from("users")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (lookupError) {
      throw lookupError;
    }

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists. Please sign in instead."
      });
    }

    const { data: pendingSignup, error: pendingLookupError } = await supabase
      .from("patron_signup_verifications")
      .select("last_sent_at")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (pendingLookupError) {
      throw pendingLookupError;
    }

    if (pendingSignup && Date.now() - new Date(pendingSignup.last_sent_at).getTime() < 60_000) {
      return res.status(429).json({
        message: "Please wait a minute before requesting another verification code."
      });
    }

    const verificationCode = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const verificationCodeHash = createHmac("sha256", process.env.JWT_SECRET)
      .update(`${cleanEmail}:${verificationCode}`)
      .digest("hex");
    const now = new Date();
    const { error: saveError } = await supabase
      .from("patron_signup_verifications")
      .upsert({
        email: cleanEmail,
        first_name: cleanFirstName,
        last_name: cleanLastName,
        verification_code_hash: verificationCodeHash,
        expires_at: new Date(now.getTime() + 10 * 60_000).toISOString(),
        attempts: 0,
        last_sent_at: now.toISOString()
      }, { onConflict: "email" });

    if (saveError) {
      throw saveError;
    }

    const fullName = `${cleanFirstName} ${cleanLastName}`;
    const emailResult = await sendPatronSignupCodeEmail(cleanEmail, fullName, verificationCode);
    if (!emailResult.success) {
      const { error: cleanupError } = await supabase
        .from("patron_signup_verifications")
        .delete()
        .eq("email", cleanEmail)
        .eq("verification_code_hash", verificationCodeHash);
      if (cleanupError) {
        console.error("Could not clear undelivered patron verification code:", cleanupError);
      }

      return res.status(503).json({
        message: "We could not send your verification email. Please try again later."
      });
    }

    return res.json({
      message: "Verification code sent. Check your email and enter the 6-digit code."
    });
  } catch (error) {
    console.error("PATRON REGISTRATION CODE ERROR:", error);
    const setupMessage = getSignupVerificationStorageError(error);
    if (setupMessage) {
      return res.status(503).json({ message: setupMessage });
    }
    return res.status(500).json({ message: "Unable to send a verification code. Please try again." });
  }
});

// Verify the signup email and create the patron account
router.post("/patron-register/verify", async (req, res) => {
  try {
    const { email, code, password } = req.body || {};
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const cleanCode = typeof code === "string" ? code.trim() : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail) || !/^\d{6}$/.test(cleanCode)) {
      return res.status(400).json({ message: "Enter a valid email address and 6-digit verification code." });
    }

    if (typeof password !== "string" || password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and no more than 72 bytes."
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Account registration is unavailable right now." });
    }

    const { data: pendingSignup, error: pendingError } = await supabase
      .from("patron_signup_verifications")
      .select("first_name, last_name, verification_code_hash, expires_at, attempts")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (pendingError) {
      throw pendingError;
    }

    if (!pendingSignup) {
      return res.status(400).json({
        message: "That verification code is invalid or expired. Request a new code and try again."
      });
    }

    if (new Date(pendingSignup.expires_at).getTime() <= Date.now()) {
      const { error: deleteError } = await supabase
        .from("patron_signup_verifications")
        .delete()
        .eq("email", cleanEmail);
      if (deleteError) {
        throw deleteError;
      }
      return res.status(400).json({
        message: "That verification code is invalid or expired. Request a new code and try again."
      });
    }

    if (pendingSignup.attempts >= 5) {
      const { error: deleteError } = await supabase
        .from("patron_signup_verifications")
        .delete()
        .eq("email", cleanEmail);
      if (deleteError) {
        throw deleteError;
      }
      return res.status(429).json({
        message: "Too many incorrect codes. Request a new verification code to continue."
      });
    }

    const submittedHash = createHmac("sha256", process.env.JWT_SECRET)
      .update(`${cleanEmail}:${cleanCode}`)
      .digest();
    const storedHash = Buffer.from(pendingSignup.verification_code_hash, "hex");
    const codeMatches = storedHash.length === submittedHash.length &&
      timingSafeEqual(storedHash, submittedHash);

    if (!codeMatches) {
      const attempts = pendingSignup.attempts + 1;
      if (attempts >= 5) {
        const { error: deleteError } = await supabase
          .from("patron_signup_verifications")
          .delete()
          .eq("email", cleanEmail);
        if (deleteError) {
          throw deleteError;
        }
        return res.status(429).json({
          message: "Too many incorrect codes. Request a new verification code to continue."
        });
      }

      const { error: attemptsError } = await supabase
        .from("patron_signup_verifications")
        .update({ attempts })
        .eq("email", cleanEmail);
      if (attemptsError) {
        throw attemptsError;
      }

      return res.status(400).json({ message: "Incorrect verification code. Please try again." });
    }

    const { data: existingUser, error: lookupError } = await supabase
      .from("users")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (lookupError) {
      throw lookupError;
    }

    if (existingUser) {
      const { error: deleteError } = await supabase
        .from("patron_signup_verifications")
        .delete()
        .eq("email", cleanEmail);
      if (deleteError) {
        throw deleteError;
      }
      return res.status(409).json({
        message: "An account with this email already exists. Please sign in instead."
      });
    }

    const username = await generateNextPatronId(supabase);
    const fullName = `${pendingSignup.first_name} ${pendingSignup.last_name}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    const {
      phone,
      address,
      patronType,
      school,
      yearLevel,
      age,
      idType,
      idNumber,
      idPhoto,
      agreementAccepted
    } = req.body || {};

    const patronData = {
      username,
      email: cleanEmail,
      password: hashedPassword,
      role: "patron",
      name: fullName,
      first_name: pendingSignup.first_name,
      last_name: pendingSignup.last_name,
      status: "active",
      approval_status: "pending", // Requires System Admin approval to ensure patron is from CDO
      id_type: typeof idType === "string" ? idType.trim() : "national_id",
      id_number: typeof idNumber === "string" ? idNumber.trim() : "",
      id_photo: typeof idPhoto === "string" ? idPhoto.trim() : "",
      address: typeof address === "string" ? address.trim() : "",
      patron_type: String(patronType).toLowerCase() === "student" ? "student" : "resident",
      school: typeof school === "string" ? school.trim() : "",
      year_level: typeof yearLevel === "string" ? yearLevel.trim() : "",
      age: age ? parseInt(age, 10) || null : null,
      phone: typeof phone === "string" ? phone.trim() : "",
      agreement_accepted: Boolean(agreementAccepted !== false),
      is_profile_completed: Boolean(address && phone)
    };

    let { data: user, error: insertError } = await supabase
      .from("users")
      .insert(patronData)
      .select()
      .maybeSingle();

    if (insertError && isMissingColumnError(insertError)) {
      // Fallback if extended ID verification columns not yet present in Supabase table
      const fallbackData = {
        username,
        email: cleanEmail,
        password: hashedPassword,
        role: "patron",
        name: fullName,
        first_name: pendingSignup.first_name,
        last_name: pendingSignup.last_name,
        status: "active"
      };

      const fallbackRes = await supabase
        .from("users")
        .insert(fallbackData)
        .select()
        .single();

      if (fallbackRes.error) {
        throw fallbackRes.error;
      }

      user = {
        ...fallbackRes.data,
        ...patronData
      };
    } else if (insertError) {
      if (insertError.code === "23505") {
        return res.status(409).json({
          message: "An account with this email already exists. Please sign in instead."
        });
      }
      throw insertError;
    }

    const { error: deleteError } = await supabase
      .from("patron_signup_verifications")
      .delete()
      .eq("email", cleanEmail);
    if (deleteError) {
      console.error("Could not clear verified patron signup data:", deleteError);
    }

    // Single session: new patron registration always gets a session ID
    const sessionId = randomUUID();
    await supabase
      .from("users")
      .update({ current_session_id: sessionId, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name,
        sessionId
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    sendPatronWelcomeEmail(user.email, user.name).catch((error) => {
      console.error("[Welcome Email Warning]:", error.message);
    });

    return res.status(201).json({
      message: "Patron account created successfully",
      token,
      user: formatUser(user)
    });
  } catch (error) {
    console.error("PATRON REGISTRATION VERIFICATION ERROR:", error);
    const setupMessage = getSignupVerificationStorageError(error);
    if (setupMessage) {
      return res.status(503).json({ message: setupMessage });
    }
    return res.status(500).json({ message: "Unable to verify your email and create the account. Please try again." });
  }
});

// ================================
// FORGOT PASSWORD - REQUEST RESET CODE
// ================================
router.post("/forgot-password", async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({
        message: "Please enter your username or registered email address"
      });
    }

    const clean = identifier.trim().toLowerCase();
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .or(`username.ilike.${clean},email.ilike.${clean}`)
      .limit(1);

    if (error || !users || users.length === 0) {
      return res.status(404).json({
        message: "No account found matching that username or email address"
      });
    }

    const user = users[0];

    if (user.status === "disabled") {
      return res.status(403).json({
        message: "This account has been disabled. Please contact library administration."
      });
    }

    // 2-hour rate limit: prevent spamming forgot password requests
    const RESET_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours
    if (user.reset_password_last_requested) {
      const lastRequested = new Date(user.reset_password_last_requested).getTime();
      const elapsed = Date.now() - lastRequested;
      if (elapsed < RESET_COOLDOWN_MS) {
        const remainingMs = RESET_COOLDOWN_MS - elapsed;
        const remainingMins = Math.ceil(remainingMs / 60000);
        const hours = Math.floor(remainingMins / 60);
        const mins = remainingMins % 60;
        const timeLeft = hours > 0
          ? `${hours} hour${hours > 1 ? "s" : ""}${mins > 0 ? ` and ${mins} minute${mins > 1 ? "s" : ""}` : ""}`
          : `${mins} minute${mins > 1 ? "s" : ""}`;
        return res.status(429).json({
          message: `You can only request a password reset once every 2 hours. Please try again in ${timeLeft}.`,
          retryAfterMs: remainingMs
        });
      }
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: updateError } = await supabase
      .from("users")
      .update({
        reset_password_code: resetCode,
        reset_password_expires: expiresAt,
        reset_password_last_requested: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (updateError) {
      throw updateError;
    }

    if (user.email && user.email.includes("@")) {
      await sendPasswordResetEmail(user.email, user.name, resetCode);
      const maskedEmail = user.email.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => `${a}${"*".repeat(Math.max(1, b.length - 1))}${b.slice(-1)}${c}`);

      return res.json({
        message: `A 6-digit verification code has been sent to ${maskedEmail}`,
        emailSent: true,
        maskedEmail
      });
    } else {
      return res.json({
        message: "A verification code has been generated for your account.",
        emailSent: false,
        devCode: resetCode
      });
    }
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    res.status(500).json({
      message: "An error occurred while processing your request",
      error: error.message
    });
  }
});

// ================================
// RESET PASSWORD - VERIFY & UPDATE
// ================================
router.post("/reset-password", async (req, res) => {
  try {
    const { identifier, code, newPassword } = req.body;

    if (!identifier || !code || !newPassword) {
      return res.status(400).json({
        message: "Username/email, verification code, and new password are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long"
      });
    }

    const clean = identifier.trim().toLowerCase();
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .or(`username.ilike.${clean},email.ilike.${clean}`)
      .limit(1);

    if (error || !users || users.length === 0) {
      return res.status(404).json({
        message: "No account found matching that username or email address"
      });
    }

    const user = users[0];

    if (!user.reset_password_code || !user.reset_password_expires) {
      return res.status(400).json({
        message: "No password reset code requested for this account"
      });
    }

    if (new Date() > new Date(user.reset_password_expires)) {
      return res.status(400).json({
        message: "The verification code has expired. Please request a new one."
      });
    }

    if (user.reset_password_code.trim() !== String(code).trim()) {
      return res.status(400).json({
        message: "Invalid verification code. Please check and try again."
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password: hashedPassword,
        reset_password_code: null,
        reset_password_expires: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (updateError) {
      throw updateError;
    }

    res.json({
      message: "Your password has been successfully reset! You can now log in."
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    res.status(500).json({
      message: "Failed to reset password",
      error: error.message
    });
  }
});

// ================================
// PATRON GOOGLE OAUTH LOGIN
// ================================
router.post("/google-login", async (req, res) => {
  try {
    const {
      credential,
      patronType,
      school,
      yearLevel,
      address,
      idType,
      idNumber,
      idPhoto,
      agreementAccepted,
      phone
    } = req.body || {};

    if (!credential) {
      return res.status(400).json({
        message: "Google credential is required"
      });
    }

    let payload = null;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.warn("[Google Auth Warning] Local verifyIdToken failed, falling back to Google tokeninfo:", verifyErr.message);
      // Fallback: Verify via Google's tokeninfo endpoint to tolerate local system clock skew
      try {
        const tokenInfoRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
        );
        const tokenInfoData = await tokenInfoRes.json();
        if (tokenInfoData.error || !tokenInfoData.email) {
          throw new Error(tokenInfoData.error_description || tokenInfoData.error || "Invalid Google ID token");
        }
        if (tokenInfoData.aud !== process.env.GOOGLE_CLIENT_ID) {
          throw new Error("Google token audience mismatch");
        }
        payload = tokenInfoData;
      } catch (fallbackErr) {
        throw new Error(verifyErr.message || fallbackErr.message);
      }
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({
        message: "Could not retrieve email from Google account"
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find existing user by googleId or email
    const { data: existingUsers, error: findError } = await supabase
      .from("users")
      .select("*")
      .or(`google_id.eq.${googleId},email.ilike.${cleanEmail}`)
      .limit(1);

    if (findError) {
      throw findError;
    }

    let user = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;

    if (user) {
      if (user.status === "disabled") {
        return res.status(403).json({
          message: "Your patron account has been disabled by administration. Please contact the library."
        });
      }

      if (user.role && user.role !== "patron") {
        return res.status(403).json({
          message: `This Google account is registered as a library ${user.role}. Please log in through the Staff/Admin Portal.`
        });
      }
    }

    // Check if ID verification & CDO residency is required
    // A patron requires verification if:
    // 1) New patron (no user in DB yet), OR
    // 2) Existing patron who hasn't completed ID verification (no id_number)
    const hasCompletedVerification = Boolean(
      user && (user.id_number || user.idNumber || (user.address && user.approval_status === "approved"))
    );

    const isSubmittingVerification = Boolean(idNumber || address || agreementAccepted !== undefined);

    // If new patron or unverified patron hasn't submitted ID & residency details yet:
    if (!hasCompletedVerification && !isSubmittingVerification) {
      return res.json({
        requiresVerification: true,
        googleUser: {
          googleId,
          email: cleanEmail,
          name: name || cleanEmail.split("@")[0],
          avatar: picture || "",
          credential
        },
        message: "Please complete your Cagayan de Oro residency and ID verification to activate your patron account."
      });
    }

    // If submitting verification details, validate required fields:
    if (isSubmittingVerification && !hasCompletedVerification) {
      if (!address || !String(address).trim()) {
        return res.status(400).json({
          message: "Please enter your Cagayan de Oro City address."
        });
      }
      if (String(patronType).toLowerCase() === "student" && !school) {
        return res.status(400).json({
          message: "Please specify your school in Cagayan de Oro City."
        });
      }
      if (!idNumber || !String(idNumber).trim()) {
        return res.status(400).json({
          message: "Please enter your valid National ID or Student ID number."
        });
      }
      if (!agreementAccepted) {
        return res.status(400).json({
          message: "You must review and accept the Library Policies & Book Borrowing Agreement."
        });
      }
    }

    if (user && hasCompletedVerification) {
      const updates = { updated_at: new Date().toISOString() };
      if (!user.google_id) updates.google_id = googleId;
      if (picture && !user.avatar) updates.avatar = picture;
      if (name && (!user.name || user.name === cleanEmail.split("@")[0])) updates.name = name;
      if (user.role === "patron" && !user.username) {
        updates.username = await generateNextPatronId(supabase);
      }

      const { data: updated, error: updateErr } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (!updateErr && updated) {
        user = updated;
      }
    } else if (user) {
      // Existing patron completing their CDO residency & ID verification
      const updates = {
        updated_at: new Date().toISOString(),
        google_id: googleId,
        avatar: picture || user.avatar || "",
        phone: typeof phone === "string" ? phone.trim() : (user.phone || ""),
        address: typeof address === "string" ? address.trim() : (user.address || ""),
        patron_type: String(patronType).toLowerCase() === "student" ? "student" : "resident",
        school: typeof school === "string" ? school.trim() : (user.school || ""),
        year_level: typeof yearLevel === "string" ? yearLevel.trim() : (user.year_level || ""),
        id_type: typeof idType === "string" ? idType.trim() : (user.id_type || "national_id"),
        id_number: typeof idNumber === "string" ? idNumber.trim() : (user.id_number || ""),
        id_photo: typeof idPhoto === "string" ? idPhoto.trim() : (user.id_photo || ""),
        approval_status: "pending",
        agreement_accepted: Boolean(agreementAccepted !== false),
        is_profile_completed: Boolean(address)
      };

      let { data: updated, error: updateErr } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id)
        .select()
        .maybeSingle();

      if (updateErr && isMissingColumnError(updateErr)) {
        // Fallback: strip extended columns not yet present in DB
        const fallbackUpdates = {
          updated_at: new Date().toISOString(),
          google_id: googleId,
          avatar: picture || user.avatar || "",
          phone: typeof phone === "string" ? phone.trim() : (user.phone || ""),
          address: typeof address === "string" ? address.trim() : (user.address || "")
        };
        const fbRes = await supabase.from("users").update(fallbackUpdates).eq("id", user.id).select().single();
        if (fbRes.error) {
          if (isMissingColumnError(fbRes.error)) {
            const minUpdates = { updated_at: new Date().toISOString() };
            const minRes = await supabase.from("users").update(minUpdates).eq("id", user.id).select().single();
            if (minRes.error) throw minRes.error;
            user = { ...minRes.data, ...updates };
          } else {
            throw fbRes.error;
          }
        } else {
          user = { ...fbRes.data, ...updates };
        }
      } else if (updateErr) {
        throw updateErr;
      } else if (updated) {
        user = updated;
      }
    } else {
      // Create new patron with sequential Patron ID, Google info, and CDO ID verification details
      const patronId = await generateNextPatronId(supabase);
      const newGooglePatronData = {
        username: patronId,
        email: cleanEmail,
        google_id: googleId,
        avatar: picture || "",
        role: "patron",
        name: name || cleanEmail.split("@")[0],
        status: "active",
        phone: typeof phone === "string" ? phone.trim() : "",
        address: typeof address === "string" ? address.trim() : "",
        patron_type: String(patronType).toLowerCase() === "student" ? "student" : "resident",
        school: typeof school === "string" ? school.trim() : "",
        year_level: typeof yearLevel === "string" ? yearLevel.trim() : "",
        id_type: typeof idType === "string" ? idType.trim() : "national_id",
        id_number: typeof idNumber === "string" ? idNumber.trim() : "",
        id_photo: typeof idPhoto === "string" ? idPhoto.trim() : "",
        approval_status: "pending",
        agreement_accepted: Boolean(agreementAccepted !== false),
        is_profile_completed: Boolean(address)
      };

      let { data: newUser, error: insertErr } = await supabase
        .from("users")
        .insert(newGooglePatronData)
        .select()
        .maybeSingle();

      if (insertErr && isMissingColumnError(insertErr)) {
        const fallbackData = {
          username: patronId,
          email: cleanEmail,
          google_id: googleId,
          avatar: picture || "",
          role: "patron",
          name: name || cleanEmail.split("@")[0],
          status: "active",
          address: typeof address === "string" ? address.trim() : "",
          phone: typeof phone === "string" ? phone.trim() : ""
        };
        const fbRes = await supabase.from("users").insert(fallbackData).select().single();
        if (fbRes.error) {
          if (isMissingColumnError(fbRes.error)) {
            const minData = {
              username: patronId,
              email: cleanEmail,
              google_id: googleId,
              avatar: picture || "",
              role: "patron",
              name: name || cleanEmail.split("@")[0],
              status: "active"
            };
            const minRes = await supabase.from("users").insert(minData).select().single();
            if (minRes.error) throw minRes.error;
            newUser = { ...minRes.data, ...newGooglePatronData };
          } else {
            throw fbRes.error;
          }
        } else {
          newUser = { ...fbRes.data, ...newGooglePatronData };
        }
      } else if (insertErr) {
        throw insertErr;
      }

      user = newUser;

      sendPatronWelcomeEmail(user.email, user.name).catch((err) => {
        console.error("[Welcome Email Warning]:", err.message);
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "JWT_SECRET is not configured"
      });
    }

    // Single session enforcement for patron Google login
    const sessionId = randomUUID();
    await supabase
      .from("users")
      .update({ current_session_id: sessionId, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: "patron",
        name: user.name,
        sessionId
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: formatUser(user)
    });
  } catch (error) {
    console.error("GOOGLE LOGIN ERROR:", error);
    res.status(500).json({
      message: "Google authentication failed",
      error: error.message
    });
  }
});

// ================================
// GET CURRENT USER PROFILE (/me)
// ================================
router.get("/me", protect, async (req, res) => {
  try {
    const user = req.user;

    if (user.role === "patron" && !user.username) {
      const patronId = await generateNextPatronId(supabase);
      await supabase.from("users").update({ username: patronId }).eq("id", user.id);
      user.username = patronId;
    }

    let firstName = user.firstName || "";
    let lastName = user.lastName || "";
    if (!firstName && !lastName && user.name) {
      const parts = user.name.trim().split(/\s+/);
      firstName = parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0];
      lastName = parts.length > 1 ? parts[parts.length - 1] : "";
    }

    res.json({
      user: {
        id: user.id,
        _id: user.id,
        username: user.username,
        patronId: user.username,
        email: user.email,
        role: user.role,
        name: user.name,
        firstName,
        lastName,
        phone: user.phone || "",
        address: user.address || "",
        patronType: user.patronType || user.patron_type || "resident",
        school: user.school || "",
        yearLevel: user.yearLevel || user.year_level || "",
        age: user.age || "",
        isProfileCompleted: Boolean(user.isProfileCompleted || user.is_profile_completed),
        avatar: user.avatar,
        status: user.status || "active",
        approvalStatus: user.approvalStatus || user.approval_status || (user.status === "active" ? "approved" : "pending"),
        idType: user.idType || user.id_type || "",
        idNumber: user.idNumber || user.id_number || "",
        idPhoto: user.idPhoto || user.id_photo || "",
        rejectionReason: user.rejectionReason || user.rejection_reason || "",
        agreementAccepted: Boolean(user.agreementAccepted || user.agreement_accepted)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user profile" });
  }
});

// ================================
// UPDATE CURRENT USER PROFILE
// ================================
router.patch("/me", protect, async (req, res) => {
  try {
    let {
      name,
      firstName,
      lastName,
      email,
      phone,
      address,
      patronType,
      school,
      yearLevel,
      age,
      isProfileCompleted,
      idType,
      idNumber,
      idPhoto,
      agreementAccepted
    } = req.body;

    if (!name && (firstName || lastName)) {
      name = `${firstName || ""} ${lastName || ""}`.trim();
    } else if (name && (!firstName && !lastName)) {
      const parts = name.trim().split(/\s+/);
      firstName = parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0];
      lastName = parts.length > 1 ? parts[parts.length - 1] : "";
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "First name and last name are required" });
    }
    if (email !== undefined && (!email.trim() || !email.includes("@"))) {
      return res.status(400).json({ message: "A valid email address is required" });
    }

    const currentUserId = req.user.id;
    const cleanEmail = email === undefined ? req.user.email : email.trim().toLowerCase();

    if (cleanEmail && cleanEmail !== req.user.email) {
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", cleanEmail)
        .neq("id", currentUserId)
        .maybeSingle();

      if (existingUser) {
        return res.status(409).json({ message: "That email address is already in use" });
      }
    }

    const updates = {
      name: name.trim(),
      email: cleanEmail,
      updated_at: new Date().toISOString()
    };
    if (firstName !== undefined) updates.first_name = String(firstName).trim();
    if (lastName !== undefined) updates.last_name = String(lastName).trim();
    if (phone !== undefined) updates.phone = String(phone).trim();
    if (address !== undefined) updates.address = String(address).trim();
    if (patronType !== undefined && !req.user.is_profile_completed) updates.patron_type = String(patronType).toLowerCase() === "student" ? "student" : "resident";
    if (school !== undefined) updates.school = String(school).trim();
    if (yearLevel !== undefined) updates.year_level = String(yearLevel).trim();
    if (age !== undefined && age !== "") updates.age = parseInt(age, 10) || null;
    if (isProfileCompleted !== undefined) updates.is_profile_completed = Boolean(isProfileCompleted);
    if (idType !== undefined) updates.id_type = String(idType).trim();
    if (idNumber !== undefined) updates.id_number = String(idNumber).trim();
    if (idPhoto !== undefined) updates.id_photo = String(idPhoto).trim();
    if (agreementAccepted !== undefined) updates.agreement_accepted = Boolean(agreementAccepted);

    let { data: updated, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", currentUserId)
      .select()
      .maybeSingle();

    // If new columns are not yet created in Supabase (code 42703), retry with basic fields
    if (error && error.code === "42703") {
      console.warn("Notice: Extended patron columns not yet present in Supabase table. Falling back to core columns.");
      const coreUpdates = {
        name: updates.name,
        email: updates.email,
        updated_at: updates.updated_at
      };
      if (updates.first_name !== undefined) coreUpdates.first_name = updates.first_name;
      if (updates.last_name !== undefined) coreUpdates.last_name = updates.last_name;
      if (updates.phone !== undefined) coreUpdates.phone = updates.phone;

      const fallback = await supabase
        .from("users")
        .update(coreUpdates)
        .eq("id", currentUserId)
        .select()
        .maybeSingle();

      if (fallback.error) {
        throw fallback.error;
      }

      updated = {
        ...fallback.data,
        address: updates.address || "",
        patron_type: updates.patron_type || "resident",
        school: updates.school || "",
        year_level: updates.year_level || "",
        age: updates.age || null,
        is_profile_completed: updates.is_profile_completed !== undefined ? updates.is_profile_completed : true
      };
    } else if (error) {
      throw error;
    }

    res.json({
      message: "Profile updated successfully",
      user: formatUser(updated)
    });
  } catch (error) {
    console.error("Error updating current user profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// ================================
// LOGOUT (CLEAR SINGLE SESSION)
// ================================
router.post("/logout", protect, async (req, res) => {
  try {
    const singleSessionRoles = ["patron", "staff"];
    if (singleSessionRoles.includes(req.user.role)) {
      await supabase
        .from("users")
        .update({ current_session_id: null, updated_at: new Date().toISOString() })
        .eq("id", req.user.id || req.user._id);
    }
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("LOGOUT ERROR:", error);
    res.json({ message: "Logged out successfully" });
  }
});

// ================================
// GET ALL USERS (FROM SUPABASE)
// ================================
router.get("/users", protect, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, username, email, role, name, first_name, last_name, phone, avatar, status, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.json(users.map(formatUser));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

module.exports = router;