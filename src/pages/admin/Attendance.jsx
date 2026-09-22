import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";

import {
  FiCalendar,
  FiClock,
  FiRefreshCw,
  FiSearch,
  FiUsers,
  FiCheckCircle,
  FiAlertCircle,
  FiLogOut,
  FiActivity,
} from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_API_URL;

function getTodayString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(
    2,
    "0"
  );
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) return "—";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(time) {
  if (!time) return "—";

  const value = String(time);

  const [hours, minutes] = value.split(":");

  if (hours === undefined || minutes === undefined) {
    return value;
  }

  const hourNumber = Number(hours);

  const suffix = hourNumber >= 12 ? "PM" : "AM";

  const displayHour =
    hourNumber % 12 || 12;

  return `${displayHour}:${minutes} ${suffix}`;
}

function Attendance() {
  const [search, setSearch] = useState("");

  const [selectedDate, setSelectedDate] =
    useState(getTodayString());

  const [attendance, setAttendance] = useState([]);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  // =====================================================
  // LOAD ATTENDANCE
  // =====================================================

  const loadAttendance = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/attendance/records?date=${selectedDate}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load attendance records."
        );
      }

      setAttendance(
        Array.isArray(data.attendance)
          ? data.attendance
          : []
      );
    } catch (err) {
      console.error(
        "Attendance loading error:",
        err
      );

      setAttendance([]);

      setError(
        "Unable to load attendance. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =====================================================
  // DATE CHANGE
  // =====================================================

  useEffect(() => {
    loadAttendance();
  }, [selectedDate]);

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredAttendance = useMemo(() => {
    const text = search.toLowerCase().trim();

    if (!text) return attendance;

    return attendance.filter((record) => {
      return (
        record.name
          ?.toLowerCase()
          .includes(text) ||
        record.department
          ?.toLowerCase()
          .includes(text) ||
        record.staff_id
          ?.toLowerCase()
          .includes(text)
      );
    });
  }, [attendance, search]);

  // =====================================================
  // SUMMARY
  // =====================================================

  const presentCount = filteredAttendance.filter(
    (record) => record.status === "Present"
  ).length;

  const lateCount = filteredAttendance.filter(
    (record) => record.status === "Late"
  ).length;

  const signedOutCount =
    filteredAttendance.filter(
      (record) => record.time_out
    ).length;

  const incompleteCount =
    filteredAttendance.filter(
      (record) =>
        record.time_in && !record.time_out
    ).length;

  const totalLateMinutes =
    filteredAttendance.reduce(
      (total, record) =>
        total +
        Number(record.late_minutes || 0),
      0
    );

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <AdminLayout>
      <div className="space-y-7">

        {/* =================================================
            HEADER
        ================================================= */}

        <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              <FiActivity />
              Attendance Records
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Attendance
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              View and monitor daily staff attendance,
              sign-in times, sign-out times and lateness.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <FiCalendar className="text-blue-600" />

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Selected Date
              </p>

              <p className="text-sm font-semibold text-slate-700">
                {formatDate(selectedDate)}
              </p>
            </div>
          </div>

        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <FiAlertCircle className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* =================================================
            CONTROLS
        ================================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_minmax(0,1fr)_auto]">

            {/* DATE */}

            <div className="relative">
              <FiCalendar className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                type="date"
                value={selectedDate}
                onChange={(e) =>
                  setSelectedDate(e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* SEARCH */}

            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search by staff name, ID or department..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* REFRESH */}

            <button
              type="button"
              onClick={() => loadAttendance(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiRefreshCw
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>

          </div>

        </section>

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Records
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {filteredAttendance.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FiUsers />
              </div>
            </div>
          </div>

          {/* PRESENT */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Present
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {presentCount}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <FiCheckCircle />
              </div>
            </div>
          </div>

          {/* LATE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Late
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {lateCount}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <FiClock />
              </div>
            </div>
          </div>

          {/* SIGNED OUT */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Signed Out
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {signedOutCount}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <FiLogOut />
              </div>
            </div>
          </div>

          {/* LATE MINUTES */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Late Minutes
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {totalLateMinutes}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <FiClock />
              </div>
            </div>
          </div>

        </section>

        {/* =================================================
            INCOMPLETE NOTICE
        ================================================= */}

        {incompleteCount > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <FiAlertCircle className="shrink-0" />

            <span>
              <strong>{incompleteCount}</strong>{" "}
              attendance record
              {incompleteCount !== 1 ? "s are" : " is"}{" "}
              still waiting for sign-out.
            </span>
          </div>
        )}

        {/* =================================================
            ATTENDANCE TABLE
        ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">

            <div>
              <h2 className="text-base font-bold text-slate-900">
                Daily Attendance Records
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {formatDate(selectedDate)}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
              {filteredAttendance.length} record
              {filteredAttendance.length !== 1
                ? "s"
                : ""}
            </div>

          </div>

          <div className="overflow-x-auto">

            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <FiRefreshCw className="animate-spin" />
                  Loading attendance records...
                </div>
              </div>
            ) : filteredAttendance.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">

                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <FiCalendar className="h-7 w-7" />
                </div>

                <h3 className="mt-5 font-semibold text-slate-700">
                  No attendance records
                </h3>

                <p className="mt-1 max-w-md text-sm text-slate-400">
                  There are no attendance records matching
                  the selected date and search criteria.
                </p>

              </div>
            ) : (
              <table className="w-full min-w-[900px]">

                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left">

                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Staff
                    </th>

                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Department
                    </th>

                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Sign In
                    </th>

                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Sign Out
                    </th>

                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Late
                    </th>

                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Status
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {filteredAttendance.map(
                    (record) => (
                      <tr
                        key={
                          record.attendance_id
                        }
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                      >

                        {/* STAFF */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                              {record.name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "S"}
                            </div>

                            <div>
                              <p className="font-semibold text-slate-800">
                                {record.name ||
                                  "Unknown Staff"}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                ID:{" "}
                                {record.staff_id ||
                                  "—"}
                              </p>
                            </div>

                          </div>
                        </td>

                        {/* DEPARTMENT */}

                        <td className="px-5 py-4">
                          <span className="text-sm text-slate-600">
                            {record.department ||
                              "—"}
                          </span>
                        </td>

                        {/* SIGN IN */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <FiClock className="text-slate-400" />
                            {formatTime(
                              record.time_in
                            )}
                          </div>
                        </td>

                        {/* SIGN OUT */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <FiLogOut className="text-slate-400" />

                            {record.time_out
                              ? formatTime(
                                  record.time_out
                                )
                              : (
                                <span className="text-amber-500">
                                  Pending
                                </span>
                              )}
                          </div>
                        </td>

                        {/* LATE */}

                        <td className="px-5 py-4">
                          {Number(
                            record.late_minutes || 0
                          ) > 0 ? (
                            <span className="font-semibold text-orange-600">
                              {record.late_minutes} min
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">
                              0 min
                            </span>
                          )}
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                              record.status ===
                              "Late"
                                ? "bg-orange-50 text-orange-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >

                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                record.status ===
                                "Late"
                                  ? "bg-orange-500"
                                  : "bg-emerald-500"
                              }`}
                            />

                            {record.status ||
                              "Present"}

                          </span>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>
            )}

          </div>

        </section>

      </div>
    </AdminLayout>
  );
}

export default Attendance;
