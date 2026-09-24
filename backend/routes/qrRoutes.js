const express = require("express");
const crypto = require("crypto");
const db = require("../config/db");

const router = express.Router();

// =====================================================
// GENERATE SECURE RANDOM TOKEN
// =====================================================
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

// =====================================================
// GET CURRENT CAMEROON DATE
// Format: YYYY-MM-DD
// =====================================================
function getCameroonDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// =====================================================
// VALIDATE DATE FORMAT
// =====================================================
function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

// =====================================================
// GET TUESDAY - SATURDAY
// =====================================================
function getSchoolWeek(weekStart) {
  if (!isValidDate(weekStart)) {
    return [];
  }

  // Create date using local server timezone.
  // server.js sets TZ to Africa/Douala.
  const start = new Date(`${weekStart}T00:00:00`);

  if (isNaN(start.getTime())) {
    return [];
  }

  // Tuesday = 2
  if (start.getDay() !== 2) {
    return [];
  }

  const dates = [];

  for (let i = 0; i < 5; i++) {
    const current = new Date(start);

    current.setDate(start.getDate() + i);

    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");

    dates.push(`${year}-${month}-${day}`);
  }

  return dates;
}

// =====================================================
// GENERATE QR CODES FOR SELECTED WEEK
// =====================================================
router.post("/generate-weekly", async (req, res) => {
  try {
    const { week_start } = req.body;

    console.log("====================================");
    console.log("QR GENERATION REQUEST");
    console.log("week_start:", week_start);
    console.log("Cameroon date:", getCameroonDate());
    console.log("====================================");

    // =================================================
    // VALIDATE WEEK START
    // =================================================
    if (!week_start || !isValidDate(week_start)) {
      return res.status(400).json({
        success: false,
        message: "A valid Tuesday week start date is required.",
      });
    }

    // =================================================
    // GET TUESDAY-SATURDAY
    // =================================================
    const dates = getSchoolWeek(week_start);

    if (dates.length !== 5) {
      return res.status(400).json({
        success: false,
        message: "The selected week must start on a Tuesday.",
      });
    }

    console.log("School dates:", dates);

    const tokens = [];

    // =================================================
    // CREATE / GET QR FOR EACH SCHOOL DAY
    // =================================================
    for (const tokenDate of dates) {
      // Check whether QR already exists for this date
      const [existingRows] = await db.query(
        `
        SELECT
          token_id,
          token,
          token_date,
          created_at,
          status
        FROM qr_tokens
        WHERE token_date = ?
        LIMIT 1
        `,
        [tokenDate]
      );

      // =================================================
      // IF QR ALREADY EXISTS, KEEP IT
      // =================================================
      if (existingRows.length > 0) {
        tokens.push(existingRows[0]);
        continue;
      }

      // =================================================
      // GENERATE NEW SECURE TOKEN
      // =================================================
      const token = generateToken();

      const [result] = await db.query(
        `
        INSERT INTO qr_tokens
        (
          token,
          token_date,
          status
        )
        VALUES (?, ?, 'Active')
        `,
        [token, tokenDate]
      );

      tokens.push({
        token_id: result.insertId,
        token,
        token_date: tokenDate,
        status: "Active",
      });
    }

    console.log("QR TOKENS:", tokens);

    return res.json({
      success: true,
      message: "Weekly QR codes generated successfully.",
      tokens,
    });
  } catch (error) {
    console.error("QR generation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate weekly QR codes.",
      error: error.message,
    });
  }
});

// =====================================================
// GET QR CODES FOR SELECTED WEEK
// =====================================================
router.get("/weekly", async (req, res) => {
  try {
    const { week_start } = req.query;

    console.log("====================================");
    console.log("LOAD QR REQUEST");
    console.log("week_start:", week_start);
    console.log("Cameroon date:", getCameroonDate());
    console.log("====================================");

    // =================================================
    // VALIDATE DATE
    // =================================================
    if (!week_start || !isValidDate(week_start)) {
      return res.status(400).json({
        success: false,
        message: "A valid Tuesday week start date is required.",
      });
    }

    // =================================================
    // GET TUESDAY-SATURDAY
    // =================================================
    const dates = getSchoolWeek(week_start);

    if (dates.length !== 5) {
      return res.status(400).json({
        success: false,
        message: "The selected week must start on a Tuesday.",
      });
    }

    const startDate = dates[0];
    const endDate = dates[4];

    // =================================================
    // GET QR RECORDS
    // =================================================
    const [rows] = await db.query(
      `
      SELECT
        token_id,
        token,
        DATE_FORMAT(token_date, '%Y-%m-%d') AS token_date,
        created_at,
        status
      FROM qr_tokens
      WHERE token_date BETWEEN ? AND ?
      ORDER BY token_date ASC
      `,
      [startDate, endDate]
    );

    console.log("QR RECORDS FOUND:", rows.length);

    return res.json({
      success: true,
      tokens: rows,
    });
  } catch (error) {
    console.error("Get weekly QR error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve weekly QR codes.",
      error: error.message,
    });
  }
});

// =====================================================
// EXPORT
// =====================================================
module.exports = router;