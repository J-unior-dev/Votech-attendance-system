import { useState } from "react";
import {
  FiLogOut,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiUser,
  FiBriefcase,
  FiCalendar,
  FiCamera,
  FiX,
  FiShield,
  FiActivity,
} from "react-icons/fi";
import { Html5Qrcode } from "html5-qrcode";

import SchoolLogo from "../../components/SchoolLogo";

function StaffDashboard() {
  const [action, setAction] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [qrToken, setQrToken] = useState("");
  const [scanning, setScanning] = useState(false);

  const staff = JSON.parse(localStorage.getItem("staff") || "{}");

  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const shortDate = today.toLocaleDateString("en-GB");

  const handleLogout = () => {
    localStorage.removeItem("staff");
    localStorage.removeItem("staffToken");
    localStorage.removeItem("rememberMe");

    window.location.href = "/login";
  };

  // =====================================================
  // START QR SCANNER
  // =====================================================
  const startScanner = async () => {
    setMessage("");
    setError("");
    setQrToken("");
    setScannerOpen(true);
    setScanning(true);

    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("qr-reader");

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            console.log("QR TOKEN SCANNED:", decodedText);

            setQrToken(decodedText);
            localStorage.setItem("qrToken", decodedText);

            setMessage(
              "QR code scanned successfully. You can now sign in or sign out."
            );

            await scanner.stop();
            scanner.clear();

            setScanning(false);
            setScannerOpen(false);
          },
          () => {
            // Ignore normal scanning failures
          }
        );
      } catch (err) {
        console.error("QR scanner error:", err);

        setScanning(false);
        setScannerOpen(false);

        setError(
          "Unable to start the camera. Please allow camera access and try again."
        );
      }
    }, 300);
  };

  // =====================================================
  // CLOSE QR SCANNER
  // =====================================================
  const closeScanner = () => {
    setScannerOpen(false);
    setScanning(false);
  };

  // =====================================================
  // ATTENDANCE
  // =====================================================
  const handleAttendance = async (selectedAction) => {
    setAction(selectedAction);
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const token = qrToken || localStorage.getItem("qrToken");

      if (!token) {
        setError("Please scan today's QR code first.");
        setLoading(false);
        return;
      }

      if (!staff.staff_id) {
        setError(
          "Staff information could not be found. Please log in again."
        );
        setLoading(false);
        return;
      }

      const response = await fetch(
       "http://localhost:5000/api/attendance/scan",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            staff_id: staff.staff_id,
            token: token,
            action: selectedAction,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Attendance could not be recorded.");
        return;
      }

      setMessage(data.message);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to connect to the attendance server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      {/* =====================================================
          HEADER
      ===================================================== */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* BRAND */}
          <div className="flex min-w-0 items-center gap-3">
            <SchoolLogo className="h-11 w-11 shrink-0 sm:h-12 sm:w-12" />

            <div className="min-w-0">
              <p className="truncate text-base font-bold tracking-wide text-slate-900 sm:text-lg">
                VOTECH S7
              </p>

              <p className="truncate text-[10px] font-medium text-slate-500 sm:text-xs">
                Staff Attendance System
              </p>
            </div>
          </div>

          {/* STAFF + LOGOUT */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">
                {staff.name || "Staff Member"}
              </p>

              <p className="text-[11px] text-slate-500">
                {staff.department_name || "Staff Portal"}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              {(staff.name || "S").charAt(0).toUpperCase()}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <FiLogOut className="h-5 w-5" />

              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {/* PAGE HEADER */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              Staff Portal
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Welcome, {staff.name || "Staff Member"} 👋
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Record your daily attendance quickly and securely.
            </p>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
            <FiCalendar className="h-4 w-4 text-blue-600" />

            <span className="text-xs font-semibold text-slate-600 sm:text-sm">
              {formattedDate}
            </span>
          </div>
        </div>

        {/* =====================================================
            WELCOME BANNER
        ===================================================== */}
        <section className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-6 text-white shadow-lg shadow-blue-200 sm:p-8">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <FiActivity className="h-5 w-5" />
            </div>

            <h2 className="text-2xl font-bold sm:text-3xl">
              Good to see you today!
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
              Scan the QR code displayed in the staff room to record your
              attendance. The system automatically records your exact time.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                System Active
              </span>

              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur">
                <FiShield className="h-3.5 w-3.5" />
                Secure Attendance
              </span>
            </div>
          </div>

          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 right-10 h-80 w-80 rounded-full bg-indigo-900/10" />
        </section>

        {/* =====================================================
            STAFF INFORMATION
        ===================================================== */}
        <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* NAME */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <FiUser className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">
                  Staff Name
                </p>

                <p className="mt-1 truncate text-sm font-bold text-slate-800 sm:text-base">
                  {staff.name || "Not available"}
                </p>
              </div>
            </div>
          </div>

          {/* DEPARTMENT */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                <FiBriefcase className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">
                  Department
                </p>

                <p className="mt-1 truncate text-sm font-bold text-slate-800 sm:text-base">
                  {staff.department_name || "Not available"}
                </p>
              </div>
            </div>
          </div>

          {/* DATE */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <FiCalendar className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500">
                  Today's Date
                </p>

                <p className="mt-1 text-sm font-bold text-slate-800 sm:text-base">
                  {shortDate}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            ATTENDANCE SECTION
        ===================================================== */}
        <section className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {/* CARD HEADER */}
            <div className="border-b border-slate-100 px-5 py-6 text-center sm:px-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <FiClock className="h-7 w-7" />
              </div>

              <h2 className="mt-4 text-xl font-bold text-slate-900 sm:text-2xl">
                Record Attendance
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Scan today's QR code first, then choose whether you are
                signing in or signing out.
              </p>
            </div>

            <div className="p-5 sm:p-8">
              {/* =====================================================
                  QR SCANNER
              ===================================================== */}
              {!scannerOpen && (
                <button
                  type="button"
                  onClick={startScanner}
                  className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-5 py-5 text-base font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 active:scale-[0.99] sm:text-lg"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                    <FiCamera className="h-6 w-6 transition group-hover:scale-110" />
                  </span>

                  Scan Today's QR Code
                </button>
              )}

              {/* SCANNER */}
              {scannerOpen && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 sm:text-base">
                        Scan QR Code
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Point your camera at the QR code in the staff room.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={closeScanner}
                      className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>

                  <div
                    id="qr-reader"
                    className="mx-auto min-h-[280px] max-w-md overflow-hidden rounded-2xl bg-black"
                  />

                  {scanning && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs font-medium text-slate-500">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
                      Looking for QR code...
                    </div>
                  )}
                </div>
              )}

              {/* =====================================================
                  QR SUCCESS
              ===================================================== */}
              {qrToken && (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <FiCheckCircle className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-emerald-800">
                      QR Code Verified
                    </p>

                    <p className="mt-1 text-xs leading-5 text-emerald-700">
                      The QR code is ready. Choose Sign In or Sign Out below.
                    </p>
                  </div>
                </div>
              )}

              {/* =====================================================
                  SUCCESS MESSAGE
              ===================================================== */}
              {message && (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <FiCheckCircle className="h-5 w-5" />
                  </div>

                  <p className="pt-1 text-sm font-semibold leading-5 text-emerald-700">
                    {message}
                  </p>
                </div>
              )}

              {/* =====================================================
                  ERROR MESSAGE
              ===================================================== */}
              {error && (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <FiAlertCircle className="h-5 w-5" />
                  </div>

                  <p className="pt-1 text-sm font-semibold leading-5 text-red-700">
                    {error}
                  </p>
                </div>
              )}

              {/* =====================================================
                  ACTION BUTTONS
              ===================================================== */}
              <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleAttendance("SIGN IN")}
                  disabled={loading || !qrToken}
                  className="flex min-h-[62px] items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none sm:text-lg"
                >
                  <FiCheckCircle className="h-6 w-6" />

                  {loading && action === "SIGN IN"
                    ? "Processing..."
                    : "SIGN IN"}
                </button>

                <button
                  type="button"
                  onClick={() => handleAttendance("SIGN OUT")}
                  disabled={loading || !qrToken}
                  className="flex min-h-[62px] items-center justify-center gap-3 rounded-2xl bg-red-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-red-100 transition hover:bg-red-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none sm:text-lg"
                >
                  <FiClock className="h-6 w-6" />

                  {loading && action === "SIGN OUT"
                    ? "Processing..."
                    : "SIGN OUT"}
                </button>
              </div>

              {/* =====================================================
                  ATTENDANCE RULES
              ===================================================== */}
              <div className="mt-7 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex items-center gap-2">
                  <FiShield className="h-4 w-4 text-blue-600" />

                  <h3 className="text-sm font-bold text-slate-800">
                    Attendance Rules
                  </h3>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 text-xs leading-5 text-slate-500 sm:grid-cols-2">
                  <div className="rounded-xl bg-white p-3 shadow-sm">
                    <span className="font-semibold text-slate-700">
                      Reporting time:
                    </span>{" "}
                    Staff arriving after 7:33 AM will be marked Late.
                  </div>

                  <div className="rounded-xl bg-white p-3 shadow-sm">
                    <span className="font-semibold text-slate-700">
                      Early departure:
                    </span>{" "}
                    Signing out before 5:00 PM will be recorded.
                  </div>

                  <div className="rounded-xl bg-white p-3 shadow-sm">
                    <span className="font-semibold text-slate-700">
                      Sign out:
                    </span>{" "}
                    You must sign in before signing out.
                  </div>

                  <div className="rounded-xl bg-white p-3 shadow-sm">
                    <span className="font-semibold text-slate-700">
                      Automatic time:
                    </span>{" "}
                    The system records the date and time automatically.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <div className="mt-7 text-center">
          <p className="text-[11px] text-slate-400">
            VOTECH S7 ACADEMY • Staff Attendance Management System
          </p>
        </div>
      </main>
    </div>
  );
}

export default StaffDashboard;
