"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Building2,
  ChevronDown,
  FilePlus2,
  Gift,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Package2,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  ScanLine,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Store,
  Ticket,
  Tickets,
  UserPlus,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/fetcher";
import { clearSessionCache } from "@/hooks/use-session";

const SIDEBAR_EXPANDED_STORAGE_KEY = "travel-agent-sidebar-expanded";

interface AppShellProps {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: "ADMIN" | "AGENT" | "STAFF" | "FINANCE";
    accountStatus?: "ACTIVE" | "INACTIVE" | "EXPIRED" | null;
  };
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Hidden for agents/partners whose account is expired. */
  requiresActive?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  children: NavLink[];
  /** Hidden for agents/partners whose account is expired. */
  requiresActive?: boolean;
}

type NavItem = NavLink | NavGroup;

const isNavGroup = (item: NavItem): item is NavGroup => "children" in item;

const isNavItemActive = (item: NavItem, pathname: string): boolean => {
  if (isNavGroup(item)) {
    return item.children.some((child) => isNavItemActive(child, pathname));
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
};

const filterNavForAccount = (items: NavItem[], expired: boolean): NavItem[] =>
  items
    .map((item) => {
      if (!isNavGroup(item)) return item;
      return {
        ...item,
        children: item.children.filter((child) => !(expired && child.requiresActive))
      };
    })
    .filter((item) => {
      if (expired && item.requiresActive) return false;
      if (isNavGroup(item)) return item.children.length > 0;
      return true;
    });

const navByRole: Record<AppShellProps["user"]["role"], NavItem[]> = {
  ADMIN: [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      id: "agent-management",
      label: "Agent",
      icon: UserPlus,
      children: [
        { href: "/admin/registrations/agents", label: "Agent Requests", icon: UserPlus },
        { href: "/admin/agents-active", label: "Active Agents", icon: Building2 }
      ]
    },
    {
      id: "partner-management",
      label: "Partner",
      icon: Building2,
      children: [
        { href: "/admin/registrations/partners", label: "Partner Requests", icon: UserPlus },
        { href: "/admin/partners-active", label: "Active Partners", icon: Building2 }
      ]
    },
    { href: "/admin/renewals", label: "Account Renewal", icon: RefreshCw },
    {
      id: "scheme-management",
      label: "Scheme",
      icon: Package2,
      children: [
        { href: "/admin/outlets", label: "Outlets", icon: Store },
        { href: "/products", label: "Products", icon: Package2 },
        { href: "/admin/purchase-schemes", label: "Purchase Schemes", icon: Package2 }
      ]
    },
    { href: "/admin/complimentary", label: "Complimentary", icon: Gift },
    { href: "/admin/offline-payments/pending", label: "Offline Payment", icon: Wallet },
    { href: "/settings", label: "Configuration", icon: Settings2 },
    { href: "/admin/announcements", label: "Announcement", icon: Megaphone },
    {
      id: "report",
      label: "Report",
      icon: BarChart3,
      children: [
        { href: "/admin/reports/transaction", label: "Transaction Report", icon: BarChart3 },
        { href: "/admin/reports/transaction-details", label: "Transaction Details", icon: BarChart3 },
        { href: "/admin/reports/purchase-summary", label: "Purchase Summary", icon: BarChart3 },
        { href: "/admin/reports/purchase-details", label: "Purchase Details", icon: BarChart3 },
        { href: "/admin/reports/top-purchase", label: "Top Purchase", icon: BarChart3 },
        { href: "/admin/reports/voucher-issued", label: "Voucher Issued", icon: BarChart3 },
        { href: "/admin/reports/ticket", label: "Ticket", icon: BarChart3 },
        { href: "/admin/reports/complimentary", label: "Complimentary", icon: BarChart3 },
        { href: "/admin/reports/payment", label: "Payment", icon: BarChart3 }
      ]
    },
    { href: "/documentation", label: "Documentation", icon: BookOpen }
  ],
  AGENT: [
    { href: "/agent/dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      id: "ticket-management",
      label: "Ticket Management",
      icon: Ticket,
      children: [
        { href: "/ticket-purchase", label: "Ticket Purchase", icon: ShoppingCart, requiresActive: true },
        { href: "/incomplete-orders", label: "Incomplete Order", icon: FilePlus2, requiresActive: true },
        { href: "/vouchers", label: "Voucher Issued", icon: Tickets }
      ]
    },
    { href: "/reports/purchase", label: "Reports", icon: BarChart3 },
    { href: "/profile", label: "Profile", icon: Building2 },
    { href: "/documentation", label: "Documentation", icon: BookOpen },
    { href: "/settings", label: "Settings", icon: Settings2 }
  ],
  FINANCE: [
    { href: "/finance/offline-payments", label: "Offline Payments", icon: Wallet },
    { href: "/settings", label: "Settings", icon: Settings2 }
  ],
  STAFF: [
    { href: "/scanner", label: "Scanner", icon: ScanLine },
    { href: "/voucher-redeem", label: "Voucher Redeem", icon: Tickets },
    { href: "/tickets", label: "Tickets", icon: Ticket },
    { href: "/settings", label: "Settings", icon: Settings2 }
  ]
};

