const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("../config/db");

const router = express.Router();


// =====================================================
// UNIFIED LOGIN
// ADMIN + STAFF
// =====================================================
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // -------------------------------------------------
    // CHECK REQUIRED FIELDS
    // -------------------------------------------------
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required.",
      });
    }

    const cleanUsername = username.trim();


    // =================================================
    // 1. CHECK ADMIN ACCOUNT
    // =================================================
    const [adminRows] = await db.query(
      `
      SELECT
        admin_id,
        name,
        username,
        password_hash,
        status
      FROM admins
      WHERE username = ?
      LIMIT 1
      `,
      [cleanUsername]
    );


    // =================================================
    // ADMIN FOUND
    // =================================================
    if (adminRows.length > 0) {

      const admin = adminRows[0];

      // Check account status
      if (admin.status !== "Active") {
        return res.status(403).json({
          success: false,
          message: "This administrator account is inactive.",
        });
      }


      // Check password
      const passwordMatch = await bcrypt.compare(
        password,
        admin.password_hash
      );

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid username or password.",
        });
      }


      // Create JWT
      const token = jwt.sign(
        {
          adminId: admin.admin_id,
          username: admin.username,
          role: "admin",
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "8h",
        }
      );


      return res.json({
        success: true,
        message: "Login successful.",
        token,
        role: "admin",

        user: {
          id: admin.admin_id,
          name: admin.name,
          username: admin.username,
          role: "admin",
        },

        redirectTo: "/admin/dashboard",
      });
    }


    // =================================================
    // 2. CHECK STAFF ACCOUNT
    // =================================================
    const [staffRows] = await db.query(
      `
      SELECT
        s.staff_id,
        s.name,
        s.phone,
        s.department_id,
        s.username,
        s.password_hash,
        s.status,
        d.department_name
      FROM staff s
      LEFT JOIN departments d
        ON s.department_id = d.department_id
      WHERE s.username = ?
      LIMIT 1
      `,
      [cleanUsername]
    );


    // =================================================
    // STAFF NOT FOUND
    // =================================================
    if (staffRows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }


    const staff = staffRows[0];


    // =================================================
    // CHECK STAFF STATUS
    // =================================================
    if (staff.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "This staff account is inactive.",
      });
    }


    // =================================================
    // CHECK STAFF PASSWORD
    // =================================================
    const passwordMatch = await bcrypt.compare(
      password,
      staff.password_hash
    );


    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }


    // =================================================
    // CREATE STAFF JWT
    // =================================================
    const token = jwt.sign(
      {
        staffId: staff.staff_id,
        username: staff.username,
        role: "staff",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );


    // =================================================
    // STAFF LOGIN SUCCESS
    // =================================================
    return res.json({
      success: true,
      message: "Login successful.",
      token,
      role: "staff",

      user: {
        id: staff.staff_id,
        staff_id: staff.staff_id,
        name: staff.name,
        phone: staff.phone,
        username: staff.username,
        department_id: staff.department_id,
        department_name: staff.department_name,
        status: staff.status,
        role: "staff",
      },

      redirectTo: "/staff/dashboard",
    });


  } catch (error) {

    console.error("Unified login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
});


module.exports = router;
