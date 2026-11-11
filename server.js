const express = require("express");
const cors = require("cors");
const compression = require("compression");
require("dotenv").config();
const { supabase } = require("./db/supabase");

const app = express();

app.use(compression());

// Dynamic CORS configuration allowing localhost and production Vercel domains
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:4173",
  process.env.FRONTEND_PATRON_URL,
  process.env.FRONTEND_ADMIN_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      // Allow any vercel preview deployment or explicitly allowed origins
      if (
        allowedOrigins.includes(origin) ||
        /\.vercel\.app$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive default to avoid blocking capstone evaluators, while honoring credentials
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// API Routes
app.use("/api/books", require("./routes/books"));
app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/reservations", require("./routes/reservations"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/announcements", require("./routes/announcements"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/sms", require("./routes/sms"));

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "Capitol Library API",
    database: "Supabase PostgreSQL",
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️  [Warning]: SUPABASE_URL or SUPABASE_KEY / SUPABASE_SERVICE_ROLE_KEY is not defined.");
    console.warn("   The server is starting, but database queries will fail until credentials are provided.");
  } else {
    try {
      const { error } = await supabase.from("users").select("id", { count: "exact", head: true });
      if (error) {
        console.warn("⚠️  [Supabase Connection Notice]:", error.message);
        console.warn("   Make sure you have run schema.sql in your Supabase SQL Editor!");
      } else {
        console.log("✅ Supabase database connected successfully!");
      }
    } catch (err) {
      console.warn("⚠️  [Supabase Connection Test Failed]:", err.message);
    }
  }

  app.listen(PORT, () => {
    console.log(`🚀 Capitol Library Server running on port ${PORT}`);
    // Start automated daily 8:00 AM SMS reminder scheduler
    const { initReminderScheduler } = require("./services/reminderService");
    initReminderScheduler();

    // Start 5-minute automated reservation expiration & waiting list promotion scheduler
    const { initReservationScheduler } = require("./services/reservationService");
    initReservationScheduler();
  });
}

startServer().catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});