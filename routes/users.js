const express = require("express");
const { supabase } = require("../db/supabase");
const { formatUser, formatTransaction } = require("../utils/formatters");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Apply auth middleware to all user management routes
router.use(protect);

// GET /api/users - List & Search Patrons / Users (admin + staff can view)
router.get("/", authorize("admin", "staff"), async (req, res) => {
  try {
    const { search, role, status } = req.query;

    let query = supabase.from("users").select("*");

    if (role) {
      query = query.eq("role", role);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (search) {
      const s = search.trim();
      query = query.or(`name.ilike.%${s}%,email.ilike.%${s}%,username.ilike.%${s}%`);
    }

    const { data: users, error } = await query.order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Fetch active and total loan counts for each patron
    const usersWithStats = await Promise.all(
      (users || []).map(async (u) => {
        const uFormatted = formatUser(u);

        if (u.role === "patron") {
          const filter = u.email
            ? `borrower_id.eq.${u.id},borrower_email.ilike.${u.email},borrower_name.ilike.${u.name}`
            : `borrower_id.eq.${u.id},borrower_name.ilike.${u.name}`;

          const [activeRes, totalRes] = await Promise.all([
            supabase
              .from("transactions")
              .select("id", { count: "exact", head: true })
              .or(filter)
              .eq("returned", false),
            supabase
              .from("transactions")
              .select("id", { count: "exact", head: true })
              .or(filter)
          ]);

          uFormatted.activeLoans = activeRes.count || 0;
          uFormatted.totalLoans = totalRes.count || 0;
        } else {
          uFormatted.activeLoans = 0;
          uFormatted.totalLoans = 0;
        }

        return uFormatted;
      })
    );

    res.json(usersWithStats);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
});

// DELETE /api/users/:id - Delete User / Patron / Staff
router.delete("/:id", authorize("admin", "staff"), async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch user to verify existence and role
    const { data: targetUser, error: findError } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (findError || !targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Role-based deletion guard: Staff can only delete patrons; Admins can delete staff & patrons
    if (req.user.role !== "admin" && targetUser.role !== "patron") {
      return res.status(403).json({ message: "Staff are only authorized to delete patron accounts." });
    }

    // Prevent anyone from deleting Admin accounts
    if (targetUser.role === "admin") {
      return res.status(403).json({ message: "Admin accounts cannot be deleted." });
    }

    // Prevent deleting oneself
    if (String(req.user.id) === String(id)) {
      return res.status(400).json({ message: "You cannot delete your own logged-in account." });
    }

    // Check if the patron has active borrowed books
    const filter = targetUser.email
      ? `borrower_id.eq.${targetUser.id},borrower_email.ilike.${targetUser.email}`
      : `borrower_id.eq.${targetUser.id}`;

    const { data: activeLoans } = await supabase
      .from("transactions")
      .select("id")
      .or(filter)
      .eq("returned", false);

    if (activeLoans && activeLoans.length > 0) {
      return res.status(400).json({
        message: `Cannot delete ${targetUser.name}: this patron currently has ${activeLoans.length} active borrowed book(s). Please return all borrowed books first.`
      });
    }

    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    res.json({
      message: `${targetUser.role === "staff" ? "Staff member" : "Patron"} "${targetUser.name}" was successfully deleted.`,
      id
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user", error: error.message });
  }
});

// All routes below this line are Admin Only
router.use(authorize("admin"));

// POST /api/users/patron - Admin Add New Patron
router.post("/patron", async (req, res) => {
  try {
    const { name, email, phone, status, address, patronType, school, yearLevel, age } = req.body;

    if (!name || !email || !email.includes("@")) {
      return res.status(400).json({ message: "Name and a valid Email address are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ message: `A user with email ${cleanEmail} already exists` });
    }

    const newPatronData = {
      name: name.trim(),
      email: cleanEmail,
      phone: (phone || "").trim(),
      address: (address || "").trim(),
      patron_type: String(patronType).toLowerCase() === "student" ? "student" : "resident",
      school: (school || "").trim(),
      year_level: (yearLevel || "").trim(),
      age: age ? parseInt(age, 10) || null : null,
      role: "patron",
      status: status === "disabled" ? "disabled" : "active",
      is_profile_completed: Boolean(address && phone && age)
    };

    let { data: patron, error } = await supabase
      .from("users")
      .insert(newPatronData)
      .select()
      .maybeSingle();

    if (error && error.code === "42703") {
      console.warn("Notice: Extended columns missing in Supabase users table, creating with basic fields.");
      const fallbackData = {
        name: name.trim(),
        email: cleanEmail,
        phone: (phone || "").trim(),
        role: "patron",
        status: status === "disabled" ? "disabled" : "active"
      };

      const fallbackRes = await supabase
        .from("users")
        .insert(fallbackData)
        .select()
        .single();

      if (fallbackRes.error) {
        throw fallbackRes.error;
      }

      patron = {
        ...fallbackRes.data,
        address: newPatronData.address,
        patron_type: newPatronData.patron_type,
        school: newPatronData.school,
        year_level: newPatronData.year_level,
        age: newPatronData.age,
        is_profile_completed: newPatronData.is_profile_completed
      };
    } else if (error) {
      throw error;
    }

    res.status(201).json({
      message: "Patron created successfully",
      patron: formatUser(patron)
    });
  } catch (error) {
    console.error("Error creating patron:", error);
    res.status(500).json({ message: "Failed to create patron", error: error.message });
  }
});

// GET /api/users/:id - Get Single User / Patron Details
router.get("/:id", async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (error || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(formatUser(user));
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Failed to fetch user details" });
  }
});

// PUT /api/users/:id - Update User / Patron Details
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      status,
      role,
      address,
      patronType,
      school,
      yearLevel,
      age,
      isProfileCompleted
    } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (name) updates.name = name.trim();
    if (email) updates.email = email.trim().toLowerCase();
    if (phone !== undefined) updates.phone = String(phone).trim();
    if (status && ["active", "disabled"].includes(status)) updates.status = status;
    if (role && ["admin", "staff", "patron"].includes(role)) updates.role = role;
    if (address !== undefined) updates.address = String(address).trim();
    if (patronType !== undefined) updates.patron_type = String(patronType).toLowerCase() === "student" ? "student" : "resident";
    if (school !== undefined) updates.school = String(school).trim();
    if (yearLevel !== undefined) updates.year_level = String(yearLevel).trim();
    if (age !== undefined && age !== "") updates.age = parseInt(age, 10) || null;
    if (isProfileCompleted !== undefined) updates.is_profile_completed = Boolean(isProfileCompleted);

    let { data: updated, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .maybeSingle();

    if (error && error.code === "42703") {
      console.warn("Notice: Extended columns missing in Supabase users table, updating with basic fields.");
      const basicUpdates = { updated_at: updates.updated_at };
      if (updates.name) basicUpdates.name = updates.name;
      if (updates.email) basicUpdates.email = updates.email;
      if (updates.phone !== undefined) basicUpdates.phone = updates.phone;
      if (updates.status) basicUpdates.status = updates.status;
      if (updates.role) basicUpdates.role = updates.role;

      const fallbackRes = await supabase
        .from("users")
        .update(basicUpdates)
        .eq("id", req.params.id)
        .select()
        .maybeSingle();

      if (fallbackRes.error) {
        throw fallbackRes.error;
      }

      updated = {
        ...fallbackRes.data,
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

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User updated successfully",
      user: formatUser(updated)
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user", error: error.message });
  }
});

// PATCH /api/users/:id/status - Enable / Disable Patron Status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "disabled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be 'active' or 'disabled'" });
    }

    const { data: updated, error } = await supabase
      .from("users")
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq("id", req.params.id)
      .select()
      .maybeSingle();

    if (error || !updated) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: `User status changed to ${status}`,
      user: formatUser(updated)
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    res.status(500).json({ message: "Failed to change user status", error: error.message });
  }
});

// GET /api/users/:id/history - Get Borrowing History for a Patron
router.get("/:id/history", async (req, res) => {
  try {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (userError || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    const filter = user.email
      ? `borrower_id.eq.${user.id},borrower_email.ilike.${user.email},borrower_name.ilike.${user.name}`
      : `borrower_id.eq.${user.id},borrower_name.ilike.${user.name}`;

    const { data: history, error: historyError } = await supabase
      .from("transactions")
      .select("*, book:books(*)")
      .or(filter)
      .order("created_at", { ascending: false });

    if (historyError) {
      throw historyError;
    }

    res.json({
      patron: formatUser(user),
      history: (history || []).map((tx) => formatTransaction(tx, tx.book))
    });
  } catch (error) {
    console.error("Error fetching patron borrowing history:", error);
    res.status(500).json({ message: "Failed to fetch borrowing history", error: error.message });
  }
});

module.exports = router;
