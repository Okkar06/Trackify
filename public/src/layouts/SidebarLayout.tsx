import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight, LayoutGrid, Palette, Settings, Wallet } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { cn } from "@/utils/cn";
import Button from "@/components/Button";
import { useAuthStore } from "@/stores/authStore";
import { fetchUserProfile } from "@/services/userService";
import trackifyLogo from "@/assets/Trackify logo.jpg";

const getPageTitle = (pathname: string) => {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/work")) return "Work";
  if (pathname.startsWith("/pay")) return "Pay Calculator";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/styleguide")) return "UI Style Guide";
  return "Not Found";
};

type NavItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
};

const showStyleGuide = import.meta.env.DEV;
const SIDEBAR_COLLAPSED_KEY = "trackify_sidebar_collapsed";

const getInitialCollapsed = () => {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
};

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutGrid },
  { label: "Work", to: "/work", icon: CalendarDays },
  { label: "Pay", to: "/pay", icon: Wallet },
  { label: "Settings", to: "/settings", icon: Settings },
  ...(showStyleGuide ? [{ label: "Style Guide", to: "/styleguide", icon: Palette }] : []),
];

export default function SidebarLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const title = getPageTitle(location.pathname);
  const [isCollapsed, setIsCollapsed] = React.useState(getInitialCollapsed);
  const [displayName, setDisplayName] = React.useState<string>("");

  const onLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  React.useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
    } catch {}
  }, [isCollapsed]);

  React.useEffect(() => {
    const controller = new AbortController();
    fetchUserProfile({ signal: controller.signal })
      .then((res: any) => {
        const name = String(res?.profile?.fullName || res?.profile?.email || "").trim();
        if (name) setDisplayName(name);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen bg-trackify-bg">
      <div className={cn("grid min-h-screen", isCollapsed ? "grid-cols-[88px_1fr]" : "grid-cols-[280px_1fr]")}>
        <aside className="sticky top-0 h-screen border-r border-trackify-border bg-trackify-surface">
          <div className="flex h-full flex-col">
            <div className="px-6 py-6">
              <div className={cn("flex items-center justify-between", isCollapsed ? "gap-0" : "gap-3")}>
                <img
                  src={trackifyLogo}
                  alt="Trackify"
                  className={cn(
                    "rounded-control border border-trackify-border object-cover grayscale",
                    isCollapsed ? "h-10 w-10" : "h-9 w-9"
                  )}
                />
                {!isCollapsed ? (
                  <div className="flex-1">
                    <div className="text-base font-semibold tracking-wide text-trackify-text">Trackify</div>
                    <div className="mt-1 text-xs text-trackify-muted">Work & pay tracking</div>
                  </div>
                ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsCollapsed((v) => !v)}
                  className={cn("h-9 w-9 px-0", isCollapsed ? "" : "")}
                  title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto px-3">
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  if (item.disabled) {
                    return (
                      <div
                        key={item.label}
                        className={cn(
                          "flex items-center rounded-control px-3 py-2 text-sm text-trackify-muted opacity-60",
                          isCollapsed ? "justify-center" : "gap-3"
                        )}
                        title={item.label}
                      >
                        <Icon className="h-4 w-4" />
                        {!isCollapsed ? <span>{item.label}</span> : null}
                      </div>
                    );
                  }

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      title={item.label}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center rounded-control px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trackify-muted focus-visible:ring-offset-2 focus-visible:ring-offset-trackify-surface",
                          isCollapsed ? "justify-center" : "gap-3",
                          "hover:bg-white/5",
                          isActive
                            ? "border border-trackify-border bg-white/5 text-trackify-text"
                            : "text-trackify-muted"
                        )
                      }
                      end={item.to === "/"}
                    >
                      <Icon className="h-4 w-4" />
                      {!isCollapsed ? <span>{item.label}</span> : null}
                    </NavLink>
                  );
                })}
              </div>
            </nav>
            {!isCollapsed ? (
              <div className="px-6 py-5 text-xs text-trackify-muted">{displayName || " "}</div>
            ) : (
              <div className="px-3 py-5 text-xs text-trackify-muted"> </div>
            )}
          </div>
        </aside>

        <main className="min-h-screen">
          <div className="container">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-trackify-border bg-trackify-bg py-6">
              <div>
                <h1 className="text-2xl font-semibold text-trackify-text">{title}</h1>
                <p className="mt-1 text-sm text-trackify-muted">Black-and-white UI shell</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-trackify-muted">{displayName || "Account"}</div>
                <Button variant="secondary" onClick={onLogout}>
                  Logout
                </Button>
              </div>
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
