const jwt = require("jsonwebtoken");
const { supabase } = require("../db/supabase");
const { formatUser } = require("../utils/formatters");

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

      req.user = formatUser(user);
      return next();
    } catch (error) {
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
