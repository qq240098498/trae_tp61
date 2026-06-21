import { useMemo, useState } from "react";
import {
  TrendingUp,
  CloudRain,
  Calendar,
  ShoppingCart,
  Package,
  BarChart3,
  Sun,
  Download,
  RefreshCw,
  Store,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import {
  buildForecastWeek,
  generateForecasts,
  generateProcurementList,
  weatherIcon,
  confidenceLabel,
} from "@/lib/forecast";
import { formatMoney, formatDate, weekdayLabel, cn } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import StatCard from "@/components/StatCard";
import Table, { type Column } from "@/components/Table";
import type { CategoryForecast, ProcurementItem } from "@/types";

const STALL_CATEGORIES: Record<string, string[]> = {
  "ST-001": ["手抓饼", "豆浆"],
  "ST-002": ["包子", "粥"],
  "ST-003": ["油条", "胡辣汤"],
  "ST-004": ["煎饼果子"],
  "ST-005": ["面条", "馄饨"],
  "ST-006": ["杂粮煎饼"],
  "ST-007": ["烧饼"],
  "ST-008": ["小笼包", "蒸饺"],
};

export default function Forecast() {
  const {
    stalls,
    weatherForecast,
    holidays,
    salesRecords,
    ingredientMaps,
    ingredientPrices,
  } = useStore();
  const [filterStall, setFilterStall] = useState("all");
  const [tab, setTab] = useState<"forecast" | "procurement">("forecast");
  const [refreshKey, setRefreshKey] = useState(0);

  const forecastWeek = useMemo(
    () => buildForecastWeek(weatherForecast, holidays),
    [weatherForecast, holidays, refreshKey],
  );

  const allForecasts = useMemo(
    () => generateForecasts(salesRecords, stalls, forecastWeek, STALL_CATEGORIES),
    [salesRecords, stalls, forecastWeek, refreshKey],
  );

  const forecasts = useMemo(
    () =>
      filterStall === "all"
        ? allForecasts
        : allForecasts.filter((f) => f.stallId === filterStall),
    [allForecasts, filterStall],
  );

  const procurementList = useMemo(
    () => generateProcurementList(allForecasts, ingredientMaps, ingredientPrices),
    [allForecasts, ingredientMaps, ingredientPrices, refreshKey],
  );

  const totalForecastQty = forecasts.reduce((s, f) => s + f.weeklyTotal.quantity, 0);
  const totalForecastRevenue = forecasts.reduce((s, f) => s + f.weeklyTotal.revenue, 0);
  const totalProcurementCost = procurementList.reduce((s, p) => s + (p.estimatedCost ?? 0), 0);
  const totalProcurementItems = procurementList.length;

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="智能预测"
        title="周销量预测 & 采购清单"
        subtitle="基于历史销量、天气、节假日多维度综合预估，自动生成食材采购方案"
        actions={
          <button
            className="btn-ghost"
            onClick={() => setRefreshKey((k) => k + 1)}
          >
            <RefreshCw size={14} /> 重新计算
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <button
          onClick={() => setTab("forecast")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-all",
            tab === "forecast"
              ? "border-terracotta-400 bg-terracotta-400 text-cream-50 shadow-stamp"
              : "border-cream-300 bg-white/60 text-ink-soft hover:bg-cream-100",
          )}
        >
          <BarChart3 size={16} /> 销量预测
        </button>
        <button
          onClick={() => setTab("procurement")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-all",
            tab === "procurement"
              ? "border-terracotta-400 bg-terracotta-400 text-cream-50 shadow-stamp"
              : "border-cream-300 bg-white/60 text-ink-soft hover:bg-cream-100",
          )}
        >
          <ShoppingCart size={16} /> 采购清单
        </button>
      </div>

      {tab === "forecast" ? (
        <ForecastView
          forecastWeek={forecastWeek}
          forecasts={forecasts}
          stalls={stalls}
          filterStall={filterStall}
          setFilterStall={setFilterStall}
          totalForecastQty={totalForecastQty}
          totalForecastRevenue={totalForecastRevenue}
        />
      ) : (
        <ProcurementView
          procurementList={procurementList}
          totalItems={totalProcurementItems}
          totalCost={totalProcurementCost}
        />
      )}
    </div>
  );
}