export const AppShell = ({ user, title, subtitle, children }: AppShellProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openNavGroups, setOpenNavGroups] = useState<Record<string, boolean>>({});

  const navItems = useMemo(() => {
    const items = navByRole[user.role];
    return filterNavForAccount(items, user.accountStatus === "EXPIRED");
  }, [user.role, user.accountStatus]);
  const userInitials = useMemo(
    () =>
      user.fullName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join(""),
    [user.fullName]
  );
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-MY", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric"
      }).format(new Date()),
    []
  );

  const onLogout = async () => {
    try {
      await apiFetch<{ success: boolean }>("/api/auth/logout", { method: "POST" });
    } catch {
      // Session may already be invalid; continue with local sign-out cleanup.
    } finally {
      clearSessionCache();
      router.replace("/login");
    }
  };

  const setSidebarExpanded = (expanded: boolean) => {
    setSidebarOpen(expanded);
    window.localStorage.setItem(SIDEBAR_EXPANDED_STORAGE_KEY, String(expanded));
  };

  useEffect(() => {
    const saved = window.localStorage.getItem(SIDEBAR_EXPANDED_STORAGE_KEY);
    if (saved !== null) {
      setSidebarOpen(saved === "true");
    }
  }, []);

  useEffect(() => {
    setOpenNavGroups((prev) => {
      const next = { ...prev };
      for (const item of navItems) {
        if (isNavGroup(item) && isNavItemActive(item, pathname)) {
          next[item.id] = true;
        }
      }
      return next;
    });
  }, [navItems, pathname]);

  const renderNavLink = (item: NavLink, child = false) => {
    const active = isNavItemActive(item, pathname);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        title={item.label}
        aria-label={item.label}
        className={cn(
          "flex items-center rounded-xl text-sm font-semibold transition",
          child
            ? "gap-3 px-3 py-2"
            : sidebarOpen
              ? "justify-start gap-2 px-3 py-2.5"
              : "justify-center px-3 py-2.5",
          child
            ? active
              ? "bg-[#BDF7DD]/55 text-white"
              : "text-white/95 hover:bg-[#BDF7DD]/35 hover:text-white"
            : active
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        )}
      >
        {child ? (
          <span className="w-4 text-center text-white/85">-</span>
        ) : (
          <Icon className="h-4 w-4 shrink-0" />
        )}
        {sidebarOpen || child ? (
          <span className="truncate whitespace-nowrap">{item.label}</span>
        ) : (
          <span className="sr-only">{item.label}</span>
        )}
      </Link>
    );
  };

  const renderNavGroup = (item: NavGroup) => {
    const Icon = item.icon;
    const active = isNavItemActive(item, pathname);
    const open = sidebarOpen && openNavGroups[item.id] === true;

    if (!sidebarOpen) {
      return (
        <button
          key={item.id}
          type="button"
          title={item.label}
          aria-label={item.label}
          onClick={() => {
            setSidebarExpanded(true);
            setOpenNavGroups((prev) => ({ ...prev, [item.id]: true }));
          }}
          className={cn(
            "flex items-center justify-center rounded-xl px-3 py-2.5 text-sm font-semibold transition",
            active ? "bg-[#8BE8BE] text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
        </button>
      );
    }

    return (
      <div
        key={item.id}
        className={cn(
          "rounded-2xl p-1.5 transition",
          open || active ? "bg-[#8BE8BE] text-white shadow-[0_18px_38px_-28px_rgba(104,211,165,0.65)]" : "text-slate-600"
        )}
      >
        <button
          type="button"
          title={item.label}
          aria-label={item.label}
          aria-expanded={open}
          onClick={() => setOpenNavGroups((prev) => ({ ...prev, [item.id]: !open }))}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition",
            open || active ? "text-white hover:bg-[#BDF7DD]/35" : "hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate whitespace-nowrap">{item.label}</span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open ? "rotate-180" : "")} />
        </button>
        {open ? <div className="mt-1 grid gap-1 pb-1">{item.children.map((child) => renderNavLink(child, true))}</div> : null}
      </div>
    );
  };

  return (
    <div className="min-h-screen px-3 py-3 sm:px-5 sm:py-5">
      <div className="mx-auto w-full">
        <aside
          className={cn(
            "fixed bottom-3 left-3 top-3 z-50 overflow-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-[width] duration-300 sm:bottom-5 sm:left-5 sm:top-5",
            sidebarOpen ? "w-[286px]" : "w-[92px]"
          )}
        >
          <div
            className={cn(
              "border-b border-slate-200 pb-3",
              sidebarOpen ? "flex items-center gap-2" : "grid justify-items-center gap-2"
            )}
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400 text-xs font-black tracking-wide text-white">
              TA
            </span>
            {sidebarOpen ? (
              <p className="min-w-0 flex-1 truncate text-sm font-semibold tracking-wide text-slate-800">
                Travel Agent
              </p>
            ) : null}
            <button
              type="button"
              aria-label={sidebarOpen ? "Minimize sidebar" : "Expand sidebar"}
              title={sidebarOpen ? "Minimize sidebar" : "Expand sidebar"}
              onClick={() => setSidebarExpanded(!sidebarOpen)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </button>
          </div>

          <nav className="mt-3 grid gap-1">
            {navItems.map((item) => (isNavGroup(item) ? renderNavGroup(item) : renderNavLink(item)))}
          </nav>

          <div className="mt-3 grid gap-2 border-t border-slate-200 pt-3">
            <div
              title={`Role: ${user.role}`}
              className={cn(
                "rounded-xl text-emerald-700",
                sidebarOpen ? "flex items-center gap-2 px-3 py-2.5" : "flex items-center justify-center p-2.5"
              )}
            >
              <ShieldCheck className="h-4 w-4" />
              {sidebarOpen ? (
                <span className="text-[11px] font-semibold uppercase tracking-wide">{user.role}</span>
              ) : null}
            </div>
            <div
              title={todayLabel}
              className={cn(
                "rounded-xl text-slate-700",
                sidebarOpen ? "flex items-center gap-2 px-3 py-2.5" : "flex items-center justify-center p-2.5"
              )}
            >
              <CalendarDays className="h-4 w-4" />
              {sidebarOpen ? <span className="truncate text-[11px] font-medium">{todayLabel}</span> : null}
            </div>
            <Button
              title="Logout"
              aria-label="Logout"
              className={cn(
                "h-10 rounded-xl hover:bg-slate-100",
                sidebarOpen ? "justify-start gap-2 px-3" : "p-0"
              )}
              variant="ghost"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" />
              {sidebarOpen ? <span className="text-xs font-semibold">Logout</span> : null}
            </Button>
          </div>
        </aside>

        <main
          className={cn(
            "space-y-4 pb-8 transition-[padding-left] duration-300",
            sidebarOpen ? "pl-[298px]" : "pl-[104px]"
          )}
        >
          <header className="bento-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
            </div>

            <div className="ml-auto flex max-w-[220px] items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-[11px] font-bold text-emerald-700">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-800">{user.fullName}</p>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">{user.role}</p>
              </div>
            </div>
          </header>

          <div key={pathname} className="space-y-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
