import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-trackify-bg">
      <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6">
        <Outlet />
      </div>
    </div>
  );
}

