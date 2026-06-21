import type {
  Stall,
  Location,
  TempApplication,
  DailyRegistration,
  Procurement,
  Transaction,
  Inspection,
  FeeRecord,
} from "@/types";
import { todayISO, addDays } from "@/lib/utils";

const TODAY = todayISO();

export const TIME_SLOTS = ["05:30-08:00", "08:00-10:30", "10:30-13:00"];

export const CATEGORIES = [
  "手抓饼",
  "豆浆",
  "包子",
  "粥",
  "油条",
  "胡辣汤",
  "煎饼果子",
  "面条",
  "馄饨",
  "杂粮煎饼",
  "烧饼",
  "小笼包",
  "蒸饺",
];

export const seedLocations: Location[] = [
  { id: "L-001", code: "DW-01", address: "朝阳路与和平大街交叉口西南角", district: "朝阳街道", capacity: 4, type: "fixed", active: true },
  { id: "L-002", code: "DW-02", address: "民安街西段便民疏导点", district: "民安街道", capacity: 6, type: "fixed", active: true },
  { id: "L-003", code: "DW-03", address: "地铁3号线B口集散广场", district: "城东街道", capacity: 5, type: "fixed", active: true },
  { id: "L-004", code: "DW-04", address: "实验小学东侧家长等候区", district: "文教区", capacity: 3, type: "fixed", active: true },
  { id: "L-005", code: "DW-05", address: "滨河早市广场中轴线", district: "滨河街道", capacity: 8, type: "fixed", active: true },
  { id: "L-006", code: "DW-06", address: "文化馆前广场北侧", district: "老城街道", capacity: 4, type: "fixed", active: true },
  { id: "L-007", code: "DW-T1", address: "体育中心南门（赛事临时）", district: "新城街道", capacity: 6, type: "temporary", active: true },
];

export const seedStalls: Stall[] = [
  { id: "ST-001", name: "王德发", stallNo: "车-001", category: "手抓饼", locationId: "L-001", phone: "138****2104" },
  { id: "ST-002", name: "李秀兰", stallNo: "车-002", category: "包子粥铺", locationId: "L-002", phone: "139****7720" },
  { id: "ST-003", name: "陈建国", stallNo: "车-003", category: "油条胡辣汤", locationId: "L-003", phone: "137****5508" },
  { id: "ST-004", name: "赵小敏", stallNo: "车-004", category: "煎饼果子", locationId: "L-004", phone: "135****9931" },
  { id: "ST-005", name: "周师傅", stallNo: "车-005", category: "面条馄饨", locationId: "L-005", phone: "136****4427" },
  { id: "ST-006", name: "孙姐", stallNo: "车-006", category: "杂粮煎饼", locationId: "L-006", phone: "133****6619" },
  { id: "ST-007", name: "吴大有", stallNo: "车-007", category: "烧饼夹菜", locationId: "L-001", phone: "188****3072" },
  { id: "ST-008", name: "郑阿姨", stallNo: "车-008", category: "小笼包蒸饺", locationId: "L-002", phone: "159****8845" },
];

export const seedApplications: TempApplication[] = [
  {
    id: "TA-001",
    stallId: "ST-004",
    locationId: "L-007",
    date: TODAY,
    timeSlot: "05:30-08:00",
    reason: "周末体育中心晨练人流大，申请临时点位增设早餐车。",
    status: "pending",
    createdAt: addDays(TODAY, -1),
  },
  {
    id: "TA-002",
    stallId: "ST-006",
    locationId: "L-005",
    date: TODAY,
    timeSlot: "08:00-10:30",
    reason: "早市广场活动日，临时迁至人流量更大的点位经营。",
    status: "approved",
    createdAt: addDays(TODAY, -2),
  },
  {
    id: "TA-003",
    stallId: "ST-008",
    locationId: "L-007",
    date: addDays(TODAY, -1),
    timeSlot: "05:30-08:00",
    reason: "昨日赛事临时点位申请。",
    status: "approved",
    createdAt: addDays(TODAY, -3),
  },
  {
    id: "TA-004",
    stallId: "ST-002",
    locationId: "L-004",
    date: addDays(TODAY, -1),
    timeSlot: "08:00-10:30",
    reason: "学校周边早餐需求，申请临时支援。",
    status: "rejected",
    createdAt: addDays(TODAY, -2),
  },
  {
    id: "TA-005",
    stallId: "ST-007",
    locationId: "L-007",
    date: TODAY,
    timeSlot: "08:00-10:30",
    reason: "周末临时点位申请，待审核。",
    status: "pending",
    createdAt: addDays(TODAY, -1),
  },
];

