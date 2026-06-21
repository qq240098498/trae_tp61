import type { DayTrend } from "@/lib/business";
import { formatDate, weekdayLabel, formatMoneyShort, cn } from "@/lib/utils";

interface TrendChartProps {
  data: DayTrend[];
}

export function TrendChart({ data }: TrendChartProps) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div>
      <div className="flex items-end justify-between gap-3" style={{ height: 180 }}>
        {data.map((d, i) => {
          const cashH = (d.cash / max) * 100;
          const scanH = (d.scan / max) * 100;
          const isToday = i === data.length - 1;
          return (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 items-end justify-center gap-1">
                <div
                  className="group relative flex w-3 origin-bottom items-end justify-center rounded-t-sm bg-terracotta-300 transition-all hover:bg-terracotta-400 animate-grow-bar sm:w-4"
                  style={{ height: `${Math.max(cashH, 2)}%`, animationDelay: `${i * 60}ms` }}
                  title={`现金 ${formatMoneyShort(d.cash)}`}
                >
                  <span className="pointer-events-none absolute -top-6 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[10px] text-cream-50 opacity-0 transition group-hover:opacity-100">
                    {formatMoneyShort(d.cash)}
                  </span>
                </div>
                <div
                  className="group relative flex w-3 origin-bottom items-end justify-center rounded-t-sm bg-olive-300 transition-all hover:bg-olive-400 animate-grow-bar sm:w-4"
                  style={{ height: `${Math.max(scanH, 2)}%`, animationDelay: `${i * 60 + 30}ms` }}
                  title={`扫码 ${formatMoneyShort(d.scan)}`}
                >
                  <span className="pointer-events-none absolute -top-6 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[10px] text-cream-50 opacity-0 transition group-hover:opacity-100">
                    {formatMoneyShort(d.scan)}
                  </span>
                </div>
              </div>
              <div className="text-center">
                <div className={cn("text-[11px]", isToday ? "font-bold text-terracotta-500" : "text-ink-faint")}>
                  {formatDate(d.date).replace("月", "/").replace("日", "")}
                </div>
                <div className="text-[10px] text-ink-faint">{weekdayLabel(d.date)}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-center gap-5 text-xs text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-terracotta-300" /> 现金
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-olive-300" /> 扫码
        </span>
      </div>
    </div>
  );
}

export default TrendChart;
