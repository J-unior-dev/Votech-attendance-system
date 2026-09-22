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

      if (!staffResponse.ok) {
        throw new Error("Failed to load staff data");
      }

      if (!attendanceResponse.ok) {
        throw new Error("Failed to load attendance data");
      }

      const staffData = await staffResponse.json();
      const attendanceData = await attendanceResponse.json();

      console.log("Dashboard staff response:", staffData);
      console.log("Dashboard attendance response:", attendanceData);

      const staffList = Array.isArray(staffData)
        ? staffData
        : staffData.staff || staffData.data || [];

      // IMPORTANT:
      // Backend returns attendance inside "attendance"
      const attendanceList = Array.isArray(attendanceData)
        ? attendanceData
        : attendanceData.attendance ||
          attendanceData.records ||
          attendanceData.data ||
          [];

      setStaff(Array.isArray(staffList) ? staffList : []);
      setAttendance(
        Array.isArray(attendanceList) ? attendanceList : []
      );
    } catch (error) {
      console.error("Dashboard loading error:", error);

      setStaff([]);
      setAttendance([]);
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

  /*
   * ============================================================
   * DASHBOARD STATISTICS
   * ============================================================
   */

  const dashboardStats = useMemo(() => {
    // Total registered staff
    const totalStaff = staff.length;

    // Active staff only
    const activeStaff = staff.filter((person) => {
      const status = String(
        person.status ?? person.statues ?? "Active"
      ).toLowerCase();

      return status !== "inactive";
    }).length;

    /*
     * Get unique staff members who signed in today.
     *
     * We use a Set so that one person cannot be counted
     * multiple times if duplicate attendance records exist.
     */
    const signedInStaffIds = new Set(
      attendance
        .filter((record) => {
          return Boolean(getSignIn(record));
        })
        .map((record) =>
          String(
            record.staff_id ??
              record.staffId ??
              record.staffID ??
              ""
          )
        )
        .filter(Boolean)
    );

    // Number of staff actually present today
    const presentToday = signedInStaffIds.size;

    /*
     * Get unique staff members who are late today.
     */
    const lateStaffIds = new Set(
      attendance
        .filter((record) => {
          return (
            Boolean(getSignIn(record)) &&
            String(record.status || "").toLowerCase() === "late"
          );
        })
        .map((record) =>
          String(
            record.staff_id ??
              record.staffId ??
              record.staffID ??
              ""
          )
        )
        .filter(Boolean)
    );

    // Number of staff who are late today
    const lateToday = lateStaffIds.size;

    /*
     * Absent = active staff who have not signed in today.
     */
    const absentToday = Math.max(
      activeStaff - presentToday,
      0
    );

    /*
     * Staff who signed in but have not signed out.
     */
    const incompleteStaffIds = new Set(
      attendance
        .filter((record) => {
          return Boolean(getSignIn(record)) && !getSignOut(record);
        })
        .map((record) =>
          String(
            record.staff_id ??
              record.staffId ??
              record.staffID ??
              ""
          )
        )
        .filter(Boolean)
    );

    const incompleteToday = incompleteStaffIds.size;

    /*
     * Staff who signed out before 5:00 PM.
     */
    const earlyDepartureStaffIds = new Set(
      attendance
        .filter((record) => {
          const signOut = getSignOut(record);

          if (!signOut) return false;

          const value = String(signOut).substring(0, 5);

          return value < "17:00";
        })
        .map((record) =>
          String(
            record.staff_id ??
              record.staffId ??
              record.staffID ??
              ""
          )
        )
        .filter(Boolean)
    );

    const earlyDepartureToday =
      earlyDepartureStaffIds.size;

    /*
     * Today's attendance percentage.
     */
    const attendanceRate =
      activeStaff > 0
        ? Math.round((presentToday / activeStaff) * 100)
        : 0;

    /*
     * Total late minutes accumulated today.
     */
    const lateMinutesToday = attendance.reduce(
      (total, record) => {
        if (
          String(record.status || "").toLowerCase() ===
          "late"
        ) {
          return (
            total + Number(record.late_minutes || 0)
          );
        }

        return total;
      },
      0
    );

    return {
      totalStaff,
      activeStaff,
      presentToday,
      lateToday,
      absentToday,
      incompleteToday,
      earlyDepartureToday,
      attendanceRate,
      lateMinutesToday,
      presentStaffIds: signedInStaffIds,
    };
  }, [staff, attendance]);

  /*
   * ============================================================
   * RECENT ATTENDANCE
   * ============================================================
   */

  const recentAttendance = useMemo(() => {
    return [...attendance]
      .sort((a, b) => {
        const aTime = getSignIn(a) || "";
        const bTime = getSignIn(b) || "";

        return String(aTime).localeCompare(String(bTime));
      })
      .slice(0, 8);
  }, [attendance]);

  /*
   * ============================================================
   * FIND STAFF FOR ATTENDANCE RECORD
   * ============================================================
   */

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

  /*
   * ============================================================
   * DASHBOARD UI
   * ============================================================
   */

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Dashboard
            </h1>

            <p className="text-gray-500 mt-1">
              Overview of staff attendance and daily activities.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiCalendar />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* STATISTICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          {/* TOTAL STAFF */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Total Staff
                </p>

                <h2 className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? "..." : dashboardStats.totalStaff}
                </h2>

                <p className="text-xs text-gray-500 mt-2">
                  {dashboardStats.activeStaff} active staff
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <FiUsers className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          {/* PRESENT TODAY */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Present Today
                </p>

                <h2 className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? "..." : dashboardStats.presentToday}
                </h2>

                <p className="text-xs text-green-600 mt-2">
                  {dashboardStats.attendanceRate}% attendance rate
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <FiUserCheck className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          {/* LATE TODAY */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Late Today
                </p>

                <h2 className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? "..." : dashboardStats.lateToday}
                </h2>

                <p className="text-xs text-orange-600 mt-2">
                  {dashboardStats.lateMinutesToday} total late minutes
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                <FiClock className="text-orange-600 text-xl" />
              </div>
            </div>
          </div>

          {/* ABSENT TODAY */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Absent Today
                </p>

                <h2 className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? "..." : dashboardStats.absentToday}
                </h2>

                <p className="text-xs text-red-600 mt-2">
                  Active staff not signed in
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <FiUserX className="text-red-600 text-xl" />
              </div>
            </div>
          </div>

        </div>

        {/* SECONDARY STATISTICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* INCOMPLETE */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Incomplete Attendance
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mt-2">
                  {loading ? "..." : dashboardStats.incompleteToday}
                </h2>

                <p className="text-xs text-gray-500 mt-2">
                  Signed in but not signed out
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-yellow-50 flex items-center justify-center">
                <FiAlertCircle className="text-yellow-600 text-xl" />
              </div>
            </div>
          </div>

          {/* EARLY DEPARTURE */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Early Departure
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mt-2">
                  {loading ? "..." : dashboardStats.earlyDepartureToday}
                </h2>

                <p className="text-xs text-gray-500 mt-2">
                  Signed out before 5:00 PM
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
                <FiLogOut className="text-purple-600 text-xl" />
              </div>
            </div>
          </div>

          {/* ATTENDANCE RATE */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Today's Attendance Rate
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mt-2">
                  {loading
                    ? "..."
                    : `${dashboardStats.attendanceRate}%`}
                </h2>

                <p className="text-xs text-gray-500 mt-2">
                  Based on active staff
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
                <FiActivity className="text-indigo-600 text-xl" />
              </div>
            </div>
          </div>

        </div>

        {/* RECENT ATTENDANCE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

          <div className="p-5 border-b border-gray-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Today's Attendance
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Staff attendance records for today.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FiZap />
              <span>
                {attendance.length} attendance record
                {attendance.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">

            {loading ? (
              <div className="p-8 text-center text-gray-500">
                Loading attendance...
              </div>
            ) : recentAttendance.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No attendance records for today.
              </div>
            ) : (
              <table className="w-full text-sm">

                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium">
                      Staff
                    </th>

                    <th className="text-left px-5 py-3 font-medium">
                      Department
                    </th>

                    <th className="text-left px-5 py-3 font-medium">
                      Sign In
                    </th>

                    <th className="text-left px-5 py-3 font-medium">
                      Sign Out
                    </th>

                    <th className="text-left px-5 py-3 font-medium">
                      Status
                    </th>

                    <th className="text-left px-5 py-3 font-medium">
                      Late Minutes
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {recentAttendance.map((record) => {
                    const person = getAttendanceStaff(record);

                    const status = String(
                      record.status || ""
                    ).toLowerCase();

                    const isLate = status === "late";

                    return (
                      <tr
                        key={
                          record.attendance_id ??
                          `${record.staff_id}-${record.attendance_date}`
                        }
                        className="hover:bg-gray-50"
                      >

                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-900">
                            {getStaffName(person)}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {getDepartment(person)}
                        </td>

                        <td className="px-5 py-4 text-gray-700">
                          {formatTime(getSignIn(record))}
                        </td>

                        <td className="px-5 py-4 text-gray-700">
                          {formatTime(getSignOut(record))}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                              isLate
                                ? "bg-orange-50 text-orange-700"
                                : "bg-green-50 text-green-700"
                            }`}
                          >
                            {isLate ? (
                              <FiClock />
                            ) : (
                              <FiCheckCircle />
                            )}

                            {record.status || "Present"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {isLate
                            ? `${Number(
                                record.late_minutes || 0
                              )} min`
                            : "—"}
                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>
            )}

          </div>
        </div>

      </div>
    </AdminLayout>
  );
}

export default Dashboard;