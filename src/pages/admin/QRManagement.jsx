import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiPrinter,
  FiRefreshCw,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiGrid,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../../components/AdminLayout";

// =====================================================
// API BASE URL
// =====================================================
const API_BASE_URL = "http://localhost:5000";

// =====================================================
// FORMAT DATE AS YYYY-MM-DD
// =====================================================
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// =====================================================
// NORMALIZE DATABASE DATE
// =====================================================
function normalizeTokenDate(value) {
  if (!value) return "";

  const stringValue = String(value);

  const directMatch = stringValue.match(
    /^(\d{4}-\d{2}-\d{2})/
  );

  if (directMatch) {
    return directMatch[1];
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return formatDate(parsed);
}

// =====================================================
// GET TUESDAY FOR A GIVEN DATE
// =====================================================
function getTuesday(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);

  const day = result.getDay();

  const difference = day - 2;

  result.setDate(result.getDate() - difference);

  return result;
}

// =====================================================
// GET TUESDAY - SATURDAY
// =====================================================
function getSchoolWeek(date) {
  const tuesday = getTuesday(date);

  return Array.from({ length: 5 }, (_, index) => {
    const current = new Date(tuesday);

    current.setDate(tuesday.getDate() + index);

    return current;
  });
}

// =====================================================
// DISPLAY DATE
// =====================================================
function displayDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// =====================================================
// DISPLAY DAY NAME
// =====================================================
function getDayName(dateString) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
  });
}

// =====================================================
// CHECK WHETHER SELECTED DATE IS TODAY
// =====================================================
function getQRStatus(dateString) {
  const today = formatDate(new Date());

  if (dateString === today) {
    return "active";
  }

  if (dateString < today) {
    return "inactive";
  }

  return "upcoming";
}

