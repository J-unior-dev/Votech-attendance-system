const express = require("express");
const cors = require("cors");
require("dotenv").config();

// =====================================================
// CAMEROON TIMEZONE
// =====================================================
// Cameroon uses Africa/Douala (UTC+1).
// This makes JavaScript Date methods use Cameroon time.
process.env.TZ = "Africa/Douala";

const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const staffRoutes = require("./routes/staffRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const qrRoutes = require("./routes/qrRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// =====================================================
// CORS CONFIGURATION
// =====================================================

const allowedOrigins = [
  "http://localhost:5173",
  "https://navajowhite-crow-277801.hostingersite.com",
];

// =====================================================
// CORS MIDDLEWARE
// =====================================================

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );

  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  res.header("Access-Control-Allow-Credentials", "true");

  // Handle browser preflight requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// Keep the cors package enabled as an additional layer
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// =====================================================
// PARSE JSON REQUESTS
// =====================================================

app.use(express.json());

// =====================================================
// AUTHENTICATION ROUTES
// =====================================================

app.use("/api/auth", authRoutes);

// =====================================================
// ATTENDANCE ROUTES
// =====================================================

app.use("/api/attendance", attendanceRoutes);

app.get("/api/attendance-test", (req, res) => {
  res.json({
    success: true,
    message: "Attendance API route is working!",
  });
});

// =====================================================
// TIMEZONE TEST ROUTE
// =====================================================

app.get("/api/time-test", (req, res) => {
  const now = new Date();

  res.json({
    success: true,
    timezone: process.env.TZ,
    date: now.toLocaleDateString("en-CA"),
    time: now.toLocaleTimeString("en-GB"),
    iso: now.toISOString(),
  });
});

// =====================================================
// STAFF ROUTES
// =====================================================

app.use("/api/staff", staffRoutes);

// =====================================================
// DEPARTMENT ROUTES
// =====================================================

app.use("/api/departments", departmentRoutes);

// =====================================================
// QR ROUTES
// =====================================================

app.use("/api/qr", qrRoutes);

// =====================================================
// SETTINGS ROUTES
// =====================================================

app.use("/api/settings", settingsRoutes);

// =====================================================
// ROOT TEST ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.json({
    message: "VSAMS Backend API is running",
  });
});

// =====================================================
// DATABASE TEST ROUTE
// =====================================================

app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS result");

    res.json({
      success: true,
      message: "MySQL database connected successfully",
      data: rows,
    });
  } catch (error) {
    console.error("DATABASE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// =====================================================
// ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message,
  });
});

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Timezone: ${process.env.TZ}`);
});