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
  Order,
  OrderItem,
  OrderStatus,
  OrderSource,
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
  seedOrders,
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

interface NewOrderItem {
  name: string;
  quantity: number;
  price: number;
  category: string;
}

interface NewOrder {
  stallId: string;
  items: NewOrderItem[];
  source: OrderSource;
  customerName?: string;
  customerPhone?: string;
  note?: string;
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
  orders: Order[];

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

  addOrder: (data: NewOrder) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  callNextOrder: (stallId: string) => Order | null;
  completeOrder: (id: string) => void;
  cancelOrder: (id: string) => void;

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
      orders: seedOrders,

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

      addOrder: (data) =>
        set((s) => {
          const now = new Date();
          const dateStr = now.toISOString().slice(0, 10);
          const todayOrders = s.orders.filter((o) => o.createdAt.startsWith(dateStr));
          const nextNo = todayOrders.length + 1;
          const orderNo = `A${String(100 + nextNo)}`;
          const totalAmount = data.items.reduce((sum, it) => sum + it.price * it.quantity, 0);

          const newOrder: Order = {
            id: genId("ORD"),
            orderNo,
            stallId: data.stallId,
            items: data.items,
            totalAmount,
            status: "pending",
            source: data.source,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            createdAt: now.toISOString().slice(0, 16).replace("T", " "),
            note: data.note,
          };

          return {
            orders: [newOrder, ...s.orders],
          };
        }),

      updateOrderStatus: (id, status) =>
        set((s) => {
          const now = new Date().toISOString().slice(0, 16).replace("T", " ");
          return {
            orders: s.orders.map((o) => {
              if (o.id !== id) return o;
              const updates: Partial<Order> = { status };
              if (status === "ready") updates.calledAt = now;
              if (status === "completed") updates.completedAt = now;
              return { ...o, ...updates };
            }),
          };
        }),

      callNextOrder: (stallId) => {
        let nextOrder: Order | null = null;
        set((s) => {
          const pendingOrders = s.orders.filter(
            (o) => o.stallId === stallId && o.status === "pending",
          );
          if (pendingOrders.length === 0) return s;

          const oldest = pendingOrders.reduce((a, b) =>
            a.createdAt < b.createdAt ? a : b,
          );
          nextOrder = oldest;

          const now = new Date().toISOString().slice(0, 16).replace("T", " ");
          return {
            orders: s.orders.map((o) =>
              o.id === oldest.id ? { ...o, status: "preparing" as OrderStatus } : o,
            ),
          };
        });
        return nextOrder;
      },

      completeOrder: (id) =>
        set((s) => {
          const now = new Date().toISOString().slice(0, 16).replace("T", " ");
          return {
            orders: s.orders.map((o) =>
              o.id === id ? { ...o, status: "completed" as OrderStatus, completedAt: now } : o,
            ),
          };
        }),

      cancelOrder: (id) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id ? { ...o, status: "cancelled" as OrderStatus } : o,
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
          orders: seedOrders,
        }),
    }),
    {
      name: "chenguang-stall-mgmt-v1",
      version: 1,
    },
  ),
);
