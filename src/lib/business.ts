import type {
  Stall,
  Location,
  TempApplication,
  DailyRegistration,
  Transaction,
  Inspection,
  FeeRecord,
  AlertItem,
  PaymentHistory,
  MonthlyFeeSummary,
  DunningNotice,
} from "@/types";
import { todayISO, addDays, daysBetween } from "@/lib/utils";

/** 违规占道：当日点位非其固定点位 且 无对应 approved 临时申请 */
export function isIllegalOccupation(
  reg: DailyRegistration,
  stall: Stall | undefined,
  applications: TempApplication[],
): boolean {
  if (!stall) return false;
  if (reg.locationId === stall.locationId) return false;
  const approved = applications.some(
    (a) =>
      a.stallId === reg.stallId &&
      a.locationId === reg.locationId &&
      a.status === "approved" &&
      a.date === reg.date,
  );
  return !approved;
}

/** 欠费：实缴 < 应缴 且 已过到期日 */
export function isOverdueFee(fee: FeeRecord, today = todayISO()): boolean {
  if (fee.paidAmount >= fee.dueAmount) return false;
  return fee.dueDate < today;
}

export function latestInspection(
  inspections: Inspection[],
  stallId: string,
): Inspection | undefined {
  const list = inspections
    .filter((i) => i.stallId === stallId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return list[0];
}

/** 卫生未整改：最新检查 fail 且未整改 */
export function hasOpenInspection(
  inspections: Inspection[],
  stallId: string,
): boolean {
  const latest = latestInspection(inspections, stallId);
  if (!latest) return false;
  return latest.result === "fail" && !latest.rectified;
}

export function feeStatusOf(fee: FeeRecord, today = todayISO()): {
  label: string;
  kind: "paid" | "partial" | "unpaid" | "overdue";
  overdue: boolean;
} {
  if (fee.paidAmount >= fee.dueAmount) return { label: "已缴清", kind: "paid", overdue: false };
  const overdue = fee.dueDate < today;
  if (overdue) return { label: "欠费逾期", kind: "overdue", overdue: true };
  if (fee.paidAmount > 0) return { label: "部分缴纳", kind: "partial", overdue: false };
  return { label: "待缴纳", kind: "unpaid", overdue: false };
}

export function computeAlerts(
  stalls: Stall[],
  locations: Location[],
  applications: TempApplication[],
  dailyRegs: DailyRegistration[],
  fees: FeeRecord[],
  inspections: Inspection[],
  today = todayISO(),
): AlertItem[] {
  const alerts: AlertItem[] = [];

  dailyRegs
    .filter((r) => r.date === today)
    .forEach((reg) => {
      const stall = stalls.find((s) => s.id === reg.stallId);
      if (isIllegalOccupation(reg, stall, applications)) {
        const loc = locations.find((l) => l.id === reg.locationId);
        alerts.push({
          key: `occ-${reg.id}`,
          type: "occupation",
          stallId: reg.stallId,
          title: `违规占道 · ${stall?.name ?? reg.stallId}`,
          detail: `非固定点位经营，点位：${loc?.code ?? reg.locationId}（${loc?.address ?? ""}）`,
          href: "/daily-ops",
        });
      }
    });

  fees.forEach((fee) => {
    const stall = stalls.find((s) => s.id === fee.stallId);
    if (isOverdueFee(fee, today)) {
      alerts.push({
        key: `fee-${fee.id}`,
        type: "fee",
        stallId: fee.stallId,
        title: `未缴摊位费 · ${stall?.name ?? fee.stallId}`,
        detail: `${fee.period}期 应缴¥${fee.dueAmount}，到期日 ${fee.dueDate}，已逾期`,
        href: "/fees",
      });
    }
  });

  stalls.forEach((stall) => {
    if (hasOpenInspection(inspections, stall.id)) {
      const latest = latestInspection(inspections, stall.id);
      alerts.push({
        key: `ins-${stall.id}`,
        type: "inspection",
        stallId: stall.id,
        title: `卫生不合格未整改 · ${stall.name}`,
        detail: `检查日 ${latest?.date}，扣分 ${latest?.deduction}，待整改`,
        href: "/inspections",
      });
    }
  });

  return alerts;
}

export function locationOccupancy(
  locationId: string,
  dailyRegs: DailyRegistration[],
  today = todayISO(),
): number {
  return dailyRegs.filter((r) => r.locationId === locationId && r.date === today).length;
}

export interface DayTrend {
  date: string;
  cash: number;
  scan: number;
  total: number;
}

export function last7DaysTrend(transactions: Transaction[], today = todayISO()): DayTrend[] {
  const days: DayTrend[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = addDays(today, -i);
    const dayTx = transactions.filter((t) => t.time.startsWith(date));
    const cash = dayTx.filter((t) => t.method === "cash").reduce((s, t) => s + t.amount, 0);
    const scan = dayTx.filter((t) => t.method === "scan").reduce((s, t) => s + t.amount, 0);
    days.push({ date, cash, scan, total: cash + scan });
  }
  return days;
}

export function dayTxSummary(transactions: Transaction[], date: string) {
  const dayTx = transactions.filter((t) => t.time.startsWith(date));
  const cash = dayTx.filter((t) => t.method === "cash").reduce((s, t) => s + t.amount, 0);
  const scan = dayTx.filter((t) => t.method === "scan").reduce((s, t) => s + t.amount, 0);
  return { cash, scan, total: cash + scan, count: dayTx.length };
}

export function monthTotal(transactions: Transaction[], today = todayISO()): number {
  const prefix = today.slice(0, 7);
  return transactions
    .filter((t) => t.time.startsWith(prefix))
    .reduce((s, t) => s + t.amount, 0);
}

/** 重复申请检测：同一摊位在同一天相同时段的非驳回申请已存在 */
export function findDuplicateApplication(
  applications: TempApplication[],
  stallId: string,
  locationId: string,
  date: string,
  timeSlot: string,
): TempApplication | undefined {
  return applications.find(
    (a) =>
      a.stallId === stallId &&
      a.locationId === locationId &&
      a.date === date &&
      a.timeSlot === timeSlot &&
      a.status !== "rejected",
  );
}

export function getAvailablePeriods(fees: FeeRecord[]): string[] {
  const periods = new Set(fees.map((f) => f.period));
  return Array.from(periods).sort().reverse();
}

export function computeMonthlyFeeSummary(
  stalls: Stall[],
  fees: FeeRecord[],
  payments: PaymentHistory[],
  period: string,
): MonthlyFeeSummary[] {
  return stalls.map((stall) => {
    const fee = fees.find((f) => f.stallId === stall.id && f.period === period);
    const stallPayments = payments.filter((p) => p.stallId === stall.id && p.period === period);
    const dueAmount = fee?.dueAmount ?? 0;
    const paidAmount = fee?.paidAmount ?? 0;
    const overdue = fee ? isOverdueFee(fee) : false;
    const status: FeeRecord["status"] = fee?.status ?? "unpaid";
    const lastPayment = stallPayments.sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1))[0];
    return {
      stallId: stall.id,
      stallName: stall.name,
      stallNo: stall.stallNo,
      period,
      dueAmount,
      paidAmount,
      overdueAmount: overdue ? dueAmount - paidAmount : 0,
      status,
      paymentCount: stallPayments.length,
      lastPaidAt: lastPayment?.paidAt,
    };
  });
}

