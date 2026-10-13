const express = require("express");
const { supabase } = require("../db/supabase");
const { formatAnnouncement } = require("../utils/formatters");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// GET all active announcements
router.get("/", async (req, res) => {
  try {
    const { data: announcements, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.json((announcements || []).map(formatAnnouncement));
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({ message: "Failed to fetch announcements" });
  }
});

// POST create new announcement (admin only)
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { title, content, priority, author, date } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const { data: announcement, error } = await supabase
      .from("announcements")
      .insert({
        title: title.trim(),
        content: content.trim(),
        priority: priority || "normal",
        author: author || "Library Admin",
        date: date || new Date().toISOString().split("T")[0],
        active: true
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(formatAnnouncement(announcement));
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({ message: "Failed to create announcement" });
  }
});

// DELETE announcement (admin only)
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const { data: announcement, error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", req.params.id)
      .select()
      .maybeSingle();

    if (error || !announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json({ message: "Announcement deleted successfully", id: req.params.id });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({ message: "Failed to delete announcement" });
  }
});

module.exports = router;
