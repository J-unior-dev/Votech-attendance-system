import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

function ScanAttendance() {
  const scannerRef = useRef(null);
  const [scannedToken, setScannedToken] = useState("");
  const [action, setAction] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Get logged-in staff information
  const staff = JSON.parse(localStorage.getItem("staff") || "{}");

  const staffId = staff.staff_id;

  // =====================================================
  // START QR SCANNER
  // =====================================================
  const startScanner = async () => {
    setError("");
    setMessage("");

    if (!staffId) {
      setError("Staff information was not found. Please login again.");
      return;
    }

    try {
      const scanner = new Html5Qrcode("qr-reader");

      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          setScannedToken(decodedText);
          setScanning(false);

          try {
            await scanner.stop();
            await scanner.clear();
          } catch (stopError) {
            console.error(stopError);
          }
        },
        () => {
          // Ignore continuous QR scanning errors
        }
      );

      setScanning(true);
    } catch (error) {
      console.error("Scanner error:", error);
      setError(
        "Unable to start the camera. Please allow camera permission and try again."
      );
    }
  };

  // =====================================================
  // STOP SCANNER
  // =====================================================
  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (error) {
      console.error("Stop scanner error:", error);
    }

    setScanning(false);
  };

  // =====================================================
  // SUBMIT ATTENDANCE
  // =====================================================
  const submitAttendance = async (selectedAction) => {
    if (!scannedToken) {
      setError("Please scan today's QR code first.");
      return;
    }

    if (!staffId) {
      setError("Staff information was not found. Please login again.");
      return;
    }

    setProcessing(true);
    setError("");
    setMessage("");
    setAction(selectedAction);

    try {
      const response = await fetch(
        "http://localhost:5000/api/attendance/scan",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            staff_id: staffId,
            token: scannedToken,
            action: selectedAction,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to record attendance.");
        return;
      }

      setMessage(data.message);

      // Clear scanned token after successful attendance
      setScannedToken("");
      setAction("");

    } catch (error) {
      console.error("Attendance error:", error);

      setError(
        "Unable to connect to the attendance server. Please make sure the backend is running."
      );
    } finally {
      setProcessing(false);
    }
  };

  // =====================================================
  // CLEANUP CAMERA
  // =====================================================
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current = null;
          });
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-5 lg:p-8">

      {/* HEADER */}
      <div className="mx-auto max-w-3xl">

        <div className="mb-6">

          <h1 className="text-2xl font-bold text-slate-800">
            Staff Attendance
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Scan today's QR code to record your attendance.
          </p>

        </div>

        {/* STAFF INFO */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Staff Member
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-800">
            {staff.name || "Staff Member"}
          </h2>

          {staff.department_name && (
            <p className="mt-1 text-sm text-slate-500">
              {staff.department_name}
            </p>
          )}

        </div>

        {/* MESSAGE */}
        {message && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* SCANNER CARD */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <h2 className="text-lg font-bold text-slate-800">
            Scan QR Code
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Point your camera at the QR code displayed in the staff room.
          </p>

          {/* QR CAMERA */}
          <div
            id="qr-reader"
            className="mx-auto mt-5 w-full max-w-md overflow-hidden rounded-2xl"
          ></div>

          {/* SCAN BUTTON */}
          {!scanning && !scannedToken && (
            <button
              type="button"
              onClick={startScanner}
              className="mt-5 w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800"
            >
              Start Camera & Scan QR
            </button>
          )}

          {/* STOP BUTTON */}
          {scanning && (
            <button
              type="button"
              onClick={stopScanner}
              className="mt-5 w-full rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Stop Camera
            </button>
          )}

          {/* SCANNED TOKEN */}
          {scannedToken && (
            <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">

              <p className="text-sm font-semibold text-green-700">
                QR code scanned successfully.
              </p>

              <p className="mt-1 text-xs text-green-600">
                Choose whether you are signing in or signing out.
              </p>

            </div>
          )}

        </div>

        {/* ACTION BUTTONS */}
        {scannedToken && (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">

            <button
              type="button"
              disabled={processing}
              onClick={() => submitAttendance("SIGN IN")}
              className="rounded-2xl bg-green-600 px-5 py-4 font-bold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing && action === "SIGN IN"
                ? "Processing..."
                : "SIGN IN"}
            </button>

            <button
              type="button"
              disabled={processing}
              onClick={() => submitAttendance("SIGN OUT")}
              className="rounded-2xl bg-orange-500 px-5 py-4 font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing && action === "SIGN OUT"
                ? "Processing..."
                : "SIGN OUT"}
            </button>

          </div>
        )}

        {/* INFORMATION */}
        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5">

          <h3 className="font-semibold text-blue-800">
            Attendance Information
          </h3>

          <ul className="mt-2 space-y-1 text-sm text-blue-700">
            <li>• Sign in before 7:33 AM to be marked Present.</li>
            <li>• Arriving after 7:33 AM will be marked Late.</li>
             <li>• Sign out before after 5:00 PM will be marked Left before time.</li>
            <li>• You cannot sign out before signing in.</li>
            <li>• The system automatically records the date and time.</li>
          </ul>

        </div>

      </div>

    </div>
  );
}

export default ScanAttendance;
