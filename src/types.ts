export type PayMethod = "cash" | "scan";
export type AppStatus = "pending" | "approved" | "rejected";
export type InspectionResult = "pass" | "warning" | "fail";
export type FeeStatus = "paid" | "partial" | "unpaid";
export type LocationType = "fixed" | "temporary";

export interface Stall {
  id: string;
  name: string;
  stallNo: string;
  category: string;
  locationId: string;
  phone?: string;
}

export interface Location {
  id: string;
  code: string;
  address: string;
  district: string;
  capacity: number;
  type: LocationType;
  active: boolean;
}

export interface TempApplication {
  id: string;
  stallId: string;
  locationId: string;
  date: string;
  timeSlot: string;
  reason: string;
  status: AppStatus;
  createdAt: string;
}

export interface DailyRegistration {
  id: string;
  stallId: string;
  locationId: string;
  date: string;
  timeSlots: string[];
  categories: string[];
  note?: string;
}

export interface Procurement {
  id: string;
  stallId: string;
  supplier: string;
  item: string;
  quantity: number;
  unit: string;
  amount: number;
  date: string;
}

export interface Transaction {
  id: string;
  stallId: string;
  amount: number;
  method: PayMethod;
  category: string;
  time: string;
  note?: string;
}

export interface InspectionItem {
  name: string;
  pass: boolean;
}

export interface Inspection {
  id: string;
  stallId: string;
  date: string;
  items: InspectionItem[];
  result: InspectionResult;
  deduction: number;
  rectified: boolean;
  inspector: string;
}

export interface FeeRecord {
  id: string;
  stallId: string;
  period: string;
  dueAmount: number;
  paidAmount: number;
  dueDate: string;
  status: FeeStatus;
  paidAt?: string;
}

export interface AlertItem {
  key: string;
  type: "occupation" | "fee" | "inspection";
  stallId: string;
  title: string;
  detail: string;
  href: string;
}

export type WeatherType = "sunny" | "cloudy" | "rainy" | "stormy" | "snowy" | "hot";

export interface WeatherDay {
  date: string;
  type: WeatherType;
  tempHigh: number;
  tempLow: number;
  description: string;
}

export interface Holiday {
  date: string;
  name: string;
  isPublic: boolean;
}

export interface DailySalesRecord {
  date: string;
  stallId: string;
  category: string;
  quantity: number;
  revenue: number;
}

export interface IngredientMap {
  category: string;
  ingredients: { name: string; quantity: number; unit: string }[];
}

export interface ForecastDay {
  date: string;
  weekday: string;
  weather: WeatherDay;
  isHoliday: boolean;
  holidayName?: string;
  factor: number;
}

export interface CategoryForecast {
  category: string;
  stallId: string;
  stallName: string;
  daily: { date: string; quantity: number; revenue: number }[];
  weeklyTotal: { quantity: number; revenue: number };
  confidence: "high" | "medium" | "low";
}

export interface ProcurementItem {
  name: string;
  unit: string;
  requiredQty: number;
  safetyStock: number;
  suggestedQty: number;
  currentStock: number;
  toPurchase: number;
  usedBy: string[];
  estimatedCost?: number;
}
