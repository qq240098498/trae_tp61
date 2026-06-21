import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Stall,
  Location,
  TempApplication,
  DailyRegistration,
  Procurement,
  Transaction,
  Inspection,
  FeeRecord,
  PaymentHistory,
  DunningNotice,
  PayMethod,
  AppStatus,
  InspectionResult,
  WeatherDay,
  Holiday,
  DailySalesRecord,
  IngredientMap,
} from "@/types";
import {
  seedLocations,
  seedStalls,
  seedApplications,
  seedDailyRegs,
  seedProcurements,
  seedTransactions,
  seedInspections,
  seedFees,
  seedPaymentHistories,
  seedDunningNotices,
  seedWeatherHistory,
  seedWeatherForecast,
  seedHolidays,
  seedSalesRecords,
  seedIngredientMaps,
  INGREDIENT_PRICES,
} from "@/data/seed";
import { todayISO, genId } from "@/lib/utils";

interface NewDailyReg {
  stallId: string;
  locationId: string;
  date: string;
  timeSlots: string[];
  categories: string[];
  note?: string;
}
interface NewProcurement {
  stallId: string;
  supplier: string;
  item: string;
  quantity: number;
  unit: string;
  amount: number;
  date: string;
}
interface NewTransaction {
  stallId: string;
  amount: number;
  method: PayMethod;
  category: string;
  note?: string;
}
interface NewInspection {
  stallId: string;
  date: string;
  items: { name: string; pass: boolean }[];
  deduction: number;
  inspector: string;
}
interface NewApplication {
  stallId: string;
  locationId: string;
  date: string;
  timeSlot: string;
  reason: string;
}
interface NewPayment {
  feeId: string;
  stallId: string;
  period: string;
  amount: number;
  method: PayMethod;
  operator: string;
  remark?: string;
}
interface NewDunning {
  feeId: string;
  stallId: string;
  period: string;
  dueAmount: number;
  overdueDays: number;
}

interface StoreState {
  stalls: Stall[];
  locations: Location[];
  applications: TempApplication[];
  dailyRegs: DailyRegistration[];
  procurements: Procurement[];
  transactions: Transaction[];
  inspections: Inspection[];
  fees: FeeRecord[];
  paymentHistories: PaymentHistory[];
  dunningNotices: DunningNotice[];
  weatherHistory: WeatherDay[];
  weatherForecast: WeatherDay[];
  holidays: Holiday[];
  salesRecords: DailySalesRecord[];
  ingredientMaps: IngredientMap[];
  ingredientPrices: Record<string, number>;

  addDailyReg: (data: NewDailyReg) => void;
  removeDailyReg: (id: string) => void;

  addProcurement: (data: NewProcurement) => void;

  addTransaction: (data: NewTransaction) => void;
  removeTransaction: (id: string) => void;

  addInspection: (data: NewInspection) => void;
  toggleRectified: (id: string) => void;

  addApplication: (data: NewApplication) => void;
  setApplicationStatus: (id: string, status: AppStatus) => void;

  payFee: (data: NewPayment) => void;
  sendDunningNotice: (data: NewDunning) => void;
  acknowledgeDunning: (id: string) => void;

  resetData: () => void;
}

