const express = require("express");
const cors = require("cors");
const compression = require("compression");
require("dotenv").config();
const { supabase } = require("./db/supabase");

const app = express();

app.use(compression());
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/books", require("./routes/books"));
app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/external-books", require("./routes/externalBooks"));
app.use("/api/announcements", require("./routes/announcements"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/reports", require("./routes/reports"));

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
  });
}

startServer().catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});