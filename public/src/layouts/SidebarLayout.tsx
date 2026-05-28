import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight, LayoutGrid, Menu, Wallet, X } from "lucide-react";
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
  return "Not Found";
};

type NavItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
};

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
];

export default function SidebarLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const title = getPageTitle(location.pathname);
  const [isCollapsed, setIsCollapsed] = React.useState(getInitialCollapsed);
  const [mobileOpen, setMobileOpen] = React.useState(false);
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

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-trackify-bg">
      <div className={cn("min-h-screen md:grid", isCollapsed ? "md:grid-cols-[88px_1fr]" : "md:grid-cols-[280px_1fr]")}>
        <aside className="sticky top-0 hidden h-screen border-r border-trackify-border bg-trackify-surface md:block">
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
                  className={cn("h-11 w-11 px-0", isCollapsed ? "" : "")}
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
                          "flex items-center rounded-control px-3 py-2 text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trackify-text/15 focus-visible:ring-offset-2 focus-visible:ring-offset-trackify-surface",
                          isCollapsed ? "justify-center" : "gap-3",
                          "hover:bg-trackify-surface2",
                          isActive
                            ? "border border-trackify-border2 bg-trackify-surface2 text-trackify-text"
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

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <aside className="relative h-full w-[280px] border-r border-trackify-border bg-trackify-surface shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between px-5 py-5">
                  <div className="flex items-center gap-3">
                    <img
                      src={trackifyLogo}
                      alt="Trackify"
                      className="h-10 w-10 rounded-control border border-trackify-border object-cover grayscale"
                    />
                    <div>
                      <div className="text-base font-semibold tracking-wide text-trackify-text">Trackify</div>
                      <div className="mt-1 text-xs text-trackify-muted">Work & pay tracking</div>
                    </div>
                  </div>
                  <Button type="button" variant="secondary" onClick={() => setMobileOpen(false)} className="h-11 w-11 px-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <nav className="flex-1 overflow-y-auto px-3 pb-5">
                  <div className="space-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          title={item.label}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-3 rounded-control px-4 py-3 text-[15px] transition-colors",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trackify-text/15 focus-visible:ring-offset-2 focus-visible:ring-offset-trackify-surface",
                              "hover:bg-trackify-surface2",
                              isActive
                                ? "border border-trackify-border2 bg-trackify-surface2 text-trackify-text"
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
                <div className="border-t border-trackify-border px-5 py-4">
                  <div className="text-xs text-trackify-muted">{displayName || " "}</div>
                </div>
              </div>
            </aside>
          </div>
        ) : null}

        <main className="min-h-screen">
          <div className="container">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-trackify-border bg-trackify-bg/80 py-4 backdrop-blur sm:py-6">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setMobileOpen(true)}
                  className="h-11 w-11 px-0 md:hidden"
                  title="Open menu"
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-semibold text-trackify-text sm:text-2xl">{title}</h1>
                  <p className="mt-1 hidden text-sm text-trackify-muted sm:block">Track shifts, hours, and pay</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden text-sm text-trackify-muted sm:block">{displayName || "Account"}</div>
                <Button variant="secondary" onClick={onLogout} className="w-auto">
                  Logout
                </Button>
              </div>
            </header>
            <div className="py-4 sm:py-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
