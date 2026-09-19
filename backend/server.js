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

// Middleware
app.use(cors());
app.use(express.json());

// Authentication routes
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.get("/api/attendance-test", (req, res) => {
  res.json({
    success: true,
    message: "Attendance API route is working!"
  });
});
app.use("/api/staff", staffRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/settings", settingsRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "VSAMS Backend API is running",
  });
});

// Test database connection
app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS result");

    res.json({
      success: true,
      message: "MySQL database connected successfully",
      data: rows,
    });
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`VSAMS Backend running on port ${PORT}`);
});