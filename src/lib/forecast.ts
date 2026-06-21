import type {
  WeatherDay,
  Holiday,
  DailySalesRecord,
  IngredientMap,
  ForecastDay,
  CategoryForecast,
  ProcurementItem,
  Stall,
  WeatherType,
} from "@/types";
import { todayISO, addDays, weekdayLabel } from "@/lib/utils";

const WEATHER_IMPACT: Record<WeatherType, number> = {
  sunny: 1.05,
  cloudy: 1.0,
  rainy: 1.18,
  stormy: 0.7,
  snowy: 0.6,
  hot: 0.9,
};

const WEEKDAY_IMPACT: Record<number, number> = {
  0: 1.28,
  1: 0.95,
  2: 0.93,
  3: 0.97,
  4: 1.0,
  5: 1.08,
  6: 1.25,
};

const HOLIDAY_BOOST = 1.45;
const SAFETY_STOCK_RATIO = 0.2;

export function computeDayFactor(
  date: string,
  weather: WeatherDay | undefined,
  holidays: Holiday[],
): { factor: number; isHoliday: boolean; holidayName?: string } {
  const d = new Date(date.replace(/-/g, "/"));
  const dayOfWeek = d.getDay();
  let factor = WEEKDAY_IMPACT[dayOfWeek] ?? 1.0;

  if (weather) {
    factor *= WEATHER_IMPACT[weather.type] ?? 1.0;
  }

  const holiday = holidays.find((h) => h.date === date);
  let isHoliday = false;
  let holidayName: string | undefined;
  if (holiday) {
    factor *= HOLIDAY_BOOST;
    isHoliday = true;
    holidayName = holiday.name;
  }

  return { factor, isHoliday, holidayName };
}

export function buildForecastWeek(
  weatherForecast: WeatherDay[],
  holidays: Holiday[],
): ForecastDay[] {
  const result: ForecastDay[] = [];
  const today = todayISO();
  for (let i = 1; i <= 7; i++) {
    const date = addDays(today, i);
    const weather = weatherForecast.find((w) => w.date === date) ?? {
      date,
      type: "cloudy" as WeatherType,
      tempHigh: 25,
      tempLow: 18,
      description: "多云",
    };
    const { factor, isHoliday, holidayName } = computeDayFactor(date, weather, holidays);
    result.push({
      date,
      weekday: weekdayLabel(date),
      weather,
      isHoliday,
      holidayName,
      factor,
    });
  }
  return result;
}

export function computeCategoryBaseline(
  salesRecords: DailySalesRecord[],
  stallId: string,
  category: string,
): { avgDailyQty: number; avgDailyRevenue: number; variance: number } {
  const records = salesRecords.filter(
    (r) => r.stallId === stallId && r.category === category,
  );
  if (records.length === 0) return { avgDailyQty: 30, avgDailyRevenue: 150, variance: 0.2 };

  const qtySum = records.reduce((s, r) => s + r.quantity, 0);
  const revSum = records.reduce((s, r) => s + r.revenue, 0);
  const avgQty = qtySum / records.length;
  const avgRev = revSum / records.length;

  const variance =
    records.reduce((s, r) => s + Math.pow(r.quantity - avgQty, 2), 0) / records.length;
  const stdDev = Math.sqrt(variance);
  const cv = avgQty > 0 ? stdDev / avgQty : 0.2;

  return { avgDailyQty: avgQty, avgDailyRevenue: avgRev, variance: Math.min(cv, 0.5) };
}

