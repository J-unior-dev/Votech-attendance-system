import { useEffect, useMemo, useState } from "react";
import {
  FiUsers,
  FiUserCheck,
  FiClock,
  FiUserX,
  FiCheckCircle,
  FiAlertCircle,
  FiLogOut,
  FiArrowUpRight,
  FiCalendar,
  FiActivity,
  FiZap,
} from "react-icons/fi";

import AdminLayout from "../../components/AdminLayout";

const API_BASE = import.meta.env.VITE_API_URL;

function Dashboard() {
  const [staff, setStaff] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();

  const todayString = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const formattedDate = today.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [staffResponse, attendanceResponse] = await Promise.all([
        fetch(`${API_BASE}/api/staff`),
        fetch(`${API_BASE}/api/attendance/records?date=${todayString}`),
      ]);

      const staffData = await staffResponse.json();
      const attendanceData = await attendanceResponse.json();

      const staffList = Array.isArray(staffData)
        ? staffData
        : staffData.staff || staffData.data || [];

      const attendanceList = Array.isArray(attendanceData)
        ? attendanceData
        : attendanceData.records || attendanceData.data || [];

      setStaff(staffList);
      setAttendance(attendanceList);
    } catch (error) {
      console.error("Dashboard loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStaffId = (person) =>
    person.staff_id ??
    person.id ??
    person.staffId ??
    person.staffID;

  const getStaffName = (person) =>
    person.name ||
    person.staff_name ||
    person.full_name ||
    person.fullName ||
    "Unknown Staff";

  const getDepartment = (person) =>
    person.department_name ||
    person.department ||
    person.departmentName ||
    "—";

  const getSignIn = (record) =>
    record.time_in ||
    record.sign_in ||
    record.check_in ||
    record.timeIn ||
    record.signIn ||
    null;

  const getSignOut = (record) =>
    record.time_out ||
    record.sign_out ||
    record.check_out ||
    record.timeOut ||
    record.signOut ||
    null;

  const formatTime = (time) => {
    if (!time) return "—";

    const value = String(time);

    if (/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
      const [hours, minutes] = value.split(":");
      const date = new Date();
      date.setHours(Number(hours), Number(minutes), 0, 0);

      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    const parsed = new Date(time);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return value;
  };

  const dashboardStats = useMemo(() => {
    const totalStaff = staff.length;

    const activeStaff = staff.filter((person) => {
      const status = String(
        person.status ?? person.statues ?? "Active"
      ).toLowerCase();

      return status !== "inactive";
    }).length;

    const presentRecords = attendance.filter((record) => {
      return Boolean(getSignIn(record));
    });

    const presentToday = presentRecords.length;

    const lateToday = attendance.filter((record) => {
      return String(record.status || "").toLowerCase() === "late";
    }).length;

    const presentStaffIds = new Set(
      presentRecords
        .map((record) =>
          String(
            record.staff_id ??
              record.staffId ??
              record.staffID ??
              record.id ??
              ""
          )
        )
        .filter(Boolean)
    );

    const absentToday = Math.max(totalStaff - presentToday, 0);

    const incompleteToday = attendance.filter((record) => {
      return Boolean(getSignIn(record)) && !getSignOut(record);
    }).length;

    const earlyDepartureToday = attendance.filter((record) => {
      const signOut = getSignOut(record);

      if (!signOut) return false;

      const value = String(signOut).substring(0, 5);

      return value < "17:00";
    }).length;

    const attendanceRate =
      totalStaff > 0
        ? Math.round((presentToday / totalStaff) * 100)
        : 0;

    return {
      totalStaff,
      activeStaff,
      presentToday,
      lateToday,
      absentToday,
      incompleteToday,
      earlyDepartureToday,
      attendanceRate,
      presentStaffIds,
    };
  }, [staff, attendance]);

  const recentAttendance = useMemo(() => {
    return [...attendance]
      .sort((a, b) => {
        const aTime = getSignIn(a) || "";
        const bTime = getSignIn(b) || "";

        return String(aTime).localeCompare(String(bTime));
      })
      .slice(0, 8);
  }, [attendance]);

  const getAttendanceStaff = (record) => {
    const recordId = String(
      record.staff_id ??
        record.staffId ??
        record.staffID ??
        record.id ??
        ""
    );

    const found = staff.find(
      (person) => String(getStaffId(person)) === recordId
    );

    if (found) return found;

    return {
      name:
        record.staff_name ||
        record.name ||
        record.full_name ||
        "Unknown Staff",
      department:
        record.department_name ||
        record.department ||
        "—",
    };
  };

  return (
    <AdminLayout>
      <div className="space-y-7">
        {/* PAGE HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              Dashboard
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Attendance Overview
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Monitor today's staff attendance and activity.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
            <FiCalendar className="h-4 w-4 text-blue-600" />

            <span className="text-sm font-medium text-slate-600">
              {formattedDate}
            </span>
          </div>
        </div>

        {/* WELCOME BANNER */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-7 text-white shadow-lg shadow-blue-200 sm:p-8">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <FiActivity className="h-5 w-5" />
            </div>

            <h2 className="text-2xl font-bold sm:text-3xl">
              Welcome back, Administrator 👋
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
              Here's what's happening with staff attendance today. Keep
              track of arrivals, late staff, and attendance activity from
              one place.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-blue-50 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Attendance system is active
            </div>
          </div>

          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 right-20 h-80 w-80 rounded-full bg-indigo-900/10" />
        </section>

        {/* MAIN STATISTICS */}
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {/* TOTAL STAFF */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <FiUsers className="h-6 w-6" />
              </div>

              <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
                <FiArrowUpRight className="h-3 w-3" />
                Active
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium text-slate-500">
                Total Staff
              </p>

              <div className="mt-1 flex items-end justify-between">
                <p className="text-3xl font-bold tracking-tight text-slate-900">
                  {loading ? "—" : dashboardStats.totalStaff}
                </p>

                <p className="text-xs font-medium text-slate-400">
                  {dashboardStats.activeStaff} active
                </p>
              </div>
            </div>
          </div>

          {/* PRESENT */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <FiUserCheck className="h-6 w-6" />
              </div>

              <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
                {dashboardStats.attendanceRate}%
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium text-slate-500">
                Present Today
              </p>

              <div className="mt-1 flex items-end justify-between">
                <p className="text-3xl font-bold tracking-tight text-slate-900">
                  {loading ? "—" : dashboardStats.presentToday}
                </p>

                <p className="text-xs font-medium text-slate-400">
                  checked in
                </p>
              </div>
            </div>
          </div>

          {/* LATE */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <FiClock className="h-6 w-6" />
              </div>

              <div className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600">
                Attention
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium text-slate-500">
                Late Today
              </p>

              <div className="mt-1 flex items-end justify-between">
                <p className="text-3xl font-bold tracking-tight text-slate-900">
                  {loading ? "—" : dashboardStats.lateToday}
                </p>

                <p className="text-xs font-medium text-slate-400">
                  late arrivals
                </p>
              </div>
            </div>
          </div>

          {/* ABSENT */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <FiUserX className="h-6 w-6" />
              </div>

              <div className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600">
                Today
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium text-slate-500">
                Absent Today
              </p>

              <div className="mt-1 flex items-end justify-between">
                <p className="text-3xl font-bold tracking-tight text-slate-900">
                  {loading ? "—" : dashboardStats.absentToday}
                </p>

                <p className="text-xs font-medium text-slate-400">
                  not checked in
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECONDARY STATISTICS */}
        <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FiCheckCircle className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500">
                  Attendance Rate
                </p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {dashboardStats.attendanceRate}%
                </p>
              </div>
            </div>

            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{
                  width: `${Math.min(
                    dashboardStats.attendanceRate,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <FiAlertCircle className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500">
                  Incomplete Records
                </p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {dashboardStats.incompleteToday}
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold text-slate-400">
              No sign-out
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <FiLogOut className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500">
                  Early Departures
                </p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {dashboardStats.earlyDepartureToday}
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold text-slate-400">
              Before 5:00 PM
            </span>
          </div>
        </section>

        {/* ATTENDANCE + QUICK ACTIONS */}
        <section className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(300px,0.8fr)]">
          {/* ATTENDANCE TABLE */}
          <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Today's Attendance
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Staff attendance records for today
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-slate-600">
                  {dashboardStats.presentToday} present
                </span>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Staff
                    </th>

                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Department
                    </th>

                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Sign In
                    </th>

                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Sign Out
                    </th>

                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-12 text-center text-sm text-slate-500"
                      >
                        Loading attendance...
                      </td>
                    </tr>
                  ) : recentAttendance.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-12 text-center"
                      >
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                          <FiCalendar className="h-5 w-5 text-slate-400" />
                        </div>

                        <p className="mt-3 text-sm font-semibold text-slate-700">
                          No attendance records yet
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Staff attendance will appear here after scanning.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    recentAttendance.map((record, index) => {
                      const person = getAttendanceStaff(record);

                      const status = String(
                        record.status || "Present"
                      ).toLowerCase();

                      const isLate = status === "late";

                      return (
                        <tr
                          key={
                            record.attendance_id ||
                            record.id ||
                            `${getStaffId(person)}-${index}`
                          }
                          className="transition hover:bg-slate-50/80"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                                {getStaffName(person)
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-800">
                                  {getStaffName(person)}
                                </p>

                                <p className="text-[11px] text-slate-400">
                                  Staff ID:{" "}
                                  {getStaffId(person) || "—"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {getDepartment(person)}
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-slate-700">
                              {formatTime(getSignIn(record))}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-slate-700">
                              {formatTime(getSignOut(record))}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${
                                isLate
                                  ? "bg-amber-50 text-amber-700"
                                  : getSignIn(record) &&
                                    !getSignOut(record)
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isLate
                                    ? "bg-amber-500"
                                    : getSignIn(record) &&
                                      !getSignOut(record)
                                    ? "bg-blue-500"
                                    : "bg-emerald-500"
                                }`}
                              />

                              {isLate
                                ? "Late"
                                : getSignIn(record) &&
                                  !getSignOut(record)
                                ? "Incomplete"
                                : "Present"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 px-6 py-4">
              <a
                href="/admin/attendance"
                className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 transition hover:text-blue-700"
              >
                View all attendance
                <FiArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Quick Actions
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Common administration tasks
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FiZap className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <a
                href="/admin/staff"
                className="group flex items-center gap-4 rounded-xl border border-slate-100 p-4 transition hover:border-blue-100 hover:bg-blue-50/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                  <FiUsers className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800">
                    Manage Staff
                  </p>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Add or update staff members
                  </p>
                </div>

                <FiArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-blue-600" />
              </a>

              <a
                href="/admin/attendance"
                className="group flex items-center gap-4 rounded-xl border border-slate-100 p-4 transition hover:border-emerald-100 hover:bg-emerald-50/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                  <FiCheckCircle className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800">
                    Attendance
                  </p>

                  <p className="mt-0.5 text-xs text-slate-400">
                    View today's records
                  </p>
                </div>

                <FiArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-emerald-600" />
              </a>

              <a
                href="/admin/qr-management"
                className="group flex items-center gap-4 rounded-xl border border-slate-100 p-4 transition hover:border-violet-100 hover:bg-violet-50/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 transition group-hover:bg-violet-600 group-hover:text-white">
                  <FiActivity className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800">
                    QR Tokens
                  </p>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Manage daily QR access
                  </p>
                </div>

                <FiArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-violet-600" />
              </a>

              <a
                href="/admin/reports"
                className="group flex items-center gap-4 rounded-xl border border-slate-100 p-4 transition hover:border-orange-100 hover:bg-orange-50/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 transition group-hover:bg-orange-600 group-hover:text-white">
                  <FiCalendar className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800">
                    Reports
                  </p>

                  <p className="mt-0.5 text-xs text-slate-400">
                    View monthly attendance
                  </p>
                </div>

                <FiArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-orange-600" />
              </a>
            </div>

            <div className="mt-6 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-700">
                    System Status
                  </p>

                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Attendance system is operational
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

export default Dashboard;