// =====================================================
// QR MANAGEMENT
// =====================================================
function QRManagement() {
  const navigate = useNavigate();

  // ===================================================
  // SELECTED WEEK
  // ===================================================
  const [selectedWeek, setSelectedWeek] = useState(() =>
    getTuesday(new Date())
  );

  // ===================================================
  // QR TOKENS
  // ===================================================
  const [tokens, setTokens] = useState([]);

  // ===================================================
  // QR IMAGES
  // ===================================================
  const [qrImages, setQrImages] = useState({});

  // ===================================================
  // LOADING
  // ===================================================
  const [loading, setLoading] = useState(false);

  // ===================================================
  // GENERATING
  // ===================================================
  const [generating, setGenerating] = useState(false);

  // ===================================================
  // ERROR
  // ===================================================
  const [error, setError] = useState("");

  // ===================================================
  // SUCCESS
  // ===================================================
  const [success, setSuccess] = useState("");

  // ===================================================
  // FIVE SCHOOL DAYS
  // ===================================================
  const schoolDays = useMemo(
    () => getSchoolWeek(selectedWeek),
    [selectedWeek]
  );

  // ===================================================
  // WEEK START
  // ===================================================
  const weekStart = formatDate(schoolDays[0]);

  // ===================================================
  // WEEK END
  // ===================================================
  const weekEnd = formatDate(schoolDays[4]);

  // ===================================================
  // CREATE LOCAL QR IMAGES
  // ===================================================
  const createQRImages = async (weeklyTokens) => {
    const images = {};

    for (const token of weeklyTokens) {
      if (!token || !token.token) {
        continue;
      }

      try {
        const image = await QRCode.toDataURL(
          String(token.token),
          {
            width: 500,
            margin: 2,
            errorCorrectionLevel: "H",
            type: "image/png",
          }
        );

        images[String(token.token_id)] = image;
      } catch (qrError) {
        console.error(
          "QR image generation error:",
          qrError
        );
      }
    }

    setQrImages(images);

    return images;
  };

  // ===================================================
  // NORMALIZE TOKENS
  // ===================================================
  const normalizeTokens = (weeklyTokens) => {
    return weeklyTokens.map((token) => ({
      ...token,
      token_date: normalizeTokenDate(
        token.token_date
      ),
    }));
  };

  // ===================================================
  // LOAD QR CODES
  // ===================================================
  const loadQRCodes = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qr/weekly?week_start=${weekStart}`
      );

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.message ||
            "Failed to load QR codes."
        );
      }

      const rawTokens = data.tokens || [];

      const weeklyTokens =
        normalizeTokens(rawTokens);

      setTokens(weeklyTokens);

      await createQRImages(weeklyTokens);
    } catch (err) {
      console.error(
        "QR loading error:",
        err
      );

      setTokens([]);
      setQrImages({});

      setError(
        err.message ||
          "Unable to load QR codes. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // LOAD WHEN WEEK CHANGES
  // ===================================================
  useEffect(() => {
    loadQRCodes();
  }, [weekStart]);

  // ===================================================
  // GENERATE QR CODES
  // ===================================================
  const generateQRCodes = async () => {
    setGenerating(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qr/generate-weekly`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            week_start: weekStart,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.message ||
            "Failed to generate weekly QR codes."
        );
      }

      const rawTokens = data.tokens || [];

      const weeklyTokens =
        normalizeTokens(rawTokens);

      setTokens(weeklyTokens);

      await createQRImages(weeklyTokens);

      setSuccess(
        "Weekly QR codes generated successfully."
      );
    } catch (err) {
      console.error(
        "QR generation error:",
        err
      );

      setError(
        err.message ||
          "Failed to generate weekly QR codes."
      );
    } finally {
      setGenerating(false);
    }
  };

  // ===================================================
  // CHANGE WEEK
  // ===================================================
  const changeWeek = (amount) => {
    setSuccess("");
    setError("");

    const newWeek = new Date(selectedWeek);

    newWeek.setDate(
      newWeek.getDate() + amount * 7
    );

    setSelectedWeek(getTuesday(newWeek));
  };

  // ===================================================
  // CURRENT WEEK
  // ===================================================
  const goToCurrentWeek = () => {
    setSuccess("");
    setError("");

    setSelectedWeek(
      getTuesday(new Date())
    );
  };

  // ===================================================
  // FIND TOKEN FOR EACH DATE
  // ===================================================
  const tokenByDate = useMemo(() => {
    const map = {};

    tokens.forEach((token) => {
      const date =
        normalizeTokenDate(
          token.token_date
        );

      if (date) {
        map[date] = token;
      }
    });

    return map;
  }, [tokens]);

  // ===================================================
  // COUNT GENERATED
  // ===================================================
  const generatedCount = schoolDays.filter(
    (date) =>
      Boolean(
        tokenByDate[
          formatDate(date)
        ]
      )
  ).length;

  // ===================================================
  // ALL FIVE GENERATED
  // ===================================================
  const allGenerated =
    generatedCount === 5;

  // ===================================================
  // PRINT QR CODES
  // ===================================================
  const printQRCodes = async () => {
    setError("");

    if (tokens.length === 0) {
      setError(
        "There are no QR codes to print for this week."
      );

      return;
    }

    try {
      const images = {};

      for (const token of tokens) {
        if (!token.token) continue;

        images[
          String(token.token_id)
        ] = await QRCode.toDataURL(
          String(token.token),
          {
            width: 800,
            margin: 2,
            errorCorrectionLevel: "H",
            type: "image/png",
          }
        );
      }

      const printWindow =
        window.open(
          "",
          "_blank",
          "width=1000,height=900"
        );

      if (!printWindow) {
        setError(
          "Please allow pop-ups in your browser to print the QR codes."
        );

        return;
      }

      const cards = schoolDays
        .map((date) => {
          const dateString =
            formatDate(date);

          const token =
            tokenByDate[
              dateString
            ];

          if (
            !token ||
            !images[
              String(token.token_id)
            ]
          ) {
            return "";
          }

          return `
            <div class="qr-card">

              <div class="day">
                ${getDayName(dateString)}
              </div>

              <div class="date">
                ${displayDate(dateString)}
              </div>

              <img
                src="${
                  images[
                    String(
                      token.token_id
                    )
                  ]
                }"
                class="qr-image"
                alt="Attendance QR Code"
              />

              <div class="instruction">
                SCAN TO RECORD ATTENDANCE
              </div>

              <div class="academy">
                VOTECH S7 ACADEMY
              </div>

            </div>
          `;
        })
        .join("");

      printWindow.document.write(`
        <!DOCTYPE html>

        <html>

        <head>

          <meta charset="UTF-8">

          <title>
            VOTECH S7 ACADEMY - Staff Attendance QR Codes
          </title>

          <style>

            @page {
              size: A4 portrait;
              margin: 8mm;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: white;
              font-family: Arial, Helvetica, sans-serif;
            }

            .page {
              width: 100%;
              height: 281mm;
              display: flex;
              flex-direction: column;
            }

            .header {
              text-align: center;
              margin-bottom: 5mm;
            }

            .academy-title {
              font-size: 22px;
              font-weight: 900;
              letter-spacing: 0.5px;
            }

            .subtitle {
              margin-top: 2px;
              font-size: 12px;
              font-weight: 700;
            }

            .week {
              margin-top: 3px;
              font-size: 10px;
              font-weight: 600;
            }

            .qr-grid {
              flex: 1;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              grid-template-rows: repeat(3, 1fr);
              gap: 4mm;
            }

            .qr-card {
              border: 1.5px solid #94a3b8;
              border-radius: 6px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 3mm;
              page-break-inside: avoid;
              overflow: hidden;
            }

            .qr-card:nth-child(5) {
              grid-column: 1 / 3;
              width: 50%;
              justify-self: center;
            }

            .day {
              font-size: 15px;
              font-weight: 900;
              text-transform: uppercase;
            }

            .date {
              margin-top: 1.5mm;
              font-size: 10px;
              font-weight: 600;
            }

            .qr-image {
              width: 55mm;
              height: 55mm;
              margin-top: 3mm;
              object-fit: contain;
            }

            .instruction {
              margin-top: 2mm;
              font-size: 7px;
              font-weight: 900;
              letter-spacing: 0.5px;
            }

            .academy {
              margin-top: 1mm;
              font-size: 7px;
              font-weight: 600;
            }

            .footer {
              text-align: center;
              margin-top: 3mm;
              font-size: 7px;
            }

            @media print {

              html,
              body {
                width: 210mm;
                height: 297mm;
              }

              .page {
                width: 194mm;
                height: 281mm;
              }

            }

          </style>

        </head>

        <body>

          <div class="page">

            <div class="header">

              <div class="academy-title">
                VOTECH S7 ACADEMY
              </div>

              <div class="subtitle">
                STAFF ATTENDANCE QR CODES
              </div>

              <div class="week">
                ${displayDate(weekStart)}
                -
                ${displayDate(weekEnd)}
              </div>

            </div>

            <div class="qr-grid">
              ${cards}
            </div>

            <div class="footer">
              Staff must scan the QR code assigned to the current date.
            </div>

          </div>

          <script>

            window.onload = function () {
              setTimeout(function () {
                window.print();
              }, 700);
            };

          </script>

        </body>

        </html>
      `);

      printWindow.document.close();
    } catch (err) {
      console.error(
        "Print error:",
        err
      );

      setError(
        "Unable to prepare QR codes for printing."
      );
    }
  };

  // ===================================================
  // RENDER
  // ===================================================
  return (
    <AdminLayout>
      <div className="space-y-7">

        {/* =================================================
            PAGE HEADER
        ================================================= */}
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

          <div className="flex items-start gap-4">

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/dashboard"
                )
              }
              className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <FiArrowLeft size={19} />
            </button>

            <div>

              <div className="flex items-center gap-2">

                <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  QR Management
                </span>

              </div>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Staff Attendance QR Codes
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Generate, monitor and print the weekly attendance QR codes.
              </p>

            </div>

          </div>

          <div className="flex flex-wrap items-center gap-3">

            <button
              type="button"
              onClick={printQRCodes}
              disabled={tokens.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiPrinter size={17} />
              Print QR Codes
            </button>

            <button
              type="button"
              onClick={loadQRCodes}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiRefreshCw
                size={17}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>

          </div>

        </div>

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Weekly QR Codes
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {generatedCount}
                  <span className="text-lg font-medium text-slate-400">
                    {" "}
                    / 5
                  </span>
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FiGrid size={22} />
              </div>

            </div>

            <p className="mt-3 text-xs text-slate-400">
              QR codes generated for this week
            </p>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Today's QR
                </p>

                <p className="mt-2 text-xl font-bold text-slate-900">
                  {tokenByDate[
                    formatDate(new Date())
                  ]
                    ? "Active"
                    : "Not Generated"}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <FiCheckCircle size={22} />
              </div>

            </div>

            <p className="mt-3 text-xs text-slate-400">
              Current attendance QR status
            </p>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  School Days
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  5
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <FiCalendar size={22} />
              </div>

            </div>

            <p className="mt-3 text-xs text-slate-400">
              Tuesday to Saturday
            </p>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  QR Security
                </p>

                <p className="mt-2 text-xl font-bold text-slate-900">
                  Date Locked
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <FiClock size={22} />
              </div>

            </div>

            <p className="mt-3 text-xs text-slate-400">
              Each code is assigned to one date
            </p>

          </div>

        </div>

        {/* =================================================
            WEEK SELECTOR
        ================================================= */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FiCalendar size={22} />
              </div>

              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Selected Week
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {displayDate(weekStart)}
                  {" — "}
                  {displayDate(weekEnd)}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Tuesday through Saturday
                </p>

              </div>

            </div>

            <div className="flex flex-wrap items-center gap-2">

              <button
                type="button"
                onClick={() =>
                  changeWeek(-1)
                }
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <FiChevronLeft size={17} />
                Previous
              </button>

              <button
                type="button"
                onClick={
                  goToCurrentWeek
                }
                className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Current Week
              </button>

              <button
                type="button"
                onClick={() =>
                  changeWeek(1)
                }
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Next
                <FiChevronRight size={17} />
              </button>

            </div>

          </div>

        </div>

        {/* =================================================
            SUCCESS
        ================================================= */}
        {success && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700 shadow-sm">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <FiCheckCircle size={18} />
            </div>

            <div>
              <p className="text-sm font-bold">
                Success
              </p>

              <p className="text-sm">
                {success}
              </p>
            </div>

          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700 shadow-sm">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
              <FiAlertCircle size={18} />
            </div>

            <div>
              <p className="text-sm font-bold">
                QR Code Error
              </p>

              <p className="text-sm">
                {error}
              </p>
            </div>

          </div>
        )}

        {/* =================================================
            GENERATE BANNER
        ================================================= */}
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 shadow-lg">

          <div className="flex flex-col gap-6 p-7 lg:flex-row lg:items-center lg:justify-between">

            <div className="max-w-3xl text-white">

              <div className="mb-3 flex items-center gap-2">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                  <FiGrid size={18} />
                </div>

                <span className="text-xs font-bold uppercase tracking-widest text-blue-100">
                  Weekly QR Management
                </span>

              </div>

              <h2 className="text-xl font-bold sm:text-2xl">
                {allGenerated
                  ? "Your weekly QR codes are ready"
                  : "Generate this week's attendance QR codes"}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                Create five unique QR codes for Tuesday through
                Saturday. Each QR code is locked to its assigned
                attendance date and automatically becomes inactive
                after that date.
              </p>

            </div>

            <button
              type="button"
              onClick={
                generateQRCodes
              }
              disabled={generating}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-blue-700 shadow-md transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
            >

              <FiRefreshCw
                size={18}
                className={
                  generating
                    ? "animate-spin"
                    : ""
                }
              />

              {generating
                ? "Generating..."
                : allGenerated
                ? "Regenerate / Load Week"
                : "Generate QR Codes"}

            </button>

          </div>

        </div>

        {/* =================================================
            QR CODES
        ================================================= */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

          <div className="mb-7 flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Weekly QR Codes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {generatedCount} of 5 QR codes available
              </p>

            </div>

            <div className="flex flex-wrap items-center gap-2">

              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Active Today
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                Inactive
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                Upcoming
              </span>

            </div>

          </div>

          {loading ? (

            <div className="flex min-h-[400px] flex-col items-center justify-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                <FiRefreshCw
                  size={28}
                  className="animate-spin text-blue-600"
                />
              </div>

              <p className="mt-5 text-sm font-semibold text-slate-700">
                Loading QR codes...
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Please wait while the weekly codes are loaded.
              </p>

            </div>

          ) : (

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

              {schoolDays.map((date) => {

                const dateString =
                  formatDate(date);

                const token =
                  tokenByDate[
                    dateString
                  ];

                const image =
                  token
                    ? qrImages[
                        String(
                          token.token_id
                        )
                      ]
                    : null;

                const qrStatus =
                  getQRStatus(
                    dateString
                  );

                const isToday =
                  qrStatus ===
                  "active";

                const isPast =
                  qrStatus ===
                  "inactive";

                const isUpcoming =
                  qrStatus ===
                  "upcoming";

                return (
                  <div
                    key={dateString}
                    className={`group relative overflow-hidden rounded-2xl border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                      isToday
                        ? "border-emerald-200 shadow-sm"
                        : isPast
                        ? "border-slate-200"
                        : "border-blue-100"
                    }`}
                  >

                    {/* STATUS STRIP */}
                    <div
                      className={`h-1.5 ${
                        isToday
                          ? "bg-emerald-500"
                          : isPast
                          ? "bg-slate-300"
                          : "bg-blue-400"
                      }`}
                    />

                    <div className="p-5 sm:p-6">

                      {/* CARD HEADER */}
                      <div className="flex items-start justify-between gap-3">

                        <div>

                          <p className="text-lg font-bold uppercase tracking-tight text-slate-900">
                            {getDayName(
                              dateString
                            )}
                          </p>

                          <p className="mt-1 text-sm font-medium text-slate-500">
                            {displayDate(
                              dateString
                            )}
                          </p>

                        </div>

                        {/* STATUS */}
                        {isToday && (
                          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            ACTIVE
                          </span>
                        )}

                        {isPast && (
                          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-500">
                            <span className="h-2 w-2 rounded-full bg-slate-400" />
                            INACTIVE
                          </span>
                        )}

                        {isUpcoming && (
                          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-600">
                            <span className="h-2 w-2 rounded-full bg-blue-400" />
                            UPCOMING
                          </span>
                        )}

                      </div>

                      {/* TODAY INDICATOR */}
                      {isToday && (
                        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700">
                          <FiCheckCircle size={15} />
                          This QR code is valid for today's attendance.
                        </div>
                      )}

                      {isPast && (
                        <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-500">
                          <FiClock size={15} />
                          This QR code has expired.
                        </div>
                      )}

                      {isUpcoming && (
                        <div className="mt-4 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-600">
                          <FiCalendar size={15} />
                          This QR code will be active on its date.
                        </div>
                      )}

                      {/* QR IMAGE */}
                      {token && image ? (

                        <>

                          <div
                            className={`mt-5 flex items-center justify-center rounded-2xl p-5 ${
                              isToday
                                ? "bg-emerald-50/60"
                                : isPast
                                ? "bg-slate-50"
                                : "bg-blue-50/50"
                            }`}
                          >

                            <div className="rounded-xl bg-white p-3 shadow-sm">

                              <img
                                src={image}
                                alt={`QR code for ${dateString}`}
                                className={`h-52 w-52 object-contain sm:h-56 sm:w-56 ${
                                  isPast
                                    ? "opacity-55 grayscale"
                                    : ""
                                }`}
                              />

                            </div>

                          </div>

                          {/* TOKEN INFO */}
                          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">

                            <div>

                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Token ID
                              </p>

                              <p className="mt-1 max-w-[180px] truncate text-xs font-medium text-slate-500">
                                {token.token_id}
                              </p>

                            </div>

                            {isToday && (
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                <FiCheckCircle size={18} />
                              </div>
                            )}

                            {isPast && (
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                                <FiClock size={18} />
                              </div>
                            )}

                            {isUpcoming && (
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                                <FiCalendar size={18} />
                              </div>
                            )}

                          </div>

                        </>

                      ) : token ? (

                        <div className="mt-5 flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50/40">

                          <FiAlertCircle
                            size={34}
                            className="text-red-400"
                          />

                          <p className="mt-4 font-bold text-red-600">
                            QR image failed
                          </p>

                          <p className="mt-1 max-w-xs px-4 text-center text-xs leading-5 text-slate-400">
                            Refresh the page or generate the weekly QR codes again.
                          </p>

                        </div>

                      ) : (

                        <div className="mt-5 flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">

                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-300 shadow-sm">
                            <FiCalendar size={25} />
                          </div>

                          <p className="mt-4 font-bold text-slate-600">
                            QR code not generated
                          </p>

                          <p className="mt-1 max-w-xs px-4 text-center text-xs leading-5 text-slate-400">
                            Click "Generate QR Codes" above to create this week's codes.
                          </p>

                        </div>

                      )}

                    </div>

                  </div>
                );
              })}

            </div>

          )}

        </div>

        {/* =================================================
            SECURITY INFORMATION
        ================================================= */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <FiAlertCircle size={21} />
            </div>

            <div>

              <h3 className="font-bold text-blue-900">
                QR Code Security
              </h3>

              <p className="mt-1 text-sm leading-6 text-blue-800">
                Each QR code is assigned to a specific school
                day. Once that day has passed, the code is shown
                as inactive and cannot be used for another date.
                Staff should always scan the QR code assigned to
                the current day.
              </p>

            </div>

          </div>

        </div>

      </div>
    </AdminLayout>
  );
}

export default QRManagement;
