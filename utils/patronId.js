/**
 * Patron ID Generator & Formatter for Capitol Library Management System
 * Standard Format: MISORLIB-YYYY-XXX (e.g. MISORLIB-2026-001)
 */

function formatPatronId(user) {
  if (!user) return "";
  if (user.username && user.username.toUpperCase().startsWith("MISORLIB-")) {
    return user.username.toUpperCase();
  }
  if (user.role === "patron") {
    // If username is set and doesn't conflict, but not in format, return it
    if (user.username) return user.username;
    // Derive deterministic fallback from created date or ID
    const year = user.createdAt || user.created_at
      ? new Date(user.createdAt || user.created_at).getFullYear()
      : new Date().getFullYear();
    const idSeed = user.id || user._id || "";
    // If we have an ID with digits or hex, create a clean 3-digit number
    const numPart = idSeed.replace(/[^\d]/g, "").slice(-3) || "001";
    return `MISORLIB-${year}-${numPart.padStart(3, "0")}`;
  }
  return user.username || "";
}

/**
 * Generate the next sequential Patron ID for the given year
 * Format: MISORLIB-YYYY-XXX
 */
async function generateNextPatronId(supabaseClient, year = new Date().getFullYear()) {
  try {
    const prefix = `MISORLIB-${year}-`;
    const { data: users, error } = await supabaseClient
      .from("users")
      .select("username")
      .ilike("username", `${prefix}%`);

    if (error) {
      console.warn("Could not query existing patron IDs:", error.message);
      return `${prefix}001`;
    }

    let maxSeq = 0;
    (users || []).forEach((u) => {
      if (!u.username) return;
      const parts = u.username.split("-");
      if (parts.length === 3) {
        const seq = parseInt(parts[2], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    });

    const nextSeq = maxSeq + 1;
    const padded = String(nextSeq).padStart(3, "0");
    return `${prefix}${padded}`;
  } catch (err) {
    console.error("Error generating next patron ID:", err);
    return `MISORLIB-${year}-001`;
  }
}

module.exports = {
  formatPatronId,
  generateNextPatronId
};
