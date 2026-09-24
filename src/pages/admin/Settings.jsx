import { useEffect, useState } from "react";

import {
  FiCheck,
  FiClock,
  FiSettings,
  FiCalendar,
  FiShield,
  FiInfo,
  FiSave,
  FiRefreshCw,
  FiArrowLeft,
  FiAlertCircle,
} from "react-icons/fi";

import { useNavigate } from "react-router-dom";

import AdminLayout from "../../components/AdminLayout";

// =====================================================
// DEFAULT SETTINGS
// =====================================================

const DEFAULT_SETTINGS = {
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

const WORKING_DAYS = [
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// =====================================================
// DAY DESCRIPTIONS
// =====================================================

const DAY_DESCRIPTIONS = {
  Tuesday:
    "Tuesday official reporting time.",

  Wednesday:
    "Wednesday official reporting time.",

  Thursday:
    "Thursday official reporting time.",

  Friday:
    "Friday official reporting time.",

  Saturday:
    "Saturday official reporting time.",
};

// =====================================================
// COMPONENT
// =====================================================

function Settings() {
  const navigate =
    useNavigate();

  const [activeTab, setActiveTab] =
    useState("General");

  const [settings, setSettings] =
    useState(
      DEFAULT_SETTINGS
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [error, setError] =
    useState("");

  // =====================================================
  // LOAD SETTINGS
  // =====================================================

  useEffect(() => {
    const loadSettings =
      async () => {
        setLoading(true);
        setError("");

        try {
          const response =
            await fetch(
              `${import.meta.env.VITE_API_URL}/api/settings`
            );

          const data =
            await response.json();

          if (
            !response.ok ||
            !data.success
          ) {
            throw new Error(
              data.message ||
                "Unable to load system settings."
            );
          }

          const serverSettings =
            data.settings || {};

          // ------------------------------------------------
          // SUPPORT OLD SERVER SETTINGS
          // ------------------------------------------------

          const legacyTime =
            serverSettings.reportingTime ||
            "07:33";

          const mergedSettings = {
            ...DEFAULT_SETTINGS,

            ...serverSettings,

            signInTimes: {
              ...DEFAULT_SETTINGS.signInTimes,

              ...(serverSettings.signInTimes ||
                {}),

              // Fallback for old setting
              Tuesday:
                serverSettings
                  .signInTimes
                  ?.Tuesday ||
                legacyTime,

              Wednesday:
                serverSettings
                  .signInTimes
                  ?.Wednesday ||
                legacyTime,

              Thursday:
                serverSettings
                  .signInTimes
                  ?.Thursday ||
                legacyTime,

              Friday:
                serverSettings
                  .signInTimes
                  ?.Friday ||
                legacyTime,

              Saturday:
                serverSettings
                  .signInTimes
                  ?.Saturday ||
                legacyTime,
            },

            signOutTime:
              serverSettings.signOutTime ||
              DEFAULT_SETTINGS.signOutTime,

            workingDays: {
              ...DEFAULT_SETTINGS.workingDays,

              ...(serverSettings.workingDays ||
                {}),
            },
          };

          setSettings(
            mergedSettings
          );

          localStorage.setItem(
            "vsamsSettings",
            JSON.stringify(
              mergedSettings
            )
          );
        } catch (err) {
          console.error(
            "Settings loading error:",
            err
          );

          // ------------------------------------------------
          // LOCAL BACKUP
          // ------------------------------------------------

          try {
            const savedSettings =
              localStorage.getItem(
                "vsamsSettings"
              );

            if (savedSettings) {
              const parsed =
                JSON.parse(
                  savedSettings
                );

              const legacyTime =
                parsed.reportingTime ||
                "07:33";

              setSettings({
                ...DEFAULT_SETTINGS,

                ...parsed,

                signInTimes: {
                  ...DEFAULT_SETTINGS.signInTimes,

                  ...(parsed.signInTimes ||
                    {}),

                  Tuesday:
                    parsed.signInTimes
                      ?.Tuesday ||
                    legacyTime,

                  Wednesday:
                    parsed.signInTimes
                      ?.Wednesday ||
                    legacyTime,

                  Thursday:
                    parsed.signInTimes
                      ?.Thursday ||
                    legacyTime,

                  Friday:
                    parsed.signInTimes
                      ?.Friday ||
                    legacyTime,

                  Saturday:
                    parsed.signInTimes
                      ?.Saturday ||
                    legacyTime,
                },

                workingDays: {
                  ...DEFAULT_SETTINGS.workingDays,

                  ...(parsed.workingDays ||
                    {}),
                },
              });
            } else {
              setSettings(
                DEFAULT_SETTINGS
              );
            }
          } catch {
            setSettings(
              DEFAULT_SETTINGS
            );
          }

          setError(
            "Unable to connect to the server. Showing the saved local settings."
          );
        } finally {
          setLoading(false);
        }
      };

    loadSettings();
  }, []);

  // =====================================================
  // UPDATE NORMAL SETTING
  // =====================================================

  const updateSetting = (
    key,
    value
  ) => {
    setSettings(
      (current) => ({
        ...current,
        [key]: value,
      })
    );

    setSaved(false);
    setError("");
  };

  // =====================================================
  // UPDATE SIGN-IN TIME
  // =====================================================

  const updateSignInTime = (
    day,
    value
  ) => {
    setSettings(
      (current) => ({
        ...current,

        signInTimes: {
          ...current.signInTimes,
          [day]: value,
        },
      })
    );

    setSaved(false);
    setError("");
  };

  // =====================================================
  // TOGGLE WORKING DAY
  // =====================================================

  const toggleWorkingDay = (
    day
  ) => {
    setSettings(
      (current) => ({
        ...current,

        workingDays: {
          ...current.workingDays,

          [day]:
            !current.workingDays[
              day
            ],
        },
      })
    );

    setSaved(false);
    setError("");
  };

  // =====================================================
  // SAVE SETTINGS
  // =====================================================

  const handleSave =
    async () => {
      setSaving(true);
      setSaved(false);
      setError("");

      try {
        const response =
          await fetch(
            `${import.meta.env.VITE_API_URL}/api/settings`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                settings
              ),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to save settings."
          );
        }

        const serverSettings =
          data.settings ||
          settings;

        const updatedSettings = {
          ...DEFAULT_SETTINGS,

          ...serverSettings,

          signInTimes: {
            ...DEFAULT_SETTINGS.signInTimes,

            ...(serverSettings.signInTimes ||
              {}),
          },

          workingDays: {
            ...DEFAULT_SETTINGS.workingDays,

            ...(serverSettings.workingDays ||
              {}),
          },
        };

        setSettings(
          updatedSettings
        );

        localStorage.setItem(
          "vsamsSettings",
          JSON.stringify(
            updatedSettings
          )
        );

        setSaved(true);

        setTimeout(() => {
          setSaved(false);
        }, 3500);
      } catch (err) {
        console.error(
          "Settings save error:",
          err
        );

        setError(
          err.message ||
            "Unable to save settings. Please make sure the backend is running."
        );
      } finally {
        setSaving(false);
      }
    };

  // =====================================================
  // RESET
  // =====================================================

  const handleReset = () => {
    const confirmed =
      window.confirm(
        "Reset all settings to the default VOTECH S7 Academy configuration?"
      );

    if (!confirmed)
      return;

    setSettings(
      DEFAULT_SETTINGS
    );

    setSaved(false);
    setError("");
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">

          <div className="flex flex-col items-center">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">

              <FiRefreshCw className="h-6 w-6 animate-spin" />

            </div>

            <p className="mt-4 text-sm font-semibold text-slate-700">
              Loading system settings...
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Please wait a moment
            </p>

          </div>

        </div>
      </AdminLayout>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <AdminLayout>

      <div className="space-y-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-start gap-4">

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/dashboard"
                )
              }
              className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
              title="Back to Dashboard"
            >
              <FiArrowLeft className="h-5 w-5" />
            </button>

            <div>

              <div className="flex items-center gap-2">

                <FiSettings className="h-5 w-5 text-blue-600" />

                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                  Administration
                </p>

              </div>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                System Settings
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage attendance rules, working schedules and system information.
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={
              handleSave
            }
            disabled={
              saving
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <FiRefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <FiSave className="h-4 w-4" />
            )}

            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>

        </div>

        {/* =================================================
            STATUS
        ================================================= */}

        {saved && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm">

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">

              <FiCheck className="h-5 w-5" />

            </div>

            <div>

              <p className="text-sm font-bold text-emerald-800">
                Settings saved successfully
              </p>

              <p className="text-xs text-emerald-600">
                Your attendance configuration has been updated.
              </p>

            </div>

          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">

              <FiAlertCircle className="h-5 w-5" />

            </div>

            <div>

              <p className="text-sm font-bold text-amber-800">
                Settings notice
              </p>

              <p className="mt-0.5 text-xs leading-5 text-amber-700">
                {error}
              </p>

            </div>

          </div>
        )}

        {/* =================================================
            SETTINGS PANEL
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* TABS */}

          <div className="border-b border-slate-200 bg-white px-4 sm:px-6">

            <div className="flex overflow-x-auto">

              {[
                {
                  name: "General",
                  icon: FiSettings,
                },
                {
                  name: "Attendance",
                  icon: FiClock,
                },
                {
                  name: "System",
                  icon: FiShield,
                },
              ].map(
                (tab) => {
                  const Icon =
                    tab.icon;

                  return (
                    <button
                      key={
                        tab.name
                      }
                      type="button"
                      onClick={() =>
                        setActiveTab(
                          tab.name
                        )
                      }
                      className={`relative flex shrink-0 items-center gap-2 px-5 py-5 text-sm font-semibold transition ${
                        activeTab ===
                        tab.name
                          ? "text-blue-600"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >

                      <Icon className="h-4 w-4" />

                      {tab.name}

                      {activeTab ===
                        tab.name && (
                        <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-blue-600" />
                      )}

                    </button>
                  );
                }
              )}

            </div>

          </div>

          {/* =================================================
              GENERAL TAB
          ================================================= */}

          {activeTab ===
            "General" && (
            <div className="p-6 sm:p-8 lg:p-10">

              <div className="mb-8 flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">

                  <FiCalendar className="h-6 w-6" />

                </div>

                <div>

                  <h2 className="text-lg font-bold text-slate-900">
                    Working Schedule
                  </h2>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                    Configure the working days and official daily sign-in times used by VSAMS.
                  </p>

                </div>

              </div>

              {/* DAILY SIGN-IN SCHEDULE */}

              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 sm:p-6">

                <div className="mb-6">

                  <h3 className="text-sm font-bold text-slate-800">
                    Daily Sign-In Schedule
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Staff who sign in after the official time for that day will automatically be marked late.
                  </p>

                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                  {WORKING_DAYS.map(
                    (day) => (
                      <div
                        key={
                          day
                        }
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                            <FiCalendar className="h-5 w-5" />

                          </div>

                          <div>

                            <p className="text-sm font-bold text-slate-800">
                              {day}
                            </p>

                            <p className="text-[11px] text-slate-400">
                              Official sign-in
                            </p>

                          </div>

                        </div>

                        <div className="mt-4">

                          <input
                            type="time"
                            value={
                              settings.signInTimes[
                                day
                              ]
                            }
                            onChange={(
                              e
                            ) =>
                              updateSignInTime(
                                day,
                                e
                                  .target
                                  .value
                              )
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          />

                        </div>

                        <p className="mt-2 text-[11px] leading-4 text-slate-400">
                          {
                            DAY_DESCRIPTIONS[
                              day
                            ]
                          }
                        </p>

                      </div>
                    )
                  )}

                </div>

              </div>

              {/* WORKING DAYS */}

              <div className="mt-8">

                <div className="mb-4">

                  <h3 className="text-sm font-bold text-slate-800">
                    Working Days
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Select the days on which staff attendance is expected.
                  </p>

                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                  {WORKING_DAYS.map(
                    (day) => {
                      const enabled =
                        settings
                          .workingDays[
                          day
                        ];

                      return (
                        <button
                          key={
                            day
                          }
                          type="button"
                          onClick={() =>
                            toggleWorkingDay(
                              day
                            )
                          }
                          className={`flex items-center justify-between rounded-2xl border p-4 text-left transition-all ${
                            enabled
                              ? "border-blue-200 bg-blue-50/70 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >

                          <div className="flex items-center gap-3">

                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                                enabled
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              <FiCalendar className="h-4 w-4" />
                            </div>

                            <span
                              className={`text-sm font-semibold ${
                                enabled
                                  ? "text-blue-800"
                                  : "text-slate-600"
                              }`}
                            >
                              {day}
                            </span>

                          </div>

                          <span
                            className={`relative h-6 w-11 rounded-full transition ${
                              enabled
                                ? "bg-blue-600"
                                : "bg-slate-300"
                            }`}
                          >

                            <span
                              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                                enabled
                                  ? "left-6"
                                  : "left-1"
                              }`}
                            />

                          </span>

                        </button>
                      );
                    }
                  )}

                </div>

              </div>

            </div>
          )}

          {/* =================================================
              ATTENDANCE TAB
          ================================================= */}

          {activeTab ===
            "Attendance" && (
            <div className="p-6 sm:p-8 lg:p-10">

              <div className="mb-8 flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">

                  <FiClock className="h-6 w-6" />

                </div>

                <div>

                  <h2 className="text-lg font-bold text-slate-900">
                    Attendance Rules
                  </h2>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                    These times are controlled by the server when processing staff attendance.
                  </p>

                </div>

              </div>

              {/* SIGN-IN SCHEDULE SUMMARY */}

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex items-start justify-between">

                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                      <FiClock className="h-5 w-5" />

                    </div>

                    <div>

                      <h3 className="text-sm font-bold text-slate-800">
                        Daily Sign-In Times
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Staff are marked late according to each day's official time.
                      </p>

                    </div>

                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-600">
                    Sign In
                  </span>

                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

                  {WORKING_DAYS.map(
                    (day) => (
                      <div
                        key={
                          day
                        }
                        className="rounded-xl bg-slate-50 p-4"
                      >

                        <p className="text-xs font-bold text-slate-500">
                          {day}
                        </p>

                        <p className="mt-2 text-xl font-bold text-slate-800">
                          {
                            settings
                              .signInTimes[
                              day
                            ]
                          }
                        </p>

                      </div>
                    )
                  )}

                </div>

              </div>

              {/* DEFAULT SIGN-OUT */}

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex items-start gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">

                      <FiClock className="h-5 w-5" />

                    </div>

                    <div>

                      <h3 className="text-sm font-bold text-slate-800">
                        Default Sign-Out Time
                      </h3>

                      <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                        This is the normal sign-out time used for staff who do not have an individual sign-out time.
                      </p>

                    </div>

                  </div>

                  <div className="w-full sm:w-44">

                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Default Time
                    </label>

                    <input
                      type="time"
                      value={
                        settings.signOutTime
                      }
                      onChange={(
                        e
                      ) =>
                        updateSetting(
                          "signOutTime",
                          e
                            .target
                            .value
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-base font-bold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />

                  </div>

                </div>

                <div className="mt-5 flex items-start gap-2 rounded-xl bg-orange-50 p-3">

                  <FiInfo className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />

                  <p className="text-xs leading-5 text-orange-700">

                    Staff members with no individual sign-out time will use the default time of{" "}

                    <strong>
                      {settings.signOutTime}
                    </strong>.

                    Individual staff times are assigned from Staff Management.

                  </p>

                </div>

              </div>

              {/* PART-TIME INFORMATION */}

              <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">

                <div className="flex items-start gap-4">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">

                    <FiInfo className="h-5 w-5" />

                  </div>

                  <div>

                    <h3 className="text-sm font-bold text-blue-900">
                      Individual Staff Sign-Out Times
                    </h3>

                    <p className="mt-1 max-w-3xl text-xs leading-5 text-blue-700">
                      Part-time teachers and staff with special schedules can be assigned their own sign-out time from Staff Management. Their assigned time overrides the default sign-out time.
                    </p>

                  </div>

                </div>

              </div>

              {/* INCOMPLETE ATTENDANCE */}

              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">

                <div className="flex items-start gap-4">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">

                    <FiInfo className="h-5 w-5" />

                  </div>

                  <div>

                    <h3 className="text-sm font-bold text-amber-900">
                      Incomplete Attendance Records
                    </h3>

                    <p className="mt-1 max-w-3xl text-xs leading-5 text-amber-700">
                      If a staff member signs in but does not complete a sign-out, the attendance record remains incomplete so the administrator can identify the missing sign-out.
                    </p>

                  </div>

                </div>

              </div>

            </div>
          )}

          {/* =================================================
              SYSTEM TAB
          ================================================= */}

          {activeTab ===
            "System" && (
            <div className="p-6 sm:p-8 lg:p-10">

              <div className="mb-8 flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">

                  <FiShield className="h-6 w-6" />

                </div>

                <div>

                  <h2 className="text-lg font-bold text-slate-900">
                    System Information
                  </h2>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                    Technical information and security details for the VOTECH S7 Academy Staff Attendance Management System.
                  </p>

                </div>

              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">

                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Institution
                  </p>

                  <p className="mt-2 text-base font-bold text-slate-800">
                    VOTECH S7 Academy
                  </p>

                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">

                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    System Name
                  </p>

                  <p className="mt-2 text-base font-bold text-slate-800">
                    VSAMS
                  </p>

                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">

                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Frontend
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    React + Tailwind CSS
                  </p>

                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">

                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Backend
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    Node.js + Express + MySQL
                  </p>

                </div>

              </div>

              <div className="mt-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">

                <div className="flex items-start gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">

                    <FiShield className="h-5 w-5" />

                  </div>

                  <div>

                    <h3 className="text-sm font-bold text-blue-900">
                      System Security
                    </h3>

                    <p className="mt-1 max-w-3xl text-xs leading-5 text-blue-700">
                      Attendance times are controlled by the server to prevent staff from manually changing attendance timestamps. Staff accounts are created and managed by the administrator.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">

                      <span className="rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-bold text-blue-700 shadow-sm">
                        Server Controlled Time
                      </span>

                      <span className="rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-bold text-blue-700 shadow-sm">
                        Administrator Managed
                      </span>

                      <span className="rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-bold text-blue-700 shadow-sm">
                        Secure Attendance
                      </span>

                    </div>

                  </div>

                </div>

              </div>

            </div>
          )}

        </div>

        {/* =================================================
            BOTTOM ACTION BAR
        ================================================= */}

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">

              <FiSettings className="h-4 w-4" />

            </div>

            <div>

              <p className="text-xs font-semibold text-slate-700">
                Configuration changes
              </p>

              <p className="text-[11px] text-slate-400">
                Save your changes after modifying the attendance rules.
              </p>

            </div>

          </div>

          <div className="flex gap-2">

            <button
              type="button"
              onClick={
                handleReset
              }
              disabled={
                saving
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >

              <FiRefreshCw className="h-4 w-4" />

              Reset

            </button>

            <button
              type="button"
              onClick={
                handleSave
              }
              disabled={
                saving
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {saving ? (
                <FiRefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <FiCheck className="h-4 w-4" />
              )}

              {saving
                ? "Saving..."
                : "Save Settings"}

            </button>

          </div>

        </div>

      </div>

    </AdminLayout>
  );
}

export default Settings;