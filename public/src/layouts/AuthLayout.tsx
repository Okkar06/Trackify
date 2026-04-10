import { Outlet } from "react-router-dom";

import trackifyLogo from "@/assets/Trackify logo.jpg";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-trackify-bg">
      <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6">
        <div className="w-full">
          <div className="mb-6 flex flex-col items-center">
            <img
              src={trackifyLogo}
              alt="Trackify"
              className="h-14 w-14 rounded-control border border-trackify-border object-cover grayscale"
            />
            <div className="mt-3 text-sm font-semibold tracking-wide text-trackify-text">Trackify</div>
            <div className="mt-1 text-xs text-trackify-muted">Work & pay tracking</div>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
