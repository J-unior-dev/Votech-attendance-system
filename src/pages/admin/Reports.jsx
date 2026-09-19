import { useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiPrinter,
  FiRefreshCw,
  FiFileText,
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiUserX,
  FiAlertCircle,
} from "react-icons/fi";

import AdminLayout from "../../components/AdminLayout";
import SchoolLogo from "../../components/SchoolLogo";

const API_BASE_URL ="http://localhost:5000";
function Reports() {
  const today = new Date();

  const [selectedMonth, setSelectedMonth] = useState(
    today.getMonth() + 1
  );

  const [selectedYear, setSelectedYear] = useState(
    today.getFullYear()
  );

  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // MONTH NAMES
  // =====================================================
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // =====================================================
  // LOAD MONTHLY REPORT
  // =====================================================
  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/attendance/monthly-report?month=${selectedMonth}&year=${selectedYear}`
      );

      if (!response.ok) {
        throw new Error("Unable to load monthly report.");
      }

      const data = await response.json();

      const rows =
        data?.report ||
        data?.monthlyReport ||
        data?.attendance ||
        data?.data ||
        [];

      setReport(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error("Report error:", err);

      setError(
        err.message ||
          "Unable to load the monthly attendance report."
      );

      setReport([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [selectedMonth, selectedYear]);

  // =====================================================
  // HELPERS
  // =====================================================
  const getValue = (row, keys, fallback = 0) => {
    for (const key of keys) {
      if (
        row?.[key] !== undefined &&
        row?.[key] !== null
      ) {
        return row[key];
      }
    }

    return fallback;
  };

  const getName = (row) =>
    getValue(
      row,
      [
        "name",
        "staff_name",
        "staffName",
      ],
      "Unknown Staff"
    );

  const getDepartment = (row) =>
    getValue(
      row,
      [
        "department",
        "department_name",
        "departmentName",
      ],
      "—"
    );

  const getPresentDays = (row) =>
    Number(
      getValue(
        row,
        [
          "Present_Days",
          "present_days",
          "PresentDays",
          "presentDays",
        ],
        0
      )
    );

  const getLateDays = (row) =>
    Number(
      getValue(
        row,
        [
          "Late_Days",
          "late_days",
          "LateDays",
          "lateDays",
        ],
        0
      )
    );

  const getAbsentDays = (row) =>
    Number(
      getValue(
        row,
        [
          "Absent_Days",
          "absent_days",
          "AbsentDays",
          "absentDays",
        ],
        0
      )
    );

  const getLateMinutes = (row) =>
    Number(
      getValue(
        row,
        [
          "Total_Late_Minutes",
          "total_late_minutes",
          "Total_Late_Min",
          "total_late_min",
          "late_minutes",
          "Late_Minutes",
        ],
        0
      )
    );

  // =====================================================
  // SUMMARY
  // =====================================================
  const summary = useMemo(() => {
    const totalStaff = report.length;

    const presentDays = report.reduce(
      (total, row) => total + getPresentDays(row),
      0
    );

    const lateDays = report.reduce(
      (total, row) => total + getLateDays(row),
      0
    );

    const absentDays = report.reduce(
      (total, row) => total + getAbsentDays(row),
      0
    );

    const lateMinutes = report.reduce(
      (total, row) => total + getLateMinutes(row),
      0
    );

    return {
      totalStaff,
      presentDays,
      lateDays,
      absentDays,
      lateMinutes,
    };
  }, [report]);

  // =====================================================
  // FORMAT LATE MINUTES
  // =====================================================
  const formatLateMinutes = (minutes) => {
    const value = Number(minutes) || 0;

    if (value < 60) {
      return `${value} min`;
    }

    const hours = Math.floor(value / 60);
    const remaining = value % 60;

    if (remaining === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${remaining} min`;
  };

  // =====================================================
  // PRINT REPORT
  // =====================================================
  const printReport = () => {
    if (report.length === 0) {
      setError(
        "There is no report data available to print."
      );
      return;
    }

    try {
      const monthName = months[selectedMonth - 1];

      const printWindow = window.open(
        "",
        "_blank",
        "width=1200,height=800"
      );

      if (!printWindow) {
        setError(
          "Please allow pop-ups in your browser to print the report."
        );
        return;
      }

      const rows = report
        .map((row, index) => {
          const present = getPresentDays(row);
          const late = getLateDays(row);
          const absent = getAbsentDays(row);
          const lateMin = getLateMinutes(row);

          return `
            <tr>
              <td class="number">${index + 1}</td>

              <td class="staff-name">
                ${getName(row)}
              </td>

              <td>
                ${getDepartment(row)}
              </td>

              <td class="center present">
                ${present}
              </td>

              <td class="center late">
                ${late}
              </td>

              <td class="center absent">
                ${absent}
              </td>

              <td class="center total-late">
                ${lateMin}
              </td>
            </tr>
          `;
        })
        .join("");

      printWindow.document.write(`
        <!DOCTYPE html>

        <html>

        <head>

          <title>
            VOTECH S7 ACADEMY - Monthly Attendance Report
          </title>

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <style>

            @page {
              size: A4 landscape;
              margin: 10mm;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: white;
              color: #0f172a;
              font-family:
                Arial,
                Helvetica,
                sans-serif;
            }

            body {
              width: 100%;
            }

            .report-page {
              width: 100%;
              min-height: 190mm;
            }

            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }

            .brand {
              display: flex;
              align-items: center;
              gap: 10px;
            }

            .logo {
              width: 45px;
              height: 45px;
              object-fit: contain;
            }

            .academy {
              font-size: 19px;
              font-weight: 800;
              letter-spacing: 0.3px;
            }

            .subtitle {
              margin-top: 2px;
              font-size: 10px;
              color: #64748b;
              font-weight: 600;
            }

            .report-title {
              text-align: right;
            }

            .report-title h1 {
              margin: 0;
              font-size: 18px;
              font-weight: 800;
            }

            .report-title p {
              margin: 3px 0 0;
              font-size: 10px;
              color: #475569;
            }

            .summary {
              display: grid;
              grid-template-columns:
                repeat(4, 1fr);
              gap: 8px;
              margin-bottom: 12px;
            }

            .summary-box {
              border: 1px solid #cbd5e1;
              border-radius: 5px;
              padding: 7px 9px;
            }

            .summary-label {
              font-size: 8px;
              color: #64748b;
              font-weight: 700;
              text-transform: uppercase;
            }

            .summary-value {
              margin-top: 2px;
              font-size: 15px;
              font-weight: 800;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }

            th {
              background: #0f172a;
              color: white;
              padding: 7px 6px;
              border: 1px solid #0f172a;
              font-size: 9px;
              font-weight: 800;
              text-transform: uppercase;
            }

            td {
              padding: 6px;
              border: 1px solid #cbd5e1;
              font-size: 9px;
              vertical-align: middle;
            }

            tbody tr:nth-child(even) {
              background: #f8fafc;
            }

            .number {
              width: 5%;
              text-align: center;
              color: #64748b;
            }

            .staff-name {
              width: 25%;
              font-weight: 700;
            }

            .center {
              text-align: center;
              font-weight: 700;
            }

            .present {
              color: #047857;
            }

            .late {
              color: #b45309;
            }

            .absent {
              color: #dc2626;
            }

            .total-late {
              color: #7c3aed;
            }

            .footer {
              margin-top: 10px;
              display: flex;
              justify-content: space-between;
              font-size: 8px;
              color: #64748b;
            }

            .signature {
              margin-top: 25px;
              display: flex;
              justify-content: space-between;
              font-size: 9px;
            }

            .signature-line {
              width: 180px;
              border-top: 1px solid #64748b;
              padding-top: 4px;
              text-align: center;
            }

            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              tr {
                page-break-inside: avoid;
              }

              thead {
                display: table-header-group;
              }
            }

          </style>

        </head>

        <body>

          <div class="report-page">

            <div class="header">

              <div class="brand">

                <img
                  src="${window.location.origin}/src/assets/votech-s7-academy-logo-transparent.png"
                  class="logo"
                />

                <div>

                  <div class="academy">
                    VOTECH S7 ACADEMY
                  </div>

                  <div class="subtitle">
                    STAFF ATTENDANCE MANAGEMENT SYSTEM
                  </div>

                </div>

              </div>

              <div class="report-title">

                <h1>
                  MONTHLY ATTENDANCE REPORT
                </h1>

                <p>
                  ${monthName} ${selectedYear}
                </p>

              </div>

            </div>


            <div class="summary">

              <div class="summary-box">
                <div class="summary-label">
                  Total Staff
                </div>

                <div class="summary-value">
                  ${summary.totalStaff}
                </div>
              </div>

              <div class="summary-box">
                <div class="summary-label">
                  Present Days
                </div>

                <div class="summary-value">
                  ${summary.presentDays}
                </div>
              </div>

              <div class="summary-box">
                <div class="summary-label">
                  Late Days
                </div>

                <div class="summary-value">
                  ${summary.lateDays}
                </div>
              </div>

              <div class="summary-box">
                <div class="summary-label">
                  Total Late Minutes
                </div>

                <div class="summary-value">
                  ${summary.lateMinutes}
                </div>
              </div>

            </div>


            <table>

              <thead>

                <tr>
                  <th>No.</th>
                  <th>Staff Name</th>
                  <th>Department</th>
                  <th>Present Days</th>
                  <th>Late Days</th>
                  <th>Absent Days</th>
                  <th>Total Late (Min)</th>
                </tr>

              </thead>

              <tbody>

                ${rows}

              </tbody>

            </table>


            <div class="footer">

              <div>
                Generated by VOTECH S7 Academy Staff Attendance System
              </div>

              <div>
                Report Period: ${monthName} ${selectedYear}
              </div>

            </div>


            <div class="signature">

              <div class="signature-line">
                Prepared By
              </div>

              <div class="signature-line">
                Checked By
              </div>

              <div class="signature-line">
                Authorized Signature
              </div>

            </div>

          </div>


          <script>

            window.onload = function() {

              setTimeout(function() {
                window.print();
              }, 500);

            };

          </script>

        </body>

        </html>
      `);

      printWindow.document.close();
    } catch (err) {
      console.error("Print report error:", err);

      setError(
        "Unable to prepare the report for printing."
      );
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-7">
        {/* =====================================================
            PAGE HEADER
        ===================================================== */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              Reports
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Monthly Attendance Reports
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              View attendance summaries and print official monthly reports.
            </p>
          </div>

          {/* CONTROLS */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <FiCalendar className="h-4 w-4 text-blue-600" />

              <select
                value={selectedMonth}
                onChange={(e) =>
                  setSelectedMonth(Number(e.target.value))
                }
                className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
              >
                {months.map((month, index) => (
                  <option
                    key={month}
                    value={index + 1}
                  >
                    {month}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) =>
                  setSelectedYear(Number(e.target.value))
                }
                className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
              >
                {Array.from(
                  { length: 6 },
                  (_, index) => today.getFullYear() - index
                ).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={loadReport}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiRefreshCw
                className={`h-4 w-4 ${
                  loading ? "animate-spin" : ""
                }`}
              />

              Refresh
            </button>

            <button
              type="button"
              onClick={printReport}
              disabled={loading || report.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiPrinter className="h-4 w-4" />
              Print Report
            </button>
          </div>
        </div>

        {/* =====================================================
            ERROR
        ===================================================== */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="text-sm font-bold">
                Report Error
              </p>

              <p className="mt-1 text-xs">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* =====================================================
            REPORT INFO BANNER
        ===================================================== */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-6 text-white shadow-lg shadow-blue-200 sm:p-8">
          <div className="relative z-10">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
              <FiFileText className="h-5 w-5" />
            </div>

            <h2 className="text-2xl font-bold">
              {months[selectedMonth - 1]} {selectedYear} Report
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Monthly summary of staff attendance, late days,
              absent days, and accumulated lateness.
            </p>
          </div>

          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 right-20 h-80 w-80 rounded-full bg-indigo-900/10" />
        </section>

        {/* =====================================================
            SUMMARY CARDS
        ===================================================== */}
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {/* STAFF */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Staff
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {loading ? "—" : summary.totalStaff}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Staff included
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <FiUsers className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* PRESENT */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Present Days
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {loading ? "—" : summary.presentDays}
                </p>

                <p className="mt-1 text-xs text-emerald-600">
                  Attendance recorded
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <FiCheckCircle className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* LATE */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Late Days
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {loading ? "—" : summary.lateDays}
                </p>

                <p className="mt-1 text-xs text-amber-600">
                  Late attendance records
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <FiClock className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* LATE MINUTES */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Late
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {loading ? "—" : summary.lateMinutes}
                </p>

                <p className="mt-1 text-xs text-violet-600">
                  Accumulated minutes
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                <FiClock className="h-6 w-6" />
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            REPORT TABLE
        ===================================================== */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Monthly Staff Summary
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Attendance summary for{" "}
                {months[selectedMonth - 1]} {selectedYear}
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-600" />

              <span className="text-xs font-semibold text-slate-600">
                {report.length} staff
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    #
                  </th>

                  <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Staff Name
                  </th>

                  <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Department
                  </th>

                  <th className="px-5 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Present Days
                  </th>

                  <th className="px-5 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Late Days
                  </th>

                  <th className="px-5 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Absent Days
                  </th>

                  <th className="px-5 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Total Late
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-5 py-14 text-center"
                    >
                      <FiRefreshCw className="mx-auto h-6 w-6 animate-spin text-blue-600" />

                      <p className="mt-3 text-sm font-medium text-slate-500">
                        Loading monthly report...
                      </p>
                    </td>
                  </tr>
                ) : report.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-5 py-14 text-center"
                    >
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                        <FiFileText className="h-5 w-5 text-slate-400" />
                      </div>

                      <p className="mt-3 text-sm font-bold text-slate-700">
                        No report data available
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        There are no attendance records for this month.
                      </p>
                    </td>
                  </tr>
                ) : (
                  report.map((row, index) => {
                    const present = getPresentDays(row);
                    const late = getLateDays(row);
                    const absent = getAbsentDays(row);
                    const lateMin = getLateMinutes(row);

                    return (
                      <tr
                        key={
                          row.staff_id ||
                          row.staffId ||
                          index
                        }
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4 text-sm font-medium text-slate-400">
                          {index + 1}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                              {getName(row)
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-800">
                                {getName(row)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {getDepartment(row)}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex min-w-10 justify-center rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700">
                            {present}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex min-w-10 justify-center rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700">
                            {late}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex min-w-10 justify-center rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700">
                            {absent}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <div>
                            <span className="text-sm font-bold text-violet-700">
                              {lateMin}
                            </span>

                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {formatLateMinutes(lateMin)}
                            </p>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {!loading && report.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td
                      colSpan="3"
                      className="px-5 py-4 text-right text-xs font-bold uppercase text-slate-600"
                    >
                      Total
                    </td>

                    <td className="px-5 py-4 text-center text-sm font-bold text-emerald-700">
                      {summary.presentDays}
                    </td>

                    <td className="px-5 py-4 text-center text-sm font-bold text-amber-700">
                      {summary.lateDays}
                    </td>

                    <td className="px-5 py-4 text-center text-sm font-bold text-rose-700">
                      {summary.absentDays}
                    </td>

                    <td className="px-5 py-4 text-center text-sm font-bold text-violet-700">
                      {summary.lateMinutes}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>

        {/* =====================================================
            PRINT NOTE
        ===================================================== */}
        <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <FiPrinter className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

          <div>
            <p className="text-sm font-bold text-blue-800">
              Printing this report
            </p>

            <p className="mt-1 text-xs leading-5 text-blue-700">
              Click <strong>Print Report</strong>. The generated document
              is formatted specifically for <strong>A4 Landscape</strong>,
              allowing all attendance columns to fit on one page width.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default Reports;
