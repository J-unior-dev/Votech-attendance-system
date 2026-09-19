import { useState } from "react";

import {
  FiHome,
  FiUsers,
  FiCheckCircle,
  FiGrid,
  FiFileText,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiArrowLeft,
} from "react-icons/fi";

import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import SchoolLogo from "./SchoolLogo";

function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: FiHome,
    },
    {
      name: "Staff Management",
      path: "/admin/staff",
      icon: FiUsers,
    },
    {
      name: "Attendance",
      path: "/admin/attendance",
      icon: FiCheckCircle,
    },
    {
      name: "QR Tokens",
      path: "/admin/qr-management",
      icon: FiGrid,
    },
    {
      name: "Reports",
      path: "/admin/reports",
      icon: FiFileText,
    },
    {
      name: "Settings",
      path: "/admin/settings",
      icon: FiSettings,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    localStorage.removeItem("staff");
    localStorage.removeItem("rememberMe");

    setMobileMenuOpen(false);

    navigate("/login");
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/admin/dashboard");
    }
  };

  const isDashboard =
    location.pathname === "/admin/dashboard";

  return (
    <div className="min-h-screen bg-[#f5f7fb]">

      {/* =====================================================
          MOBILE MENU OVERLAY
      ===================================================== */}

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}


      {/* =====================================================
          MOBILE SIDEBAR
      ===================================================== */}

      <aside
        className={`
          fixed left-0 top-0 z-50
          flex h-screen w-[280px]
          flex-col
          bg-slate-950
          text-white
          shadow-2xl
          transition-transform duration-300
          lg:hidden
          ${
            mobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >

        {/* MOBILE SIDEBAR HEADER */}

        <div className="flex h-24 shrink-0 items-center justify-between border-b border-white/10 px-5">

          <div className="flex items-center gap-3">

            <SchoolLogo className="h-11 w-11 shrink-0" />

            <div className="min-w-0">

              <h1 className="text-lg font-bold tracking-wide">
                VOTECH S7
              </h1>

              <p className="text-xs text-slate-400">
                Attendance System
              </p>

            </div>

          </div>


          {/* CLOSE BUTTON */}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Close menu"
          >
            <FiX className="h-6 w-6" />
          </button>

        </div>


        {/* MOBILE NAVIGATION */}

        <nav className="flex-1 overflow-y-auto px-4 py-6">

          <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Main Menu
          </p>

          <div className="space-y-1">

            {menuItems.map((item) => {

              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className={({ isActive }) =>
                    `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >

                  <Icon className="h-[18px] w-[18px] shrink-0" />

                  <span>
                    {item.name}
                  </span>

                </NavLink>
              );

            })}

          </div>

        </nav>


        {/* MOBILE ADMIN PROFILE */}

        <div className="shrink-0 border-t border-white/10 p-4">

          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">
              A
            </div>

            <div className="min-w-0">

              <p className="truncate text-sm font-semibold">
                Administrator
              </p>

              <p className="text-[11px] text-slate-400">
                System Administrator
              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
          >

            <FiLogOut className="h-[18px] w-[18px]" />

            <span>
              Logout
            </span>

          </button>

        </div>

      </aside>


      {/* =====================================================
          MAIN APPLICATION GRID
      ===================================================== */}

      <div className="min-h-screen lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">


        {/* ===================================================
            DESKTOP SIDEBAR
        =================================================== */}

        <aside className="hidden h-screen w-full bg-slate-950 text-white lg:sticky lg:top-0 lg:flex lg:flex-col">

          {/* LOGO */}

          <div className="flex h-24 shrink-0 items-center gap-3 border-b border-white/10 px-6">

            <SchoolLogo className="h-12 w-12 shrink-0" />

            <div className="min-w-0">

              <h1 className="text-lg font-bold tracking-wide">
                VOTECH S7
              </h1>

              <p className="text-xs text-slate-400">
                Attendance System
              </p>

            </div>

          </div>


          {/* NAVIGATION */}

          <nav className="flex-1 overflow-y-auto px-4 py-6">

            <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Main Menu
            </p>

            <div className="space-y-1">

              {menuItems.map((item) => {

                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`
                    }
                  >

                    <Icon className="h-[18px] w-[18px] shrink-0" />

                    <span>
                      {item.name}
                    </span>

                  </NavLink>
                );

              })}

            </div>

          </nav>


          {/* ADMIN PROFILE */}

          <div className="shrink-0 border-t border-white/10 p-4">

            <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">
                A
              </div>

              <div className="min-w-0">

                <p className="truncate text-sm font-semibold">
                  Administrator
                </p>

                <p className="text-[11px] text-slate-400">
                  System Administrator
                </p>

              </div>

            </div>


            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
            >

              <FiLogOut className="h-[18px] w-[18px]" />

              <span>
                Logout
              </span>

            </button>

          </div>

        </aside>


        {/* ===================================================
            MAIN CONTENT COLUMN
        =================================================== */}

        <div className="min-w-0">


          {/* =================================================
              MOBILE HEADER
          ================================================= */}

          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm lg:hidden">

            <div className="flex items-center gap-2">

              {/* HAMBURGER */}

              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(true)
                }
                className="mr-1 rounded-lg p-2 text-slate-700 transition hover:bg-slate-100"
                aria-label="Open menu"
              >
                <FiMenu className="h-6 w-6" />
              </button>


              <SchoolLogo className="h-9 w-9" />

              <div>

                <p className="text-sm font-bold text-slate-900">
                  VOTECH S7
                </p>

                <p className="text-[10px] text-slate-500">
                  Attendance System
                </p>

              </div>

            </div>


            <div className="flex items-center gap-1">

              {/* BACK BUTTON */}

              {!isDashboard && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-blue-600"
                  aria-label="Go back"
                >
                  <FiArrowLeft className="h-5 w-5" />
                </button>
              )}


              {/* LOGOUT */}

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                aria-label="Logout"
              >
                <FiLogOut className="h-5 w-5" />
              </button>

            </div>

          </header>


          {/* =================================================
              DESKTOP HEADER
          ================================================= */}

          <header className="hidden h-24 items-center justify-between border-b border-slate-200 bg-white px-8 lg:flex">

            <div className="flex items-center gap-4">

              {/* DESKTOP BACK BUTTON */}

              {!isDashboard && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                  aria-label="Go back"
                >
                  <FiArrowLeft className="h-5 w-5" />
                </button>
              )}

              <div>

                <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">
                  VOTECH S7 ACADEMY
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Staff Attendance Management
                </h2>

              </div>

            </div>


            <div className="flex items-center gap-3">

              <div className="text-right">

                <p className="text-sm font-semibold text-slate-800">
                  Administrator
                </p>

                <p className="text-xs text-slate-500">
                  System Administrator
                </p>

              </div>


              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                A
              </div>

            </div>

          </header>


          {/* =================================================
              PAGE CONTENT
          ================================================= */}

          <main className="min-w-0 px-4 py-5 sm:px-8 sm:py-7 lg:px-8 lg:py-8 xl:px-10">

            <div className="mx-auto w-full max-w-[1400px] min-w-0">

              {children}

            </div>

          </main>

        </div>

      </div>

    </div>
  );
}

export default AdminLayout;