export const seedDailyRegs: DailyRegistration[] = [
  {
    id: "DR-001",
    stallId: "ST-001",
    locationId: "L-001",
    date: TODAY,
    timeSlots: ["05:30-08:00", "08:00-10:30"],
    categories: ["手抓饼", "豆浆"],
  },
  {
    id: "DR-002",
    stallId: "ST-002",
    locationId: "L-002",
    date: TODAY,
    timeSlots: ["05:30-08:00", "08:00-10:30"],
    categories: ["包子", "粥"],
  },
  {
    id: "DR-003",
    stallId: "ST-003",
    locationId: "L-005",
    date: TODAY,
    timeSlots: ["05:30-08:00"],
    categories: ["油条", "胡辣汤"],
    note: "自行迁至滨河广场，未提交临时申请。",
  },
  {
    id: "DR-004",
    stallId: "ST-004",
    locationId: "L-004",
    date: TODAY,
    timeSlots: ["08:00-10:30"],
    categories: ["煎饼果子"],
  },
  {
    id: "DR-005",
    stallId: "ST-005",
    locationId: "L-005",
    date: TODAY,
    timeSlots: ["05:30-08:00", "08:00-10:30", "10:30-13:00"],
    categories: ["面条", "馄饨"],
  },
  {
    id: "DR-006",
    stallId: "ST-006",
    locationId: "L-005",
    date: TODAY,
    timeSlots: ["08:00-10:30"],
    categories: ["杂粮煎饼"],
    note: "已获临时点位批复 TA-002。",
  },
  {
    id: "DR-007",
    stallId: "ST-007",
    locationId: "L-001",
    date: TODAY,
    timeSlots: ["05:30-08:00"],
    categories: ["烧饼"],
  },
  {
    id: "DR-008",
    stallId: "ST-008",
    locationId: "L-002",
    date: TODAY,
    timeSlots: ["05:30-08:00", "08:00-10:30"],
    categories: ["小笼包", "蒸饺"],
  },
  {
    id: "DR-009",
    stallId: "ST-001",
    locationId: "L-001",
    date: addDays(TODAY, -1),
    timeSlots: ["05:30-08:00", "08:00-10:30"],
    categories: ["手抓饼", "豆浆"],
  },
  {
    id: "DR-010",
    stallId: "ST-002",
    locationId: "L-002",
    date: addDays(TODAY, -1),
    timeSlots: ["05:30-08:00", "08:00-10:30"],
    categories: ["包子", "粥"],
  },
  {
    id: "DR-011",
    stallId: "ST-008",
    locationId: "L-007",
    date: addDays(TODAY, -1),
    timeSlots: ["05:30-08:00"],
    categories: ["小笼包"],
  },
];

export const seedProcurements: Procurement[] = [
  { id: "PR-001", stallId: "ST-001", supplier: "兴粮粮油批发", item: "面粉（高筋）", quantity: 50, unit: "kg", amount: 165, date: addDays(TODAY, -2) },
  { id: "PR-002", stallId: "ST-001", supplier: "本地豆制品厂", item: "豆浆原浆", quantity: 30, unit: "L", amount: 120, date: addDays(TODAY, -1) },
  { id: "PR-003", stallId: "ST-002", supplier: "顺发肉联", item: "猪前腿肉", quantity: 15, unit: "kg", amount: 405, date: addDays(TODAY, -1) },
  { id: "PR-004", stallId: "ST-002", supplier: "农联米业", item: "粳米", quantity: 25, unit: "kg", amount: 137.5, date: addDays(TODAY, -3) },
  { id: "PR-005", stallId: "ST-003", supplier: "兴粮粮油批发", item: "面粉（中筋）", quantity: 40, unit: "kg", amount: 116, date: addDays(TODAY, -2) },
  { id: "PR-006", stallId: "ST-003", supplier: "豫香调味", item: "胡辣汤料包", quantity: 10, unit: "包", amount: 80, date: addDays(TODAY, -1) },
  { id: "PR-007", stallId: "ST-004", supplier: "农联米业", item: "绿豆杂面", quantity: 20, unit: "kg", amount: 96, date: addDays(TODAY, -2) },
  { id: "PR-008", stallId: "ST-005", supplier: "顺发肉联", item: "鲜肉糜", quantity: 12, unit: "kg", amount: 324, date: addDays(TODAY, -1) },
  { id: "PR-009", stallId: "ST-006", supplier: "农联米业", item: "杂粮粉", quantity: 18, unit: "kg", amount: 108, date: addDays(TODAY, -3) },
  { id: "PR-010", stallId: "ST-008", supplier: "顺发肉联", item: "猪后腿肉", quantity: 14, unit: "kg", amount: 378, date: addDays(TODAY, -2) },
  { id: "PR-011", stallId: "ST-007", supplier: "兴粮粮油批发", item: "面粉", quantity: 30, unit: "kg", amount: 99, date: addDays(TODAY, -1) },
];

