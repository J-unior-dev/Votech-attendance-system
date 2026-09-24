const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const settingsPath = path.join(
  __dirname,
  "../config/settings.json"
);

// =====================================================
// DEFAULT SETTINGS
// =====================================================

const defaultSettings = {
  signInTimes: {
    Tuesday: "07:33",
    Wednesday: "07:43",
    Thursday: "07:43",
    Friday: "07:33",
    Saturday: "07:43",
  },

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
// READ SETTINGS
// =====================================================

function readSettings() {
  try {
    if (!fs.existsSync(settingsPath)) {
      fs.writeFileSync(
        settingsPath,
        JSON.stringify(
          defaultSettings,
          null,
          2
        )
      );

      return defaultSettings;
    }

    const data = fs.readFileSync(
      settingsPath,
      "utf8"
    );

    const savedSettings =
      JSON.parse(data);

    // -------------------------------------------------
    // SUPPORT OLD SETTINGS FILE
    // -------------------------------------------------

    const oldReportingTime =
      savedSettings.reportingTime;

    const savedSignInTimes =
      savedSettings.signInTimes || {};

    // If the old system had only reportingTime,
    // use it as a fallback for all days.
    const legacyTime =
      oldReportingTime || "07:33";

    return {
      signInTimes: {
        Tuesday:
          savedSignInTimes.Tuesday ||
          legacyTime,

        Wednesday:
          savedSignInTimes.Wednesday ||
          legacyTime,

        Thursday:
          savedSignInTimes.Thursday ||
          legacyTime,

        Friday:
          savedSignInTimes.Friday ||
          legacyTime,

        Saturday:
          savedSignInTimes.Saturday ||
          legacyTime,
      },

      signOutTime:
        savedSettings.signOutTime ||
        defaultSettings.signOutTime,

      workingDays: {
        ...defaultSettings.workingDays,
        ...(savedSettings.workingDays || {}),
      },
    };
  } catch (error) {
    console.error(
      "Settings read error:",
      error
    );

    return defaultSettings;
  }
}

// =====================================================
// VALIDATE TIME
// =====================================================

function isValidTime(value) {
  return (
    typeof value === "string" &&
    /^([01]\d|2[0-3]):([0-5]\d)$/.test(
      value
    )
  );
}

// =====================================================
// GET SETTINGS
// GET /api/settings
// =====================================================

router.get("/", (req, res) => {
  try {
    const settings = readSettings();

    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error(
      "Get settings error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to load system settings.",
    });
  }
});

// =====================================================
// SAVE SETTINGS
// PUT /api/settings
// =====================================================

router.put("/", (req, res) => {
  try {
    const {
      signInTimes,
      signOutTime,
      workingDays,
    } = req.body;

    // -------------------------------------------------
    // VALIDATE SIGN-IN TIMES
    // -------------------------------------------------

    const requiredDays = [
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    for (const day of requiredDays) {
      if (
        !signInTimes ||
        !isValidTime(signInTimes[day])
      ) {
        return res.status(400).json({
          success: false,
          message:
            `A valid sign-in time is required for ${day}.`,
        });
      }
    }

    // -------------------------------------------------
    // VALIDATE DEFAULT SIGN-OUT TIME
    // -------------------------------------------------

    if (!isValidTime(signOutTime)) {
      return res.status(400).json({
        success: false,
        message:
          "A valid default sign-out time is required.",
      });
    }

    // -------------------------------------------------
    // CREATE UPDATED SETTINGS
    // -------------------------------------------------

    const updatedSettings = {
      signInTimes: {
        Tuesday:
          signInTimes.Tuesday,

        Wednesday:
          signInTimes.Wednesday,

        Thursday:
          signInTimes.Thursday,

        Friday:
          signInTimes.Friday,

        Saturday:
          signInTimes.Saturday,
      },

      signOutTime,

      workingDays: {
        ...defaultSettings.workingDays,
        ...(workingDays || {}),
      },
    };

    // -------------------------------------------------
    // SAVE TO FILE
    // -------------------------------------------------

    fs.writeFileSync(
      settingsPath,
      JSON.stringify(
        updatedSettings,
        null,
        2
      )
    );

    res.json({
      success: true,
      message:
        "Settings saved successfully.",
      settings: updatedSettings,
    });
  } catch (error) {
    console.error(
      "Save settings error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to save system settings.",
    });
  }
});

module.exports = router;