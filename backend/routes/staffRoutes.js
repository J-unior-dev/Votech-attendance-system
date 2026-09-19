const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/db");

const router = express.Router();

// =====================================================
// GET ALL STAFF
// =====================================================
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        s.staff_id,
        s.name,
        s.phone,
        s.department_id,
        d.department_name,
        s.username,
        s.status
      FROM staff s
      INNER JOIN departments d
        ON s.department_id = d.department_id
      ORDER BY s.staff_id DESC
    `);

    res.json({
      success: true,
      staff: rows,
    });
  } catch (error) {
    console.error("Get staff error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve staff.",
    });
  }
});


// =====================================================
// REGISTER STAFF
// =====================================================
router.post("/", async (req, res) => {
  try {
    const {
      name,
      phone,
      department_id,
      username,
      password,
    } = req.body;

    if (
      !name ||
      !phone ||
      !department_id ||
      !username ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields.",
      });
    }

    // Check duplicate phone
    const [existingPhone] = await db.query(
      "SELECT staff_id FROM staff WHERE phone = ?",
      [phone]
    );

    if (existingPhone.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This phone number is already registered.",
      });
    }

    // Check duplicate username
    const [existingUsername] = await db.query(
      "SELECT staff_id FROM staff WHERE username = ?",
      [username]
    );

    if (existingUsername.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This username is already registered.",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert staff
    const [result] = await db.query(
      `
      INSERT INTO staff
      (name, phone, department_id, username, password_hash, status)
      VALUES (?, ?, ?, ?, ?, 'Active')
      `,
      [
        name,
        phone,
        department_id,
        username,
        passwordHash,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Staff registered successfully.",
      staff_id: result.insertId,
    });
  } catch (error) {
    console.error("Register staff error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to register staff.",
    });
  }
});


// =====================================================
// EDIT STAFF
// PUT /api/staff/:id
// =====================================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      phone,
      department_id,
      username,
      password,
    } = req.body;

    if (
      !name ||
      !phone ||
      !department_id ||
      !username
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, department and username are required.",
      });
    }

    // Check staff exists
    const [staffRows] = await db.query(
      "SELECT staff_id FROM staff WHERE staff_id = ?",
      [id]
    );

    if (staffRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found.",
      });
    }

    // Check duplicate phone belonging to another staff member
    const [existingPhone] = await db.query(
      `
      SELECT staff_id
      FROM staff
      WHERE phone = ?
      AND staff_id != ?
      `,
      [phone, id]
    );

    if (existingPhone.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This phone number is already registered to another staff member.",
      });
    }

    // Check duplicate username belonging to another staff member
    const [existingUsername] = await db.query(
      `
      SELECT staff_id
      FROM staff
      WHERE username = ?
      AND staff_id != ?
      `,
      [username, id]
    );

    if (existingUsername.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This username is already registered to another staff member.",
      });
    }

    // If password is supplied, update it too
    if (password && password.trim() !== "") {
      const passwordHash = await bcrypt.hash(password, 10);

      await db.query(
        `
        UPDATE staff
        SET
          name = ?,
          phone = ?,
          department_id = ?,
          username = ?,
          password_hash = ?
        WHERE staff_id = ?
        `,
        [
          name,
          phone,
          department_id,
          username,
          passwordHash,
          id,
        ]
      );
    } else {
      // Keep existing password
      await db.query(
        `
        UPDATE staff
        SET
          name = ?,
          phone = ?,
          department_id = ?,
          username = ?
        WHERE staff_id = ?
        `,
        [
          name,
          phone,
          department_id,
          username,
          id,
        ]
      );
    }

    res.json({
      success: true,
      message: "Staff details updated successfully.",
    });
  } catch (error) {
    console.error("Update staff error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update staff.",
    });
  }
});


// =====================================================
// ACTIVATE / DEACTIVATE STAFF
// PATCH /api/staff/:id/status
// =====================================================
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status !== "Active" && status !== "Inactive") {
      return res.status(400).json({
        success: false,
        message: "Invalid staff status.",
      });
    }

    const [result] = await db.query(
      `
      UPDATE staff
      SET status = ?
      WHERE staff_id = ?
      `,
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found.",
      });
    }

    res.json({
      success: true,
      message:
        status === "Active"
          ? "Staff member activated successfully."
          : "Staff member deactivated successfully.",
    });
  } catch (error) {
    console.error("Change staff status error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to change staff status.",
    });
  }
});


// =====================================================
// DELETE STAFF
// DELETE /api/staff/:id
// =====================================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check staff exists
    const [staffRows] = await db.query(
      "SELECT staff_id, name FROM staff WHERE staff_id = ?",
      [id]
    );

    if (staffRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found.",
      });
    }

    // Check whether attendance records exist
    const [attendanceRows] = await db.query(
      `
      SELECT attendance_id
      FROM attendance
      WHERE staff_id = ?
      LIMIT 1
      `,
      [id]
    );

    if (attendanceRows.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This staff member has attendance records and cannot be deleted. Deactivate the account instead.",
      });
    }

    await db.query(
      "DELETE FROM staff WHERE staff_id = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Staff member deleted successfully.",
    });
  } catch (error) {
    console.error("Delete staff error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete staff.",
    });
  }
});


module.exports = router;
