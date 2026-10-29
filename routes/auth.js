const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { supabase } = require("../db/supabase");
const { formatUser } = require("../utils/formatters");
const { sendPatronWelcomeEmail, sendPasswordResetEmail } = require("../utils/email");
const { protect } = require("../middleware/auth");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.get("/test", (req, res) => {
  res.json({
    message: "Auth route is working (Supabase)"
  });
});

// ================================
// UNIFIED LOGIN (Admin, Staff, or Patron)
// ================================
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username/email and password are required"
      });
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
      return res.status(500).json({ message: "Database query error", error: error.message });
    }

    const user = users && users.length > 0 ? users[0] : null;

    if (!user) {
      return res.status(401).json({
        message: "Invalid username or password"
      });
    }

    if (user.status === "disabled") {
      return res.status(403).json({
        message: "Your account has been disabled by administration. Please contact the library."
      });
    }

    if (!user.password) {
      return res.status(401).json({
        message: "No password set for this account. Please use Google sign-in or contact the administrator."
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid username or password"
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "JWT_SECRET is not configured"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name
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
    console.error("LOGIN ERROR:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
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

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: updateError } = await supabase
      .from("users")
      .update({
        reset_password_code: resetCode,
        reset_password_expires: expiresAt,
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
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        message: "Google credential is required"
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
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
      .or(`google_id.eq.${googleId},and(email.ilike.${cleanEmail},role.eq.patron)`)
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

      const updates = { updated_at: new Date().toISOString() };
      if (!user.google_id) updates.google_id = googleId;
      if (picture && !user.avatar) updates.avatar = picture;
      if (name && user.name === cleanEmail.split("@")[0]) updates.name = name;

      const { data: updated, error: updateErr } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (!updateErr && updated) {
        user = updated;
      }
    } else {
      // Create new patron
      const { data: newUser, error: insertErr } = await supabase
        .from("users")
        .insert({
          email: cleanEmail,
          google_id: googleId,
          avatar: picture || "",
          role: "patron",
          name: name || cleanEmail.split("@")[0],
          status: "active"
        })
        .select()
        .single();

      if (insertErr) {
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

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: "patron",
        name: user.name
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
        email: user.email,
        role: user.role,
        name: user.name,
        firstName,
        lastName,
        phone: user.phone || "",
        address: user.address || "",
        patronType: user.patronType || "resident",
        school: user.school || "",
        yearLevel: user.yearLevel || "",
        age: user.age || "",
        isProfileCompleted: Boolean(user.isProfileCompleted),
        avatar: user.avatar,
        status: user.status
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
      isProfileCompleted
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
    if (patronType !== undefined) updates.patron_type = String(patronType).toLowerCase() === "student" ? "student" : "resident";
    if (school !== undefined) updates.school = String(school).trim();
    if (yearLevel !== undefined) updates.year_level = String(yearLevel).trim();
    if (age !== undefined && age !== "") updates.age = parseInt(age, 10) || null;
    if (isProfileCompleted !== undefined) updates.is_profile_completed = Boolean(isProfileCompleted);

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