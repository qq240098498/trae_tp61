import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  ClipboardList,
  Package,
  Wallet,
  ShieldCheck,
  Receipt,
  Menu,
  X,
  AlertTriangle,
  RotateCcw,
  Sun,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { computeAlerts } from "@/lib/business";
import { todayISO, formatDate, weekdayLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  desc: string;
}

const NAV: NavItem[] = [
  { to: "/", label: "概览", icon: LayoutDashboard, desc: "运营看板" },
  { to: "/locations", label: "点位管理", icon: MapPin, desc: "固定点位 / 临时申请" },
  { to: "/daily-ops", label: "出摊登记", icon: ClipboardList, desc: "摊位 / 时段 / 品类" },
  { to: "/procurement", label: "食材进货", icon: Package, desc: "进货台账" },
  { to: "/transactions", label: "流水记账", icon: Wallet, desc: "现金 / 扫码" },
  { to: "/inspections", label: "卫生检查", icon: ShieldCheck, desc: "检查记录" },
  { to: "/fees", label: "摊位费", icon: Receipt, desc: "缴纳状态" },
];

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-terracotta-400 text-cream-50 shadow-stamp">
        <Sun size={22} strokeWidth={2.2} />
        <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-cream-50 bg-olive-400" />
      </div>
      <div className="leading-tight">
        <div className="font-display text-lg text-ink">晨光摊位</div>
        <div className="text-[10px] tracking-[0.18em] text-ink-faint">MORNING · MARKET</div>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { stalls, locations, applications, dailyRegs, fees, inspections } = useStore();
  const alerts = computeAlerts(stalls, locations, applications, dailyRegs, fees, inspections);
  const alertCount = alerts.length;

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-5 pt-6">
        <Brand />
      </div>
      <nav className="scroll-area flex-1 space-y-1 overflow-y-auto px-3">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all",
                isActive
                  ? "bg-terracotta-400 text-cream-50 shadow-stamp"
                  : "text-ink-soft hover:bg-cream-100",
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} strokeWidth={2} className={isActive ? "" : "text-terracotta-400"} />
                <div className="flex-1 leading-tight">
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className={cn("text-[10px]", isActive ? "text-cream-50/80" : "text-ink-faint")}>
                    {item.desc}
                  </div>
                </div>
                {item.to === "/" && alertCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-crimson-400 px-1 text-[10px] font-bold text-cream-50">
                    {alertCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto border-t border-cream-300/70 p-4">
        <div className="rounded-lg bg-cream-100/70 p-3">
          <div className="text-[10px] uppercase tracking-wider text-ink-faint">今日</div>
          <div className="mt-0.5 font-display text-base text-ink">
            {formatDate(todayISO())} · {weekdayLabel(todayISO())}
          </div>
          {alertCount > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-crimson-500">
              <AlertTriangle size={13} />
              {alertCount} 项待处理告警
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const location = useLocation();
  const current = NAV.find((n) => (n.to === "/" ? location.pathname === "/" : location.pathname.startsWith(n.to)));
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-cream-300/60 bg-cream-100/80 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          className="rounded-md p-1.5 text-ink-soft hover:bg-cream-200 lg:hidden"
          aria-label="菜单"
        >
          <Menu size={20} />
        </button>
        <div className="leading-tight">
          <div className="font-display text-xl text-ink">{current?.label ?? "晨光摊位"}</div>
          <div className="hidden text-xs text-ink-faint sm:block">{current?.desc}</div>
        </div>
      </div>
      <ResetButton />
    </header>
  );
}

function ResetButton() {
  const resetData = useStore((s) => s.resetData);
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="btn-ghost !px-3 !py-1.5 text-xs">
        <RotateCcw size={14} />
        重置演示数据
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-lg border border-crimson-200 bg-crimson-50 px-2 py-1">
      <span className="text-xs text-crimson-500">确认重置？</span>
      <button
        onClick={() => {
          resetData();
          setConfirming(false);
        }}
        className="rounded bg-crimson-400 px-2 py-1 text-xs text-cream-50 hover:bg-crimson-500"
      >
        确定
      </button>
      <button onClick={() => setConfirming(false)} className="text-xs text-ink-muted hover:text-ink">
        取消
      </button>
    </div>
  );
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex h-full">
      <aside className="hidden w-64 shrink-0 border-r border-cream-300/70 bg-cream-50/70 backdrop-blur-md lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-cream-300 bg-cream-50 shadow-lift">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-md p-1 text-ink-muted hover:bg-cream-100"
            >
              <X size={18} />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setMobileOpen(true)} />
        <main className="scroll-area flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
