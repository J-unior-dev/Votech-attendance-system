const express = require("express");
const db = require("../config/db.js");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const settingsPath = path.join(
  __dirname,
  "../config/settings.json"
);

const defaultSettings = {
  reportingTime: "07:33",
  signOutTime: "17:00",
  workingDays: {
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: true,
  },
};

// =====================================================
// GET ATTENDANCE SETTINGS
// =====================================================

function getAttendanceSettings() {
  try {
    if (!fs.existsSync(settingsPath)) {
      return defaultSettings;
    }

    const settings = JSON.parse(
      fs.readFileSync(settingsPath, "utf8")
    );

    return {
      ...defaultSettings,
      ...settings,
      workingDays: {
        ...defaultSettings.workingDays,
        ...(settings.workingDays || {}),
      },
    };
  } catch (error) {
    console.error(
      "Unable to read attendance settings:",
      error
    );

    return defaultSettings;
  }
}

// =====================================================
// GET CURRENT CAMEROON DATE
// =====================================================

function getCameroonDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// =====================================================
// GET CURRENT CAMEROON TIME
// =====================================================

function getCameroonTime() {
  const now = new Date();

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  return (
    `${String(hours).padStart(2, "0")}:` +
    `${String(minutes).padStart(2, "0")}:` +
    `${String(seconds).padStart(2, "0")}`
  );
}

// =====================================================
// ATTENDANCE SCAN
// POST /api/attendance/scan
// =====================================================