export function generateForecasts(
  salesRecords: DailySalesRecord[],
  stalls: Stall[],
  forecastWeek: ForecastDay[],
  stallCats: Record<string, string[]>,
): CategoryForecast[] {
  const forecasts: CategoryForecast[] = [];

  stalls.forEach((stall) => {
    const categories = stallCats[stall.id] ?? [];
    categories.forEach((category) => {
      const baseline = computeCategoryBaseline(salesRecords, stall.id, category);
      const daily = forecastWeek.map((fd) => {
        const qty = Math.round(baseline.avgDailyQty * fd.factor);
        const rev = Math.round(baseline.avgDailyRevenue * fd.factor * 100) / 100;
        return { date: fd.date, quantity: qty, revenue: rev };
      });
      const weeklyTotal = daily.reduce(
        (acc, d) => ({ quantity: acc.quantity + d.quantity, revenue: acc.revenue + d.revenue }),
        { quantity: 0, revenue: 0 },
      );
      weeklyTotal.revenue = Math.round(weeklyTotal.revenue * 100) / 100;

      let confidence: "high" | "medium" | "low" = "medium";
      if (baseline.variance < 0.15) confidence = "high";
      else if (baseline.variance > 0.3) confidence = "low";

      forecasts.push({
        category,
        stallId: stall.id,
        stallName: stall.name,
        daily,
        weeklyTotal,
        confidence,
      });
    });
  });

  return forecasts;
}

export function generateProcurementList(
  forecasts: CategoryForecast[],
  ingredientMaps: IngredientMap[],
  ingredientPrices: Record<string, number>,
  currentStocks?: Record<string, { qty: number; unit: string }>,
): ProcurementItem[] {
  const aggregate: Record<
    string,
    { qty: number; unit: string; usedBy: Set<string> }
  > = {};

  forecasts.forEach((fc) => {
    const map = ingredientMaps.find((m) => m.category === fc.category);
    if (!map) return;
    map.ingredients.forEach((ing) => {
      const key = `${ing.name}|${ing.unit}`;
      if (!aggregate[key]) {
        aggregate[key] = { qty: 0, unit: ing.unit, usedBy: new Set() };
      }
      aggregate[key].qty += ing.quantity * fc.weeklyTotal.quantity;
      aggregate[key].usedBy.add(fc.category);
    });
  });

  return Object.entries(aggregate).map(([key, data]) => {
    const [name] = key.split("|");
    const stock = currentStocks?.[name];
    const currentStock = stock && stock.unit === data.unit ? stock.qty : 0;
    const requiredQty = Math.ceil(data.qty * 100) / 100;
    const safetyStock = Math.ceil(requiredQty * SAFETY_STOCK_RATIO * 100) / 100;
    const suggestedQty = requiredQty + safetyStock;
    const toPurchase = Math.max(0, Math.ceil((suggestedQty - currentStock) * 100) / 100);
    const unitPrice = ingredientPrices[name] ?? 0;
    const estimatedCost = Math.round(toPurchase * unitPrice * 100) / 100;

    return {
      name,
      unit: data.unit,
      requiredQty,
      safetyStock,
      suggestedQty,
      currentStock,
      toPurchase,
      usedBy: Array.from(data.usedBy),
      estimatedCost,
    };
  }).sort((a, b) => b.toPurchase - a.toPurchase);
}

export function weatherLabel(type: WeatherType): string {
  const map: Record<WeatherType, { label: string; icon: string }> = {
    sunny: { label: "晴", icon: "☀️" },
    cloudy: { label: "多云", icon: "⛅" },
    rainy: { label: "雨", icon: "🌧️" },
    stormy: { label: "暴雨", icon: "⛈️" },
    snowy: { label: "雪", icon: "❄️" },
    hot: { label: "高温", icon: "🔥" },
  };
  return map[type]?.label ?? "—";
}

export function weatherIcon(type: WeatherType): string {
  const map: Record<WeatherType, string> = {
    sunny: "☀️",
    cloudy: "⛅",
    rainy: "🌧️",
    stormy: "⛈️",
    snowy: "❄️",
    hot: "🔥",
  };
  return map[type] ?? "⛅";
}

export function confidenceLabel(c: "high" | "medium" | "low"): string {
  return { high: "高置信度", medium: "中置信度", low: "低置信度" }[c];
}
