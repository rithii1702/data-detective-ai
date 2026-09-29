import DetectiveAssistant from "@/components/detective/DetectiveAssistant";
import { useEffect, useState } from "react";
import { Link, Outlet, useRouterState, createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Upload, Table2, Sparkles, BarChart3, Search, Lightbulb,
  FileText, History, Settings, Bell, Moon, Sun, ChevronLeft, ChevronRight,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

type NavItem = { label: string; to: string; icon: typeof LayoutDashboard; exact?: boolean };
const nav: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard, exact: true },
  { label: "Upload Dataset", to: "/upload", icon: Upload },
  { label: "Data Explorer", to: "/explorer", icon: Table2 },
  { label: "Data Cleaning", to: "/cleaning", icon: Sparkles },
  { label: "EDA Visualizations", to: "/eda", icon: BarChart3 },
  { label: "Detective AI", to: "/detective", icon: Search },
  { label: "Insights", to: "/insights", icon: Lightbulb },
  { label: "Reports", to: "/reports", icon: FileText },
  { label: "History", to: "/history", icon: History },
  { label: "Settings", to: "/settings", icon: Settings },
];

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = typeof window !== "undefined" && window.localStorage.getItem("ddai-theme");
    const initial = stored === "dark";
    setDark(initial);
    document.documentElement.classList.toggle("dark", initial);
  }, []);
  const toggle = () => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      window.localStorage.setItem("ddai-theme", next ? "dark" : "light");
      return next;
    });
  };
  return { dark, toggle };
}

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { dark, toggle } = useDarkMode();

  const currentLabel = nav.find((n) => (n.exact ? pathname === n.to : pathname.startsWith(n.to) && n.to !== "/"))?.label ?? "Dashboard";

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-sidebar transition-all duration-300",
          collapsed ? "w-[76px]" : "w-64",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center gap-2 px-4 border-b border-border">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <Search className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">Data Detective</div>
              <div className="truncate text-[11px] text-muted-foreground">AI Investigations</div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          <ul className="space-y-1 px-2">
            {nav.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to) && item.to !== "/";
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-primary")} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {active && !collapsed && (
                      <motion.span
                        layoutId="active-pill"
                        className="absolute inset-y-1 right-1 w-1 rounded-full bg-primary"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground lg:flex"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className={cn("flex min-h-screen flex-1 flex-col transition-all duration-300", collapsed ? "lg:pl-[76px]" : "lg:pl-64")}>
        {/* Topbar */}
        <header className="sticky top-0 z-20 border-b border-border glass">
          <div className="flex h-16 items-center gap-3 px-4 md:px-6">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <PanelLeft className="h-5 w-5" />
            </Button>
            <div className="hidden text-sm text-muted-foreground md:block">
              <span className="text-foreground font-medium">{currentLabel}</span>
            </div>
            <div className="relative ml-auto hidden max-w-md flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search datasets, reports, insights…" className="pl-9 bg-card" />
            </div>
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1 p-4 md:p-8"
          >
            <Outlet />
            <DetectiveAssistant />
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
