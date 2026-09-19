const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const settingsPath = path.join(
  __dirname,
  "../config/settings.json"
);

const defaultSettings = {
  reportingTime: "07:45",
  signOutTime: "17:00",
  workingDays: {
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: true,
  },
};

function readSettings() {
  try {
    if (!fs.existsSync(settingsPath)) {
      fs.writeFileSync(
        settingsPath,
        JSON.stringify(defaultSettings, null, 2)
      );

      return defaultSettings;
    }

    const data = fs.readFileSync(
      settingsPath,
      "utf8"
    );

    return {
      ...defaultSettings,
      ...JSON.parse(data),
      workingDays: {
        ...defaultSettings.workingDays,
        ...(JSON.parse(data).workingDays || {}),
      },
    };
  } catch (error) {
    console.error("Settings read error:", error);

    return defaultSettings;
  }
}


// =====================================================
// GET SETTINGS
// =====================================================
router.get("/", (req, res) => {
  try {
    const settings = readSettings();

    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Get settings error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load system settings.",
    });
  }
});


// =====================================================
// SAVE SETTINGS
// =====================================================
router.put("/", (req, res) => {
  try {
    const {
      reportingTime,
      signOutTime,
      workingDays,
    } = req.body;

    if (!reportingTime || !signOutTime) {
      return res.status(400).json({
        success: false,
        message: "Reporting time and sign-out time are required.",
      });
    }

    const updatedSettings = {
      reportingTime,
      signOutTime,
      workingDays: {
        ...defaultSettings.workingDays,
        ...(workingDays || {}),
      },
    };

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
      message: "Settings saved successfully.",
      settings: updatedSettings,
    });
  } catch (error) {
    console.error("Save settings error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to save system settings.",
    });
  }
});


module.exports = router;