export interface FeeStats {
  totalDue: number;
  totalPaid: number;
  totalOverdue: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  overdueCount: number;
  collectionRate: number;
}

export function computeFeeStats(summary: MonthlyFeeSummary[]): FeeStats {
  const totalDue = summary.reduce((s, r) => s + r.dueAmount, 0);
  const totalPaid = summary.reduce((s, r) => s + r.paidAmount, 0);
  const totalOverdue = summary.reduce((s, r) => s + r.overdueAmount, 0);
  const paidCount = summary.filter((r) => r.status === "paid").length;
  const partialCount = summary.filter((r) => r.status === "partial").length;
  const unpaidCount = summary.filter((r) => r.status === "unpaid").length;
  const overdueCount = summary.filter((r) => r.overdueAmount > 0).length;
  const collectionRate = totalDue ? Math.round((totalPaid / totalDue) * 100) : 0;
  return { totalDue, totalPaid, totalOverdue, paidCount, partialCount, unpaidCount, overdueCount, collectionRate };
}

export function getPaymentsByFee(payments: PaymentHistory[], feeId: string): PaymentHistory[] {
  return payments.filter((p) => p.feeId === feeId).sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1));
}

export function getPaymentsByStallAndPeriod(
  payments: PaymentHistory[],
  stallId: string,
  period: string,
): PaymentHistory[] {
  return payments
    .filter((p) => p.stallId === stallId && p.period === period)
    .sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1));
}

export function shouldSendDunning(
  fee: FeeRecord,
  dunnings: DunningNotice[],
  today = todayISO(),
): boolean {
  if (!isOverdueFee(fee, today)) return false;
  const existing = dunnings.filter((d) => d.feeId === fee.id);
  if (existing.length === 0) return true;
  const lastSent = existing.sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1))[0];
  return daysBetween(lastSent.sentAt, today) >= 7;
}

export function getOverdueFees(fees: FeeRecord[], today = todayISO()): FeeRecord[] {
  return fees.filter((f) => isOverdueFee(f, today));
}

export function getStallTotalArrears(
  fees: FeeRecord[],
  stallId: string,
  today = todayISO(),
): number {
  return fees
    .filter((f) => f.stallId === stallId && isOverdueFee(f, today))
    .reduce((s, f) => s + (f.dueAmount - f.paidAmount), 0);
}
