const express = require("express");
const db = require("../config/db");

const router = express.Router();

// GET ALL DEPARTMENTS
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT department_id, department_name FROM departments ORDER BY department_name ASC"
    );

    res.json({
      success: true,
      departments: rows,
    });
  } catch (error) {
    console.error("Get departments error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve departments.",
    });
  }
});

module.exports = router;