function ForecastView({
  forecastWeek,
  forecasts,
  stalls,
  filterStall,
  setFilterStall,
  totalForecastQty,
  totalForecastRevenue,
}: {
  forecastWeek: ReturnType<typeof buildForecastWeek>;
  forecasts: CategoryForecast[];
  stalls: ReturnType<typeof useStore.getState>["stalls"];
  filterStall: string;
  setFilterStall: (v: string) => void;
  totalForecastQty: number;
  totalForecastRevenue: number;
}) {
  const forecastColumns: Column<CategoryForecast>[] = [
    {
      key: "stall",
      header: "摊位 / 品项",
      render: (r) => (
        <div className="leading-tight">
          <div className="font-medium text-ink">{r.category}</div>
          <div className="text-[11px] text-ink-faint">{r.stallName}</div>
        </div>
      ),
    },
    ...forecastWeek.map((fd) => ({
      key: `day-${fd.date}`,
      header: (
        <div className="text-center leading-tight">
          <div>{formatDate(fd.date).replace("月", "/").replace("日", "")}</div>
          <div className={cn("text-[10px]", fd.isHoliday ? "text-crimson-500 font-bold" : "text-ink-faint")}>
            {fd.isHoliday ? fd.holidayName : fd.weekday}
          </div>
          <div className="text-xs">{weatherIcon(fd.weather.type)}</div>
        </div>
      ),
      headerClassName: "text-center",
      align: "center" as const,
      render: (r: CategoryForecast) => {
        const d = r.daily.find((x) => x.date === fd.date);
        return <span className="tnum text-ink-soft">{d?.quantity ?? 0}</span>;
      },
    })),
    {
      key: "totalQty",
      header: "周总量",
      align: "right",
      render: (r) => <span className="tnum font-semibold text-terracotta-500">{r.weeklyTotal.quantity}</span>,
    },
    {
      key: "totalRev",
      header: "周营收",
      align: "right",
      render: (r) => <span className="tnum text-olive-500">{formatMoney(r.weeklyTotal.revenue)}</span>,
    },
    {
      key: "confidence",
      header: "置信度",
      align: "center",
      render: (r) => (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold",
            r.confidence === "high"
              ? "bg-olive-100 text-olive-600"
              : r.confidence === "medium"
              ? "bg-amber2-100 text-amber2-600"
              : "bg-crimson-100 text-crimson-500",
          )}
        >
          {confidenceLabel(r.confidence)}
        </span>
      ),
    },
  ];

  const maxQty = Math.max(...forecasts.flatMap((f) => f.daily.map((d) => d.quantity)), 1);

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="预测品项"
          value={forecasts.length}
          unit="个"
          icon={<TrendingUp size={16} />}
          tone="terracotta"
          hint={`${filterStall === "all" ? "全部摊位" : "单摊位筛选"}`}
        />
        <StatCard
          label="预测总销量"
          value={totalForecastQty}
          unit="份"
          icon={<Package size={16} />}
          tone="ink"
          hint="下周 7 天合计"
        />
        <StatCard
          label="预测营收"
          value={formatMoney(totalForecastRevenue)}
          icon={<Sun size={16} />}
          tone="olive"
        />
        <StatCard
          label="假期影响"
          value={forecastWeek.filter((d) => d.isHoliday).length}
          unit="天"
          icon={<Calendar size={16} />}
          tone="crimson"
          hint="已纳入预测计算"
        />
      </div>

      <SectionCard
        title="未来一周天气与节假日"
        subtitle="影响销量的外部因素一览"
        icon={<CloudRain size={18} />}
        className="mb-6"
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {forecastWeek.map((fd) => (
            <div
              key={fd.date}
              className={cn(
                "rounded-lg border p-3 text-center",
                fd.isHoliday
                  ? "border-crimson-200 bg-crimson-50/60"
                  : "border-cream-200 bg-white/60",
              )}
            >
              <div className="text-[11px] text-ink-faint">
                {formatDate(fd.date).replace("月", "/").replace("日", "")}
              </div>
              <div
                className={cn(
                  "text-sm font-semibold",
                  fd.isHoliday ? "text-crimson-500" : "text-ink",
                )}
              >
                {fd.isHoliday ? fd.holidayName : fd.weekday}
              </div>
              <div className="my-1 text-2xl">{weatherIcon(fd.weather.type)}</div>
              <div className="text-[11px] text-ink-soft">{fd.weather.description}</div>
              <div className="tnum text-[11px] text-ink-muted">
                {fd.weather.tempLow}°~{fd.weather.tempHigh}°
              </div>
              <div className="mt-1.5 text-[10px] text-terracotta-500">
                系数 ×{fd.factor.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="各品项销量预测"
        subtitle="单位：份（日均基线 × 周几系数 × 天气系数 × 节假日系数）"
        icon={<BarChart3 size={18} />}
        action={
          <div className="flex items-center gap-2">
            <select
              value={filterStall}
              onChange={(e) => setFilterStall(e.target.value)}
              className="rounded-lg border border-cream-300 bg-white/70 px-3 py-1.5 text-xs text-ink outline-none focus:border-terracotta-400"
            >
              <option value="all">全部摊位</option>
              {stalls.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        }
      >
        <Table columns={forecastColumns} data={forecasts} rowKey={(r) => `${r.stallId}-${r.category}`} />

        <div className="mt-5">
          <div className="mb-2 text-xs font-medium text-ink-muted">销量分布柱状图</div>
          <div className="flex items-end gap-2" style={{ height: 160 }}>
            {forecastWeek.map((fd) => {
              const dayTotal = forecasts.reduce(
                (s, f) => s + (f.daily.find((d) => d.date === fd.date)?.quantity ?? 0),
                0,
              );
              const h = (dayTotal / maxQty / forecastWeek.length) * 380;
              return (
                <div key={fd.date} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className="group relative flex w-full items-end justify-center rounded-t-md bg-gradient-to-t from-terracotta-300 to-terracotta-400 transition-all hover:from-terracotta-400 hover:to-terracotta-500"
                    style={{ height: `${Math.max(h, 4)}px` }}
                  >
                    <span className="pointer-events-none absolute -top-6 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[10px] text-cream-50 opacity-0 transition group-hover:opacity-100">
                      {dayTotal} 份
                    </span>
                  </div>
                  <div className="text-center text-[11px] text-ink-faint">
                    {weekdayLabel(fd.date).slice(1)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SectionCard>
    </>
  );
}

function ProcurementView({
  procurementList,
  totalItems,
  totalCost,
}: {
  procurementList: ProcurementItem[];
  totalItems: number;
  totalCost: number;
}) {
  const procurementColumns: Column<ProcurementItem>[] = [
    {
      key: "name",
      header: "食材名称",
      render: (r) => (
        <div className="leading-tight">
          <div className="font-medium text-ink">{r.name}</div>
          <div className="text-[11px] text-ink-faint">
            用于：{r.usedBy.join("、")}
          </div>
        </div>
      ),
    },
    {
      key: "unit",
      header: "单位",
      align: "center",
      render: (r) => <span className="text-ink-muted">{r.unit}</span>,
    },
    {
      key: "requiredQty",
      header: "生产需求",
      align: "right",
      render: (r) => <span className="tnum text-ink-soft">{r.requiredQty}</span>,
    },
    {
      key: "safetyStock",
      header: "安全库存",
      align: "right",
      render: (r) => (
        <span className="tnum text-olive-500">+{r.safetyStock}</span>
      ),
    },
    {
      key: "suggestedQty",
      header: "建议总量",
      align: "right",
      render: (r) => <span className="tnum font-medium text-ink">{r.suggestedQty}</span>,
    },
    {
      key: "currentStock",
      header: "现有库存",
      align: "right",
      render: (r) => (
        <span className="tnum text-amber2-500">-{r.currentStock}</span>
      ),
    },
    {
      key: "toPurchase",
      header: "应采购",
      align: "right",
      render: (r) => (
        <span className={cn("tnum font-bold", r.toPurchase > 0 ? "text-terracotta-500" : "text-olive-500")}>
          {r.toPurchase}
        </span>
      ),
    },
    {
      key: "cost",
      header: "预估金额",
      align: "right",
      render: (r) => (
        <span className="tnum text-ink-soft">{formatMoney(r.estimatedCost ?? 0)}</span>
      ),
    },
  ];

  const handleExport = () => {
    const lines = [
      ["食材名称", "单位", "生产需求", "安全库存", "建议总量", "现有库存", "应采购", "预估金额"].join(","),
      ...procurementList.map((p) =>
        [p.name, p.unit, p.requiredQty, p.safetyStock, p.suggestedQty, p.currentStock, p.toPurchase, formatMoney(p.estimatedCost ?? 0)].join(","),
      ),
      ["合计", "", "", "", "", "", "", formatMoney(totalCost)].join(","),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `采购清单_${formatDate(new Date().toISOString().slice(0, 10)).replace("/", "月").replace("/", "日")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="采购食材"
          value={totalItems}
          unit="种"
          icon={<ShoppingCart size={16} />}
          tone="terracotta"
        />
        <StatCard
          label="预估采购额"
          value={formatMoney(totalCost)}
          icon={<Package size={16} />}
          tone="olive"
          hint="含 20% 安全库存"
        />
        <StatCard
          label="缺货风险"
          value={procurementList.filter((p) => p.toPurchase > p.suggestedQty * 0.8).length}
          unit="项"
          icon={<Store size={16} />}
          tone="crimson"
          hint="需重点关注"
        />
        <StatCard
          label="库存充足"
          value={procurementList.filter((p) => p.toPurchase === 0).length}
          unit="项"
          icon={<Package size={16} />}
          tone="ink"
          hint="无需采购"
        />
      </div>

      <SectionCard
        title="食材采购清单"
        subtitle="基于下周预测销量 + BOM 配方 + 安全库存自动生成"
        icon={<ShoppingCart size={18} />}
        action={
          <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={handleExport}>
            <Download size={14} /> 导出 CSV
          </button>
        }
      >
        <Table columns={procurementColumns} data={procurementList} rowKey={(r) => r.name} />

        <div className="mt-4 flex items-center justify-between rounded-lg border-2 border-dashed border-cream-300 p-3">
          <span className="text-sm font-medium text-ink">采购合计</span>
          <span className="font-serif text-2xl font-semibold text-terracotta-500 tnum">
            {formatMoney(totalCost)}
          </span>
        </div>

        <div className="mt-4 rounded-lg bg-olive-50/80 p-3 text-xs text-olive-700">
          <div className="mb-1 font-semibold">📋 采购说明</div>
          <ul className="list-disc space-y-0.5 pl-4 text-olive-600">
            <li>生产需求 = 各品项下周预测销量 × 单品食材耗用量</li>
            <li>安全库存 = 生产需求 × 20%，用于应对突发增量</li>
            <li>应采购 = 建议总量 − 现有库存，为 0 表示库存充足</li>
            <li>预估金额按历史采购单价计算，实际以供应商报价为准</li>
          </ul>
        </div>
      </SectionCard>
    </>
  );
}