function buildTransactions(): Transaction[] {
  const list: Transaction[] = [];
  const activeStalls = ["ST-001", "ST-002", "ST-003", "ST-004", "ST-005", "ST-006", "ST-007", "ST-008"];
  const stallCats: Record<string, string[]> = {
    "ST-001": ["手抓饼", "豆浆"],
    "ST-002": ["包子", "粥"],
    "ST-003": ["油条", "胡辣汤"],
    "ST-004": ["煎饼果子"],
    "ST-005": ["面条", "馄饨"],
    "ST-006": ["杂粮煎饼"],
    "ST-007": ["烧饼"],
    "ST-008": ["小笼包", "蒸饺"],
  };
  let counter = 1;
  for (let d = 6; d >= 0; d--) {
    const date = addDays(TODAY, -d);
    activeStalls.forEach((sid, si) => {
      const count = 3 + ((si + d) % 3);
      for (let i = 0; i < count; i++) {
        const base = 6 + ((si * 3 + i * 5 + d * 7) % 38);
        const amount = base + (i % 2 === 0 ? 2.5 : 1);
        const method = (si + i + d) % 3 === 0 ? "cash" : "scan";
        const cats = stallCats[sid];
        const category = cats[(i + d) % cats.length];
        const hour = 5 + ((i + si) % 5);
        const min = (i * 17 + si * 13) % 60;
        const time = `${date} ${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
        list.push({
          id: `TX-${String(counter++).padStart(4, "0")}`,
          stallId: sid,
          amount,
          method: method as "cash" | "scan",
          category,
          time,
        });
      }
    });
  }
  return list;
}

export const seedTransactions: Transaction[] = buildTransactions();

export const seedInspections: Inspection[] = [
  {
    id: "IN-001",
    stallId: "ST-001",
    date: addDays(TODAY, -5),
    items: [
      { name: "从业人员健康证", pass: true },
      { name: "食材采购溯源", pass: true },
      { name: "操作台卫生", pass: true },
      { name: "餐具消毒", pass: true },
    ],
    result: "pass",
    deduction: 0,
    rectified: true,
    inspector: "周洁",
  },
  {
    id: "IN-002",
    stallId: "ST-002",
    date: addDays(TODAY, -4),
    items: [
      { name: "从业人员健康证", pass: true },
      { name: "食材采购溯源", pass: true },
      { name: "操作台卫生", pass: false },
      { name: "餐具消毒", pass: true },
    ],
    result: "warning",
    deduction: 10,
    rectified: true,
    inspector: "周洁",
  },
  {
    id: "IN-003",
    stallId: "ST-005",
    date: addDays(TODAY, -3),
    items: [
      { name: "从业人员健康证", pass: true },
      { name: "食材采购溯源", pass: false },
      { name: "操作台卫生", pass: false },
      { name: "餐具消毒", pass: false },
    ],
    result: "fail",
    deduction: 25,
    rectified: false,
    inspector: "李强",
  },
  {
    id: "IN-004",
    stallId: "ST-007",
    date: addDays(TODAY, -6),
    items: [
      { name: "从业人员健康证", pass: true },
      { name: "食材采购溯源", pass: true },
      { name: "操作台卫生", pass: true },
      { name: "餐具消毒", pass: false },
    ],
    result: "warning",
    deduction: 8,
    rectified: false,
    inspector: "李强",
  },
  {
    id: "IN-005",
    stallId: "ST-003",
    date: addDays(TODAY, -7),
    items: [
      { name: "从业人员健康证", pass: true },
      { name: "食材采购溯源", pass: true },
      { name: "操作台卫生", pass: true },
      { name: "餐具消毒", pass: true },
    ],
    result: "pass",
    deduction: 0,
    rectified: true,
    inspector: "周洁",
  },
  {
    id: "IN-006",
    stallId: "ST-008",
    date: addDays(TODAY, -2),
    items: [
      { name: "从业人员健康证", pass: true },
      { name: "食材采购溯源", pass: true },
      { name: "操作台卫生", pass: true },
      { name: "餐具消毒", pass: true },
    ],
    result: "pass",
    deduction: 0,
    rectified: true,
    inspector: "李强",
  },
];

const CURRENT_PERIOD = TODAY.slice(0, 7);

export const seedFees: FeeRecord[] = seedStalls.map((s, idx) => {
  const due = 600 + (idx % 3) * 100;
  const statuses: ("paid" | "partial" | "unpaid")[] = ["paid", "paid", "unpaid", "partial", "unpaid", "paid", "partial", "paid"];
  const status = statuses[idx % statuses.length];
  const paid = status === "paid" ? due : status === "partial" ? Math.round(due * 0.5) : 0;
  return {
    id: `FE-${s.id}`,
    stallId: s.id,
    period: CURRENT_PERIOD,
    dueAmount: due,
    paidAmount: paid,
    dueDate: addDays(TODAY, -2 + (idx % 4)),
    status,
    paidAt: status === "paid" ? addDays(TODAY, -5) : undefined,
  };
});
