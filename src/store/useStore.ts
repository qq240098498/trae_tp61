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
  PayMethod,
  AppStatus,
  InspectionResult,
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

interface StoreState {
  stalls: Stall[];
  locations: Location[];
  applications: TempApplication[];
  dailyRegs: DailyRegistration[];
  procurements: Procurement[];
  transactions: Transaction[];
  inspections: Inspection[];
  fees: FeeRecord[];

  addDailyReg: (data: NewDailyReg) => void;
  removeDailyReg: (id: string) => void;

  addProcurement: (data: NewProcurement) => void;

  addTransaction: (data: NewTransaction) => void;
  removeTransaction: (id: string) => void;

  addInspection: (data: NewInspection) => void;
  toggleRectified: (id: string) => void;

  addApplication: (data: NewApplication) => void;
  setApplicationStatus: (id: string, status: AppStatus) => void;

  payFee: (id: string, amount: number) => void;

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

      payFee: (id, amount) =>
        set((s) => ({
          fees: s.fees.map((f) => {
            if (f.id !== id) return f;
            const paidAmount = Math.min(f.dueAmount, f.paidAmount + amount);
            const status = paidAmount >= f.dueAmount ? "paid" : paidAmount > 0 ? "partial" : "unpaid";
            return {
              ...f,
              paidAmount,
              status,
              paidAt: paidAmount > 0 ? todayISO() : f.paidAt,
            };
          }),
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
        }),
    }),
    {
      name: "chenguang-stall-mgmt-v1",
      version: 1,
    },
  ),
);
