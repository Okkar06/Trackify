import { CalendarDays, LayoutGrid, Palette, Settings, Wallet } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { cn } from "@/utils/cn";

const getPageTitle = (pathname: string) => {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/styleguide")) return "UI Style Guide";
  return "Not Found";
};

type NavItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
};

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutGrid },
  { label: "Work", to: "/work", icon: CalendarDays, disabled: true },
  { label: "Pay", to: "/pay", icon: Wallet, disabled: true },
  { label: "Settings", to: "/settings", icon: Settings, disabled: true },
  { label: "Style Guide", to: "/styleguide", icon: Palette },
];

export default function SidebarLayout() {
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen bg-trackify-bg">
      <div className="grid min-h-screen grid-cols-[280px_1fr]">
        <aside className="border-r border-trackify-border bg-trackify-surface">
          <div className="flex h-full flex-col">
            <div className="px-6 py-6">
              <div className="text-base font-semibold tracking-wide text-trackify-text">Trackify</div>
              <div className="mt-1 text-xs text-trackify-muted">Work & pay tracking</div>
            </div>
            <nav className="flex-1 px-3">
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  if (item.disabled) {
                    return (
                      <div
                        key={item.label}
                        className="flex items-center gap-3 rounded-control px-3 py-2 text-sm text-trackify-muted opacity-60"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                    );
                  }

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-control px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trackify-muted focus-visible:ring-offset-2 focus-visible:ring-offset-trackify-surface",
                          "hover:bg-white/5",
                          isActive
                            ? "border border-trackify-border bg-white/5 text-trackify-text"
                            : "text-trackify-muted"
                        )
                      }
                      end={item.to === "/"}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </nav>
            <div className="px-6 py-5 text-xs text-trackify-muted">Desktop foundation</div>
          </div>
        </aside>

        <main className="min-h-screen">
          <div className="container">
            <header className="flex items-center justify-between border-b border-trackify-border py-6">
              <div>
                <h1 className="text-2xl font-semibold text-trackify-text">{title}</h1>
                <p className="mt-1 text-sm text-trackify-muted">Black-and-white UI shell</p>
              </div>
              <div className="text-sm text-trackify-muted">Actions (coming soon)</div>
            </header>
            <div className="py-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