router.post("/scan", async (req, res) => {
  try {
    const {
      staff_id,
      token,
      action,
    } = req.body;

    // -------------------------------------------------
    // VALIDATE REQUEST
    // -------------------------------------------------

    if (!staff_id || !token || !action) {
      return res.status(400).json({
        success: false,
        message:
          "Staff ID, QR token and action are required.",
      });
    }

    if (
      action !== "SIGN IN" &&
      action !== "SIGN OUT"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance action.",
      });
    }

    // -------------------------------------------------
    // FIND STAFF
    // -------------------------------------------------

    const [staffRows] = await db.query(
      `
      SELECT
        staff_id,
        name,
        department_id,
        status
      FROM staff
      WHERE staff_id = ?
      `,
      [staff_id]
    );

    if (staffRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found.",
      });
    }

    const staff = staffRows[0];

    // -------------------------------------------------
    // CHECK STAFF STATUS
    // -------------------------------------------------

    if (staff.status !== "Active") {
      return res.status(403).json({
        success: false,
        message:
          "This staff account is inactive.",
      });
    }

    // =================================================
    // CURRENT CAMEROON DATE
    // =================================================

    const attendanceDate =
      getCameroonDate();

    // =================================================
    // VALIDATE TODAY'S QR TOKEN
    // =================================================

    const [tokenRows] = await db.query(
      `
      SELECT
        token_id,
        token,
        token_date,
        status
      FROM qr_tokens
      WHERE token = ?
      AND token_date = ?
      AND status = 'Active'
      `,
      [
        token,
        attendanceDate,
      ]
    );

    if (tokenRows.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired QR code. Please scan today's QR code.",
      });
    }

    // =================================================
    // FIND TODAY'S ATTENDANCE
    // =================================================

    const [attendanceRows] = await db.query(
      `
      SELECT
        attendance_id,
        time_in,
        time_out,
        status,
        late_minutes
      FROM attendance
      WHERE staff_id = ?
      AND attendance_date = ?
      `,
      [
        staff_id,
        attendanceDate,
      ]
    );

    // =================================================
    // SIGN IN
    // =================================================

    if (action === "SIGN IN") {

      // ------------------------------------------------
      // PREVENT DUPLICATE SIGN-IN
      // ------------------------------------------------

      if (
        attendanceRows.length > 0 &&
        attendanceRows[0].time_in
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You have already signed in today.",
        });
      }

      // ------------------------------------------------
      // CURRENT CAMEROON TIME
      // ------------------------------------------------

      const currentTime =
        getCameroonTime();

      const now = new Date();

      const hours = now.getHours();
      const minutes = now.getMinutes();

      // ------------------------------------------------
      // GET ATTENDANCE SETTINGS
      // ------------------------------------------------

      const settings =
        getAttendanceSettings();

      // ------------------------------------------------
      // CALCULATE REPORTING TIME
      // ------------------------------------------------

      const [
        reportHour,
        reportMinute,
      ] = settings.reportingTime
        .split(":")
        .map(Number);

      const deadlineMinutes =
        reportHour * 60 +
        reportMinute;

      const currentMinutes =
        hours * 60 +
        minutes;

      let status = "Present";
      let lateMinutes = 0;

      // ------------------------------------------------
      // CALCULATE LATE STATUS
      // ------------------------------------------------

      if (
        currentMinutes >
        deadlineMinutes
      ) {
        status = "Late";

        lateMinutes =
          currentMinutes -
          deadlineMinutes;
      }

      // ------------------------------------------------
      // UPDATE EXISTING ATTENDANCE
      // ------------------------------------------------

      if (attendanceRows.length > 0) {

        await db.query(
          `
          UPDATE attendance
          SET
            time_in = ?,
            status = ?,
            late_minutes = ?
          WHERE attendance_id = ?
          `,
          [
            currentTime,
            status,
            lateMinutes,
            attendanceRows[0]
              .attendance_id,
          ]
        );

      } else {

        // ------------------------------------------------
        // CREATE NEW ATTENDANCE
        // ------------------------------------------------

        await db.query(
          `
          INSERT INTO attendance
          (
            staff_id,
            attendance_date,
            time_in,
            status,
            late_minutes
          )
          VALUES (?, ?, ?, ?, ?)
          `,
          [
            staff_id,
            attendanceDate,
            currentTime,
            status,
            lateMinutes,
          ]
        );
      }

      // ------------------------------------------------
      // SIGN-IN RESPONSE
      // ------------------------------------------------

      return res.json({
        success: true,

        message:
          status === "Late"
            ? `Sign in successful. You are ${lateMinutes} minute(s) late.`
            : "Sign in successful. You are on time.",

        attendance: {
          staff_id,
          name: staff.name,
          date: attendanceDate,
          time_in: currentTime,
          status,
          late_minutes: lateMinutes,
        },
      });
    }

    // =================================================
    // SIGN OUT
    // =================================================

    if (action === "SIGN OUT") {

      // ------------------------------------------------
      // MUST SIGN IN FIRST
      // ------------------------------------------------

      if (
        attendanceRows.length === 0 ||
        !attendanceRows[0].time_in
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot sign out because you have not signed in today.",
        });
      }

      // ------------------------------------------------
      // PREVENT DUPLICATE SIGN-OUT
      // ------------------------------------------------

      if (attendanceRows[0].time_out) {
        return res.status(400).json({
          success: false,
          message:
            "You have already signed out today.",
        });
      }

      // ------------------------------------------------
      // CURRENT CAMEROON TIME
      // ------------------------------------------------

      const currentTime =
        getCameroonTime();

      const now = new Date();

      const hours = now.getHours();
      const minutes = now.getMinutes();

      // ------------------------------------------------
      // GET SIGN-OUT SETTINGS
      // ------------------------------------------------

      const settings =
        getAttendanceSettings();

      const [
        signOutHour,
        signOutMinute,
      ] = settings.signOutTime
        .split(":")
        .map(Number);

      const signOutTargetMinutes =
        signOutHour * 60 +
        signOutMinute;

      const currentMinutes =
        hours * 60 +
        minutes;

      let departureMessage =
        "Sign out successful.";

      if (
        currentMinutes <
        signOutTargetMinutes
      ) {
        departureMessage =
          `Sign out recorded. You left before the ${settings.signOutTime} sign-out time.`;
      }

      // ------------------------------------------------
      // SAVE SIGN-OUT
      // ------------------------------------------------

      await db.query(
        `
        UPDATE attendance
        SET time_out = ?
        WHERE attendance_id = ?
        `,
        [
          currentTime,
          attendanceRows[0]
            .attendance_id,
        ]
      );

      // ------------------------------------------------
      // SIGN-OUT RESPONSE
      // ------------------------------------------------

      return res.json({
        success: true,

        message: departureMessage,

        attendance: {
          staff_id,
          name: staff.name,
          date: attendanceDate,
          time_in:
            attendanceRows[0].time_in,
          time_out: currentTime,
          status:
            attendanceRows[0].status,
          late_minutes:
            attendanceRows[0].late_minutes,
        },
      });
    }

  } catch (error) {

    console.error(
      "Attendance error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while recording attendance.",
    });
  }
});

// =====================================================
// GET ATTENDANCE RECORDS
// GET /api/attendance/records?date=YYYY-MM-DD
// =====================================================

