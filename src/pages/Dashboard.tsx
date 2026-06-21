import { useNavigate } from "react-router-dom";
import {
  MapPin,
  ClipboardList,
  Wallet,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Receipt,
  Banknote,
  QrCode,
  TrendingUp,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import {
  computeAlerts,
  isIllegalOccupation,
  last7DaysTrend,
  monthTotal,
  dayTxSummary,
} from "@/lib/business";
import { formatMoney, formatMoneyShort, todayISO, formatDate, weekdayLabel } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import SectionCard from "@/components/SectionCard";
import Stamp from "@/components/Stamp";
import TrendChart from "@/components/TrendChart";
import EmptyState from "@/components/EmptyState";

const ALERT_META = {
  occupation: { icon: AlertTriangle, tone: "crimson" as const, label: "违规占道" },
  fee: { icon: Receipt, tone: "amber" as const, label: "未缴摊位费" },
  inspection: { icon: ShieldAlert, tone: "crimson" as const, label: "卫生未整改" },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { stalls, locations, applications, dailyRegs, fees, inspections, transactions } = useStore();
  const today = todayISO();

  const todayRegs = dailyRegs.filter((r) => r.date === today);
  const alerts = computeAlerts(stalls, locations, applications, dailyRegs, fees, inspections, today);
  const trend = last7DaysTrend(transactions, today);
  const monthFlow = monthTotal(transactions, today);
  const todaySummary = dayTxSummary(transactions, today);

  const stallMap = new Map(stalls.map((s) => [s.id, s]));
  const locMap = new Map(locations.map((l) => [l.id, l]));

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="运营概览"
        title="今日晨光市集"
        subtitle={`${formatDate(today)} · ${weekdayLabel(today)} · 共 ${stalls.length} 个在册摊位`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="在册点位"
          value={locations.filter((l) => l.active).length}
          unit={`/ ${locations.length}`}
          icon={<MapPin size={16} />}
          tone="terracotta"
          delay={0}
          hint={`固定 ${locations.filter((l) => l.type === "fixed").length} · 临时 ${locations.filter((l) => l.type === "temporary").length}`}
        />
        <StatCard
          label="今日出摊"
          value={todayRegs.length}
          unit="摊"
          icon={<ClipboardList size={16} />}
          tone="ink"
          delay={60}
          hint={`占在册 ${(Math.round((todayRegs.length / stalls.length) * 100) || 0)}%`}
        />
        <StatCard
          label="本月流水"
          value={formatMoneyShort(monthFlow)}
          icon={<Wallet size={16} />}
          tone="olive"
          delay={120}
          hint={`今日 ${formatMoneyShort(todaySummary.total)} · ${todaySummary.count} 笔`}
        />
        <StatCard
          label="待处理告警"
          value={alerts.length}
          unit="项"
          icon={<AlertTriangle size={16} />}
          tone={alerts.length > 0 ? "crimson" : "olive"}
          delay={180}
          hint={alerts.length > 0 ? "违规占道 / 欠费 / 卫生" : "一切正常"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard
          title="今日出摊一览"
          subtitle="按点位归集的当日摊位"
          icon={<ClipboardList size={18} />}
          className="lg:col-span-2"
          action={
            <button onClick={() => navigate("/daily-ops")} className="btn-ghost !px-3 !py-1.5 text-xs">
              出摊登记 <ArrowRight size={14} />
            </button>
          }
        >
          {todayRegs.length === 0 ? (
            <EmptyState title="今日暂无出摊登记" description="前往出摊登记页添加" />
          ) : (
            <div className="space-y-2.5">
              {todayRegs.map((reg) => {
                const stall = stallMap.get(reg.stallId);
                const loc = locMap.get(reg.locationId);
                const illegal = isIllegalOccupation(reg, stall, applications);
                return (
                  <div
                    key={reg.id}
                    className="flex flex-col gap-2 rounded-lg border border-cream-200/80 bg-white/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-terracotta-100 font-serif text-sm font-semibold text-terracotta-500">
                        {stall?.name.slice(0, 1)}
                      </div>
                      <div className="leading-tight">
                        <div className="flex items-center gap-2 text-sm font-medium text-ink">
                          {stall?.name}
                          <span className="text-xs text-ink-faint">{stall?.stallNo}</span>
                        </div>
                        <div className="text-xs text-ink-muted">
                          {loc?.code} · {loc?.address}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {reg.categories.map((c) => (
                        <span key={c} className="rounded-full bg-cream-100 px-2 py-0.5 text-[11px] text-ink-soft">
                          {c}
                        </span>
                      ))}
                      {reg.timeSlots.map((t) => (
                        <span key={t} className="tnum text-[11px] text-ink-faint">
                          {t}
                        </span>
                      ))}
                      {illegal && (
                        <Stamp variant="crimson" rotate={-4}>
                          违规占道
                        </Stamp>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="告警中心"
          subtitle="自动标记 · 一目了然"
          icon={<AlertTriangle size={18} />}
          action={
            alerts.length > 0 ? (
              <span className="rounded-full bg-crimson-100 px-2 py-0.5 text-[11px] font-bold text-crimson-500">
                {alerts.length}
              </span>
            ) : null
          }
        >
          {alerts.length === 0 ? (
            <EmptyState
              icon={<ShieldAlert size={28} />}
              title="暂无告警"
              description="违规占道、欠费、卫生不合格将自动出现"
            />
          ) : (
            <div className="space-y-2.5">
              {alerts.map((a) => {
                const meta = ALERT_META[a.type];
                return (
                  <button
                    key={a.key}
                    onClick={() => navigate(a.href)}
                    className="group flex w-full items-start gap-3 rounded-lg border border-crimson-100 bg-crimson-50/60 p-3 text-left transition hover:border-crimson-200 hover:bg-crimson-50"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-crimson-100 text-crimson-500">
                      <meta.icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ink">{a.title}</span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">{a.detail}</p>
                    </div>
                    <ArrowRight size={15} className="mt-1 shrink-0 text-crimson-300 transition group-hover:translate-x-0.5 group-hover:text-crimson-500" />
                  </button>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard
          title="近 7 日流水趋势"
          subtitle="现金 / 扫码双维度"
          icon={<TrendingUp size={18} />}
          className="lg:col-span-2"
        >
          <TrendChart data={trend} />
        </SectionCard>

        <SectionCard title="今日收银" subtitle="现金与扫码拆分" icon={<Wallet size={18} />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-terracotta-50 p-3">
              <span className="flex items-center gap-2 text-sm text-ink-soft">
                <Banknote size={16} className="text-terracotta-400" /> 现金
              </span>
              <span className="font-serif text-lg font-semibold text-terracotta-500 tnum">
                {formatMoney(todaySummary.cash)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-olive-50 p-3">
              <span className="flex items-center gap-2 text-sm text-ink-soft">
                <QrCode size={16} className="text-olive-400" /> 扫码
              </span>
              <span className="font-serif text-lg font-semibold text-olive-500 tnum">
                {formatMoney(todaySummary.scan)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border-2 border-dashed border-cream-300 p-3">
              <span className="text-sm font-medium text-ink">合计</span>
              <span className="font-serif text-xl font-semibold text-ink tnum">
                {formatMoney(todaySummary.total)}
              </span>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
