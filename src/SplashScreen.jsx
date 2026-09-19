import React from "react";

const SplashScreen = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0f2747]">
      <div className="text-center animate-fade-in">

        {/* VSAMS */}
        <div className="mb-4">
          <h1 className="text-5xl font-bold tracking-wider text-white">
            VSAMS
          </h1>

          <p className="mt-2 text-sm tracking-[0.25em] text-blue-200">
            STAFF ATTENDANCE MANAGEMENT SYSTEM
          </p>
        </div>

        {/* Loading animation */}
        <div className="mx-auto mb-6 h-1 w-32 overflow-hidden rounded-full bg-blue-900">
          <div className="h-full w-full animate-loading rounded-full bg-white"></div>
        </div>

        {/* Powered by */}
        <p className="text-sm text-blue-200">
          Powered by
        </p>

        <p className="mt-1 text-lg font-semibold text-white">
          Abang Junior
        </p>

      </div>
    </div>
  );
};

export default SplashScreen;