router.get("/records", async (req, res) => {
  try {

    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message:
          "Attendance date is required.",
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        a.attendance_id,
        a.staff_id,
        s.name,
        d.department_name AS department,
        a.attendance_date,
        a.time_in,
        a.time_out,
        a.status,
        a.late_minutes
      FROM attendance a
      INNER JOIN staff s
        ON a.staff_id = s.staff_id
      LEFT JOIN departments d
        ON s.department_id = d.department_id
      WHERE a.attendance_date = ?
      ORDER BY a.time_in ASC
      `,
      [date]
    );

    return res.json({
      success: true,
      attendance: rows,
    });

  } catch (error) {

    console.error(
      "Load attendance error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while loading attendance records.",
    });
  }
});

// =====================================================
// MONTHLY ATTENDANCE REPORT
// GET /api/attendance/monthly-report?month=9&year=2026
// =====================================================

router.get(
  "/monthly-report",
  async (req, res) => {
    try {

      const {
        month,
        year,
      } = req.query;

      const reportMonth =
        Number(month);

      const reportYear =
        Number(year);

      // -------------------------------------------------
      // VALIDATE MONTH AND YEAR
      // -------------------------------------------------

      if (
        !reportMonth ||
        !reportYear ||
        reportMonth < 1 ||
        reportMonth > 12 ||
        reportYear < 2000
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid month and year are required.",
        });
      }

      // -------------------------------------------------
      // MONTH START
      // -------------------------------------------------

      const startDate =
        `${reportYear}-` +
        `${String(reportMonth).padStart(2, "0")}-01`;

      // -------------------------------------------------
      // MONTH END
      // -------------------------------------------------

      const lastDay =
        new Date(
          reportYear,
          reportMonth,
          0
        ).getDate();

      const fullMonthEndDate =
        `${reportYear}-` +
        `${String(reportMonth).padStart(2, "0")}-` +
        `${String(lastDay).padStart(2, "0")}`;

      // -------------------------------------------------
      // TODAY - CAMEROON DATE
      // -------------------------------------------------

      const today =
        new Date();

      const todayYear =
        today.getFullYear();

      const todayMonth =
        today.getMonth() + 1;

      const todayDay =
        today.getDate();

      const todayString =
        `${todayYear}-` +
        `${String(todayMonth).padStart(2, "0")}-` +
        `${String(todayDay).padStart(2, "0")}`;

      // -------------------------------------------------
      // DETERMINE REPORT END DATE
      // -------------------------------------------------

      let reportEndDate =
        fullMonthEndDate;

      // Current month:
      // stop at today.

      if (
        reportYear === todayYear &&
        reportMonth === todayMonth
      ) {
        reportEndDate =
          todayString;
      }

      // Future month:
      // no working days yet.

      if (
        reportYear > todayYear ||
        (
          reportYear === todayYear &&
          reportMonth > todayMonth
        )
      ) {
        reportEndDate = null;
      }

      // -------------------------------------------------
      // LOAD STAFF
      // -------------------------------------------------

      const [staffRows] =
        await db.query(
          `
          SELECT
            s.staff_id,
            s.name,
            s.phone,
            s.department_id,
            d.department_name,
            s.username,
            s.status
          FROM staff s
          LEFT JOIN departments d
            ON s.department_id = d.department_id
          ORDER BY s.staff_id ASC
          `
        );

      // -------------------------------------------------
      // LOAD ATTENDANCE
      // -------------------------------------------------

      let attendanceRows = [];

      if (reportEndDate) {

        [attendanceRows] =
          await db.query(
            `
            SELECT
              a.attendance_id,
              a.staff_id,
              DATE_FORMAT(
                a.attendance_date,
                '%Y-%m-%d'
              ) AS attendance_date,
              a.time_in,
              a.time_out,
              a.status,
              a.late_minutes
            FROM attendance a
            WHERE a.attendance_date
            BETWEEN ? AND ?
            ORDER BY
              a.attendance_date ASC
            `,
            [
              startDate,
              reportEndDate,
            ]
          );
      }

      // -------------------------------------------------
      // BUILD ATTENDANCE LOOKUP
      // -------------------------------------------------

      const attendanceMap =
        new Map();

      attendanceRows.forEach(
        (record) => {

          const key =
            `${record.staff_id}_${record.attendance_date}`;

          attendanceMap.set(
            key,
            record
          );
        }
      );

      // -------------------------------------------------
      // BUILD WORKING DATES
      // -------------------------------------------------

      const workingDates = [];

      if (reportEndDate) {

        const cursor =
          new Date(
            reportYear,
            reportMonth - 1,
            1
          );

        while (true) {

          const currentYear =
            cursor.getFullYear();

          const currentMonth =
            cursor.getMonth() + 1;

          const currentDay =
            cursor.getDate();

          // Stop after selected month

          if (
            currentYear !==
              reportYear ||
            currentMonth !==
              reportMonth
          ) {
            break;
          }

          const dateString =
            `${currentYear}-` +
            `${String(currentMonth).padStart(2, "0")}-` +
            `${String(currentDay).padStart(2, "0")}`;

          // Stop at report end date

          if (
            dateString >
            reportEndDate
          ) {
            break;
          }

          const dayOfWeek =
            cursor.getDay();

          // Tuesday through Saturday
          //
          // Tuesday = 2
          // Wednesday = 3
          // Thursday = 4
          // Friday = 5
          // Saturday = 6

          if (
            dayOfWeek >= 2 &&
            dayOfWeek <= 6
          ) {
            workingDates.push(
              dateString
            );
          }

          cursor.setDate(
            cursor.getDate() + 1
          );
        }
      }

      const workingDays =
        workingDates.length;

      // -------------------------------------------------
      // BUILD REPORT FOR EACH STAFF MEMBER
      // -------------------------------------------------

      const report =
        staffRows.map((staff) => {

          let presentDays = 0;
          let lateDays = 0;
          let absentDays = 0;
          let incompleteDays = 0;
          let earlyDepartureDays = 0;
          let lateMinutesTotal = 0;

          workingDates.forEach(
            (date) => {

              const key =
                `${staff.staff_id}_${date}`;

              const record =
                attendanceMap.get(key);

              // ------------------------------------------------
              // NO ATTENDANCE
              // ------------------------------------------------

              if (!record) {
                absentDays++;
                return;
              }

              // ------------------------------------------------
              // STAFF SIGNED IN
              // ------------------------------------------------

              if (record.time_in) {

                presentDays++;

                // Count late days

                if (
                  record.status ===
                  "Late"
                ) {
                  lateDays++;
                }

                // Add late minutes

                lateMinutesTotal +=
                  Number(
                    record.late_minutes ||
                      0
                  );
              }

              // ------------------------------------------------
              // INCOMPLETE ATTENDANCE
              // ------------------------------------------------

              if (!record.time_out) {
                incompleteDays++;
              }

              // ------------------------------------------------
              // EARLY DEPARTURE
              // ------------------------------------------------

              if (record.time_out) {

                const timeParts =
                  String(
                    record.time_out
                  ).split(":");

                const hours =
                  Number(
                    timeParts[0] || 0
                  );

                const minutes =
                  Number(
                    timeParts[1] || 0
                  );

                const totalMinutes =
                  hours * 60 +
                  minutes;

                const settings =
                  getAttendanceSettings();

                const [
                  signOutHour,
                  signOutMinute,
                ] =
                  settings.signOutTime
                    .split(":")
                    .map(Number);

                const officialSignOutMinutes =
                  signOutHour * 60 +
                  signOutMinute;

                if (
                  totalMinutes <
                  officialSignOutMinutes
                ) {
                  earlyDepartureDays++;
                }
              }
            }
          );

          // ------------------------------------------------
          // ATTENDANCE PERCENTAGE
          // ------------------------------------------------

          const attendancePercentage =
            workingDays > 0
              ? Number(
                  (
                    (
                      presentDays /
                      workingDays
                    ) * 100
                  ).toFixed(1)
                )
              : 0;

          // ------------------------------------------------
          // STAFF REPORT
          // ------------------------------------------------

          return {

            staff_id:
              staff.staff_id,

            name:
              staff.name,

            phone:
              staff.phone,

            department_id:
              staff.department_id,

            department:
              staff.department_name ||
              "Unassigned",

            status:
              staff.status,

            working_days:
              workingDays,

            present_days:
              presentDays,

            late_days:
              lateDays,

            absent_days:
              absentDays,

            incomplete_days:
              incompleteDays,

            early_departure_days:
              earlyDepartureDays,

            late_minutes:
              lateMinutesTotal,

            attendance_percentage:
              attendancePercentage,
          };
        });

      // -------------------------------------------------
      // REPORT SUMMARY
      // -------------------------------------------------

      const summary = {

        total_staff:
          report.length,

        working_days:
          workingDays,

        total_present_days:
          report.reduce(
            (total, staff) =>
              total +
              staff.present_days,
            0
          ),

        total_late_days:
          report.reduce(
            (total, staff) =>
              total +
              staff.late_days,
            0
          ),

        total_absent_days:
          report.reduce(
            (total, staff) =>
              total +
              staff.absent_days,
            0
          ),

        total_incomplete_days:
          report.reduce(
            (total, staff) =>
              total +
              staff.incomplete_days,
            0
          ),

        total_early_departures:
          report.reduce(
            (total, staff) =>
              total +
              staff.early_departure_days,
            0
          ),

        total_late_minutes:
          report.reduce(
            (total, staff) =>
              total +
              staff.late_minutes,
            0
          ),
      };

      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      return res.json({

        success: true,

        report_period: {

          month:
            reportMonth,

          year:
            reportYear,

          start_date:
            startDate,

          end_date:
            reportEndDate,
        },

        working_days:
          workingDays,

        summary,

        report,
      });

    } catch (error) {

      console.error(
        "Monthly attendance report error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while generating monthly report.",
      });
    }
  }
);

module.exports = router;