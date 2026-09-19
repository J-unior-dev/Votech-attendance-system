import { useState } from "react";
import {
  FiEye,
  FiEyeOff,
  FiLock,
  FiUser,
  FiShield,
  FiCheckCircle,
} from "react-icons/fi";
import SchoolLogo from "../../components/SchoolLogo";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // =====================================================
  // LOGIN
  // ADMIN + STAFF
  // =====================================================
  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      // =================================================
      // LOGIN FAILED
      // =================================================
      if (!response.ok || !data.success) {
        setError(
          data.message || "Invalid username or password."
        );
        return;
      }

      // =================================================
      // CLEAR PREVIOUS LOGIN DATA
      // =================================================
      localStorage.removeItem("token");
      localStorage.removeItem("admin");
      localStorage.removeItem("staffToken");
      localStorage.removeItem("staff");

      // =================================================
      // SAVE COMMON TOKEN
      // =================================================
      localStorage.setItem("token", data.token);

      // =================================================
      // ADMIN LOGIN
      // =================================================
      if (data.role === "admin") {
        localStorage.setItem(
          "admin",
          JSON.stringify(data.user)
        );
      }

      // =================================================
      // STAFF LOGIN
      // =================================================
      if (data.role === "staff") {
        localStorage.setItem(
          "staffToken",
          data.token
        );

        localStorage.setItem(
          "staff",
          JSON.stringify(data.user)
        );
      }

      // =================================================
      // REMEMBER ME
      // =================================================
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }

      // =================================================
      // REDIRECT BASED ON ROLE
      // =================================================
      window.location.href = data.redirectTo;

    } catch (error) {
      console.error("Login error:", error);

      setError(
        "Unable to connect to the server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07152f]">

      {/* =================================================
          BACKGROUND DECORATION
      ================================================= */}

      {/* Large blurred blue glow */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/30 blur-3xl" />

      {/* Large blurred cyan glow */}
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[450px] w-[450px] rounded-full bg-cyan-500/20 blur-3xl" />

      {/* Center glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />

      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "45px 45px",
        }}
      />

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">

        <div className="w-full max-w-[1080px]">

          {/* =================================================
              GLASS CARD
          ================================================= */}

          <div className="overflow-hidden rounded-3xl border border-white/15 bg-white/[0.08] shadow-2xl shadow-black/30 backdrop-blur-2xl">

            <div className="grid lg:grid-cols-[0.9fr_1.1fr]">

              {/* =================================================
                  LEFT BRANDING PANEL
              ================================================= */}

              <div className="relative hidden overflow-hidden border-r border-white/10 bg-blue-950/30 p-10 lg:flex lg:min-h-[650px] lg:flex-col lg:justify-between xl:p-14">

                {/* Decorative circles */}

                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/10" />

                <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full border border-blue-400/10" />

                <div className="relative z-10">

                  {/* Logo */}

                  <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl border border-white/20 bg-white/10 p-3 shadow-xl backdrop-blur-md">

                    <SchoolLogo className="h-full w-full" />

                  </div>

                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
                    VOTECH S7 ACADEMY
                  </p>

                  <h1 className="max-w-md text-4xl font-bold leading-tight text-white xl:text-5xl">
                    Staff Attendance
                    <span className="block text-blue-300">
                      Management System
                    </span>
                  </h1>

                  <p className="mt-6 max-w-md text-sm leading-7 text-slate-300">
                    A secure and modern platform for managing
                    staff attendance, QR-based check-in,
                    check-out and attendance records.
                  </p>

                </div>

                {/* FEATURES */}

                <div className="relative z-10 space-y-4">

                  <div className="flex items-center gap-3 text-sm text-slate-300">

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">

                      <FiCheckCircle className="h-5 w-5" />

                    </div>

                    <span>
                      Secure staff authentication
                    </span>

                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-300">

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">

                      <FiShield className="h-5 w-5" />

                    </div>

                    <span>
                      QR-based attendance tracking
                    </span>

                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-300">

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">

                      <FiCheckCircle className="h-5 w-5" />

                    </div>

                    <span>
                      Centralized attendance records
                    </span>

                  </div>

                </div>

              </div>


              {/* =================================================
                  RIGHT LOGIN PANEL
              ================================================= */}

              <div className="relative bg-white/[0.96] px-6 py-10 sm:px-10 sm:py-12 lg:px-12 xl:px-16">

                {/* Mobile logo */}

                <div className="mb-8 flex flex-col items-center text-center lg:hidden">

                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 p-2 shadow-lg">

                    <SchoolLogo className="h-full w-full" />

                  </div>

                  <h1 className="mt-5 text-2xl font-bold text-[#07184a]">
                    VOTECH S7 ACADEMY
                  </h1>

                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Staff Attendance Management System
                  </p>

                </div>


                {/* =================================================
                    LOGIN HEADER
                ================================================= */}

                <div className="mx-auto max-w-md">

                  <div className="mb-8">

                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">

                      <FiShield className="h-6 w-6" />

                    </div>

                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                      Welcome back
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Sign in to access the VOTECH S7
                      attendance system.
                    </p>

                  </div>


                  {/* =================================================
                      FORM
                  ================================================= */}

                  <form onSubmit={handleLogin}>

                    {/* USERNAME */}

                    <div className="mb-5">

                      <label
                        htmlFor="username"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Username
                      </label>

                      <div className="relative">

                        <FiUser
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={19}
                        />

                        <input
                          id="username"
                          type="text"
                          value={username}
                          onChange={(e) =>
                            setUsername(e.target.value)
                          }
                          placeholder="Enter your username"
                          autoComplete="username"
                          className="
                            h-14
                            w-full
                            rounded-xl
                            border
                            border-slate-200
                            bg-slate-50
                            pl-12
                            pr-4
                            text-sm
                            text-slate-800
                            outline-none
                            transition-all
                            duration-200
                            placeholder:text-slate-400
                            hover:border-slate-300
                            focus:border-blue-500
                            focus:bg-white
                            focus:ring-4
                            focus:ring-blue-100
                          "
                        />

                      </div>

                    </div>


                    {/* PASSWORD */}

                    <div className="mb-5">

                      <label
                        htmlFor="password"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Password
                      </label>

                      <div className="relative">

                        <FiLock
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={19}
                        />

                        <input
                          id="password"
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          value={password}
                          onChange={(e) =>
                            setPassword(e.target.value)
                          }
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          className="
                            h-14
                            w-full
                            rounded-xl
                            border
                            border-slate-200
                            bg-slate-50
                            pl-12
                            pr-12
                            text-sm
                            text-slate-800
                            outline-none
                            transition-all
                            duration-200
                            placeholder:text-slate-400
                            hover:border-slate-300
                            focus:border-blue-500
                            focus:bg-white
                            focus:ring-4
                            focus:ring-blue-100
                          "
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(!showPassword)
                          }
                          aria-label={
                            showPassword
                              ? "Hide password"
                              : "Show password"
                          }
                          className="
                            absolute
                            right-4
                            top-1/2
                            -translate-y-1/2
                            rounded-lg
                            p-1
                            text-slate-400
                            transition
                            hover:bg-slate-100
                            hover:text-blue-600
                          "
                        >
                          {showPassword ? (
                            <FiEyeOff size={19} />
                          ) : (
                            <FiEye size={19} />
                          )}
                        </button>

                      </div>

                    </div>


                    {/* ERROR */}

                    {error && (
                      <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">

                        <span className="mt-0.5">
                          ⚠
                        </span>

                        <span>
                          {error}
                        </span>

                      </div>
                    )}


                    {/* REMEMBER ME */}

                    <div className="flex items-center justify-between">

                      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-500">

                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) =>
                            setRememberMe(
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-blue-600"
                        />

                        <span>
                          Remember me
                        </span>

                      </label>

                      <span className="text-xs font-medium text-slate-400">
                        Authorized users only
                      </span>

                    </div>


                    {/* LOGIN BUTTON */}

                    <button
                      type="submit"
                      disabled={loading}
                      className="
                        group
                        mt-7
                        flex
                        h-14
                        w-full
                        items-center
                        justify-center
                        rounded-xl
                        bg-blue-600
                        text-sm
                        font-bold
                        tracking-wide
                        text-white
                        shadow-lg
                        shadow-blue-200
                        transition-all
                        duration-200
                        hover:bg-blue-700
                        hover:shadow-xl
                        hover:shadow-blue-300
                        active:scale-[0.99]
                        disabled:cursor-not-allowed
                        disabled:bg-blue-400
                      "
                    >
                      {loading ? (
                        <div className="flex items-center gap-3">

                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                          <span>
                            Signing in...
                          </span>

                        </div>
                      ) : (
                        <span>
                          Sign In
                        </span>
                      )}
                    </button>

                  </form>


                  {/* =================================================
                      SECURITY NOTE
                  ================================================= */}

                  <div className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-slate-400">

                    <FiLock className="h-3.5 w-3.5" />

                    <span>
                      Your account credentials are protected.
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </div>


          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="mt-6 text-center">

            <p className="text-xs font-medium text-slate-400">
              © {new Date().getFullYear()} VOTECH S7 Academy
            </p>

            <p className="mt-1 text-[11px] text-slate-500">
              Staff Attendance Management System
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;
