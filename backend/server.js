const express = require("express");
const cors = require("cors");
require("dotenv").config();

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
// CORS
// Allow both local development and hosted frontend
// =====================================================

const allowedOrigins = [
  "http://localhost:5173",
  "https://navajowhite-crow-277801.hostingersite.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin
      // (for example, direct server-to-server requests)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON requests
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
// START SERVER
// =====================================================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});