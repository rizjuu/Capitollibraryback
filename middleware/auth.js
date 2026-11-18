const jwt = require("jsonwebtoken");
const { supabase } = require("../db/supabase");
const { formatUser } = require("../utils/formatters");

// Roles restricted to single active session (admins are exempt)
const SINGLE_SESSION_ROLES = ["patron", "staff"];

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", decoded.id)
        .maybeSingle();

      if (error || !user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (user.status === "disabled") {
        return res.status(403).json({
          message: "Your account has been disabled by administration. Please contact the library."
        });
      }

      // Single Session Enforcement (Patron and Staff only)
      // If the database has a current session tracked, the token's sessionId must match it.
      // Null current_session_id means no session enforcement yet (pre-migration or cleared on logout).
      if (SINGLE_SESSION_ROLES.includes(user.role) && user.current_session_id) {
        if (!decoded.sessionId || decoded.sessionId !== user.current_session_id) {
          return res.status(401).json({
            message: "Your account was logged in from another device or browser. Only one active session is allowed.",
            code: "SESSION_TERMINATED",
            sessionTerminated: true
          });
        }
      }

      req.user = formatUser(user);
      return next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired, please log in again", expired: true });
      }
      console.error("Auth middleware error:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user ? req.user.role : "unknown"} is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