function decideInspectionResult(items: { name: string; pass: boolean }[]): InspectionResult {
  const failed = items.filter((i) => !i.pass).length;
  if (failed >= 2) return "fail";
  if (failed === 1) return "warning";
  return "pass";
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      stalls: seedStalls,
      locations: seedLocations,
      applications: seedApplications,
      dailyRegs: seedDailyRegs,
      procurements: seedProcurements,
      transactions: seedTransactions,
      inspections: seedInspections,
      fees: seedFees,
      paymentHistories: seedPaymentHistories,
      dunningNotices: seedDunningNotices,
      weatherHistory: seedWeatherHistory,
      weatherForecast: seedWeatherForecast,
      holidays: seedHolidays,
      salesRecords: seedSalesRecords,
      ingredientMaps: seedIngredientMaps,
      ingredientPrices: INGREDIENT_PRICES,

      addDailyReg: (data) =>
        set((s) => ({
          dailyRegs: [
            {
              id: genId("DR"),
              ...data,
            },
            ...s.dailyRegs,
          ],
        })),

      removeDailyReg: (id) =>
        set((s) => ({ dailyRegs: s.dailyRegs.filter((r) => r.id !== id) })),

      addProcurement: (data) =>
        set((s) => ({
          procurements: [
            { id: genId("PR"), ...data },
            ...s.procurements,
          ],
        })),

      addTransaction: (data) =>
        set((s) => ({
          transactions: [
            {
              id: genId("TX"),
              time: `${todayISO()} ${new Date().toTimeString().slice(0, 5)}`,
              ...data,
            },
            ...s.transactions,
          ],
        })),

      removeTransaction: (id) =>
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),

      addInspection: (data) =>
        set((s) => ({
          inspections: [
            {
              id: genId("IN"),
              ...data,
              result: decideInspectionResult(data.items),
              rectified: false,
            },
            ...s.inspections,
          ],
        })),

      toggleRectified: (id) =>
        set((s) => ({
          inspections: s.inspections.map((i) =>
            i.id === id ? { ...i, rectified: !i.rectified } : i,
          ),
        })),

      addApplication: (data) =>
        set((s) => ({
          applications: [
            {
              id: genId("TA"),
              ...data,
              status: "pending",
              createdAt: todayISO(),
            },
            ...s.applications,
          ],
        })),

      setApplicationStatus: (id, status) =>
        set((s) => ({
          applications: s.applications.map((a) => (a.id === id ? { ...a, status } : a)),
        })),

      payFee: (data) =>
        set((s) => {
          const now = todayISO();
          const receiptNo = `RCP${new Date().getFullYear()}${String(s.paymentHistories.length + 1).padStart(6, "0")}`;
          const newPayment: PaymentHistory = {
            id: genId("PH"),
            feeId: data.feeId,
            stallId: data.stallId,
            period: data.period,
            amount: data.amount,
            method: data.method,
            paidAt: now,
            receiptNo,
            operator: data.operator,
            remark: data.remark,
          };
          return {
            paymentHistories: [newPayment, ...s.paymentHistories],
            fees: s.fees.map((f) => {
              if (f.id !== data.feeId) return f;
              const paidAmount = Math.min(f.dueAmount, f.paidAmount + data.amount);
              const status = paidAmount >= f.dueAmount ? "paid" : paidAmount > 0 ? "partial" : "unpaid";
              return {
                ...f,
                paidAmount,
                status,
                paidAt: paidAmount > 0 ? now : f.paidAt,
              };
            }),
          };
        }),

      sendDunningNotice: (data) =>
        set((s) => ({
          dunningNotices: [
            {
              id: genId("DN"),
              feeId: data.feeId,
              stallId: data.stallId,
              period: data.period,
              sentAt: todayISO(),
              dueAmount: data.dueAmount,
              overdueDays: data.overdueDays,
              status: "sent",
            },
            ...s.dunningNotices,
          ],
        })),

      acknowledgeDunning: (id) =>
        set((s) => ({
          dunningNotices: s.dunningNotices.map((d) =>
            d.id === id ? { ...d, status: "acknowledged", acknowledgedAt: todayISO() } : d,
          ),
        })),

      resetData: () =>
        set({
          stalls: seedStalls,
          locations: seedLocations,
          applications: seedApplications,
          dailyRegs: seedDailyRegs,
          procurements: seedProcurements,
          transactions: seedTransactions,
          inspections: seedInspections,
          fees: seedFees,
          paymentHistories: seedPaymentHistories,
          dunningNotices: seedDunningNotices,
          weatherHistory: seedWeatherHistory,
          weatherForecast: seedWeatherForecast,
          holidays: seedHolidays,
          salesRecords: seedSalesRecords,
          ingredientMaps: seedIngredientMaps,
          ingredientPrices: INGREDIENT_PRICES,
        }),
    }),
    {
      name: "chenguang-stall-mgmt-v1",
      version: 1,
    },
  ),
);
