import {
  HashRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useEffect, useState } from "react";

// =====================================================
// SPLASH SCREEN
// =====================================================
import SplashScreen from "./SplashScreen";

// =====================================================
// AUTH PAGES
// =====================================================
import Login from "./pages/auth/Login";

// =====================================================
// ADMIN PAGES
// =====================================================
import Dashboard from "./pages/staff/Dashboard";
import StaffManagement from "./pages/admin/StaffManagement";
import QRManagement from "./pages/admin/QRManagement";
import Attendance from "./pages/admin/Attendance";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";

// =====================================================
// STAFF PAGES
// =====================================================
import StaffDashboard from "./pages/staff/StaffDashboard";
import ScanAttendance from "./pages/staff/ScanAttendance";

function App() {
  // =====================================================
  // SPLASH SCREEN STATE
  // =====================================================
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // =====================================================
  // SHOW SPLASH BEFORE LOGIN
  // =====================================================
  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <HashRouter>
      <Routes>

        {/* =================================================
            DEFAULT
        ================================================= */}
        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        {/* =================================================
            ADMIN LOGIN
        ================================================= */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* =================================================
            ADMIN DASHBOARD
        ================================================= */}
        <Route
          path="/admin/dashboard"
          element={<Dashboard />}
        />

        {/* =================================================
            ADMIN STAFF MANAGEMENT
        ================================================= */}
        <Route
          path="/admin/staff"
          element={<StaffManagement />}
        />

        {/* =================================================
            ADMIN ATTENDANCE
        ================================================= */}
        <Route
          path="/admin/attendance"
          element={<Attendance />}
        />

        {/* =================================================
            ADMIN QR MANAGEMENT
        ================================================= */}
        <Route
          path="/admin/qr-management"
          element={<QRManagement />}
        />

        {/* =================================================
            ADMIN REPORTS
        ================================================= */}
        <Route
          path="/admin/reports"
          element={<Reports />}
        />

        {/* =================================================
            ADMIN SETTINGS
        ================================================= */}
        <Route
          path="/admin/settings"
          element={<Settings />}
        />

        {/* =================================================
            STAFF DASHBOARD
        ================================================= */}
        <Route
          path="/staff/dashboard"
          element={<StaffDashboard />}
        />

        {/* =================================================
            STAFF ATTENDANCE SCANNER
        ================================================= */}
        <Route
          path="/staff/attendance"
          element={<ScanAttendance />}
        />

        {/* =================================================
            FALLBACK
        ================================================= */}
        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>
    </HashRouter>
  );
}

export default App;