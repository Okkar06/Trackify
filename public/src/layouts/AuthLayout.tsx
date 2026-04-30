import { Outlet } from "react-router-dom";

import trackifyLogo from "@/assets/Trackify logo.jpg";

export default function AuthLayout() {
  return (
    <div className="relative min-h-screen bg-trackify-bg bg-[radial-gradient(1200px_600px_at_50%_-20%,rgba(255,255,255,0.10),transparent)]">
      <div className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2">
        <div className="flex flex-col items-center">
          <img
            src={trackifyLogo}
            alt="Trackify"
            className="h-14 w-14 rounded-control border border-trackify-border object-cover grayscale"
          />
          <div className="mt-3 text-sm font-semibold tracking-wide text-trackify-text">Trackify</div>
          <div className="mt-1 text-xs text-trackify-muted">Work & pay tracking</div>
        </div>
      </div>

      <div className="mx-auto grid min-h-screen max-w-2xl place-items-center px-6">
        <div className="w-full">
          <div className="pointer-events-auto mx-auto w-full max-w-lg">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
