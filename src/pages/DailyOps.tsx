import { useMemo, useState } from "react";
import { ClipboardList, Plus, Trash2, Clock, Tag, AlertTriangle } from "lucide-react";
import { useStore } from "@/store/useStore";
import { isIllegalOccupation } from "@/lib/business";
import { todayISO, formatDate, weekdayLabel, cn } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import Stamp from "@/components/Stamp";
import Modal from "@/components/Modal";
import { Field, TextInput, Select } from "@/components/Form";
import { TIME_SLOTS, CATEGORIES } from "@/data/seed";

export default function DailyOps() {
  const { stalls, locations, applications, dailyRegs, addDailyReg, removeDailyReg } = useStore();
  const [open, setOpen] = useState(false);
  const [filterDate, setFilterDate] = useState(todayISO());

  const stallMap = new Map(stalls.map((s) => [s.id, s]));
  const locMap = new Map(locations.map((l) => [l.id, l]));

  const dayRegs = useMemo(
    () => dailyRegs.filter((r) => r.date === filterDate),
    [dailyRegs, filterDate],
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="每日出摊"
        title="出摊登记"
        subtitle="登记摊位号、出摊时段与经营品类"
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> 新增登记
          </button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-ink-muted">日期</label>
          <TextInput
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="!w-auto"
          />
        </div>
        <span className="text-sm text-ink-faint">
          {formatDate(filterDate)} · {weekdayLabel(filterDate)} · 共 {dayRegs.length} 条登记
        </span>
      </div>

      <SectionCard title="当日登记列表" subtitle="非固定点位且无临时批复将自动标记违规占道" icon={<ClipboardList size={18} />}>
        <div className="space-y-3">
          {dayRegs.length === 0 && (
            <p className="py-8 text-center text-sm text-ink-faint">该日暂无出摊登记</p>
          )}
          {dayRegs.map((reg) => {
            const stall = stallMap.get(reg.stallId);
            const loc = locMap.get(reg.locationId);
            const illegal = isIllegalOccupation(reg, stall, applications);
            return (
              <div
                key={reg.id}
                className={cn(
                  "flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between",
                  illegal ? "border-crimson-200 bg-crimson-50/50" : "border-cream-200/80 bg-white/50",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-terracotta-100 font-serif text-sm font-semibold text-terracotta-500">
                      {stall?.name.slice(0, 1)}
                    </span>
                    <span className="text-sm font-medium text-ink">{stall?.name}</span>
                    <span className="text-xs text-ink-faint">{stall?.stallNo}</span>
                    {illegal && (
                      <Stamp variant="crimson" rotate={-4}>
                        <AlertTriangle size={11} /> 违规占道
                      </Stamp>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                    <span className="flex items-center gap-1">
                      <Tag size={11} className="text-terracotta-300" /> 点位：{loc?.code} · {loc?.address}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} className="text-terracotta-300" /> {reg.timeSlots.join(" / ")}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {reg.categories.map((c) => (
                      <span key={c} className="rounded-full bg-cream-100 px-2 py-0.5 text-[11px] text-ink-soft">
                        {c}
                      </span>
                    ))}
                  </div>
                  {reg.note && (
                    <p className="mt-2 rounded bg-cream-100/60 p-2 text-xs text-ink-muted">备注：{reg.note}</p>
                  )}
                </div>
                <button
                  onClick={() => removeDailyReg(reg.id)}
                  className="shrink-0 rounded-md p-2 text-ink-faint transition hover:bg-crimson-50 hover:text-crimson-500"
                  aria-label="删除登记"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <RegModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={(data) => {
          addDailyReg(data);
          setFilterDate(data.date);
          setOpen(false);
        }}
      />
    </div>
  );
}

interface RegData {
  stallId: string;
  locationId: string;
  date: string;
  timeSlots: string[];
  categories: string[];
  note: string;
}

function RegModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RegData) => void;
}) {
  const { stalls, locations } = useStore();
  const [form, setForm] = useState<RegData>({
    stallId: stalls[0]?.id ?? "",
    locationId: stalls[0]?.locationId ?? "",
    date: todayISO(),
    timeSlots: [TIME_SLOTS[0]],
    categories: [],
    note: "",
  });

  const stall = stalls.find((s) => s.id === form.stallId);
  const isFixed = stall && form.locationId === stall.locationId;
  const valid = form.stallId && form.locationId && form.timeSlots.length > 0 && form.categories.length > 0;

  const toggleSlot = (slot: string) =>
    setForm((f) => ({
      ...f,
      timeSlots: f.timeSlots.includes(slot)
        ? f.timeSlots.filter((t) => t !== slot)
        : [...f.timeSlots, slot],
    }));

  const toggleCat = (cat: string) =>
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat],
    }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="新增出摊登记"
      subtitle="选择摊位、点位、时段与经营品类"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            取消
          </button>
          <button className="btn-primary" disabled={!valid} onClick={() => onSubmit(form)}>
            确认登记
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="摊位">
            <Select
              value={form.stallId}
              onChange={(e) => {
                const sid = e.target.value;
                const s = stalls.find((x) => x.id === sid);
                setForm({ ...form, stallId: sid, locationId: s?.locationId ?? form.locationId, categories: s ? [s.category] : [] });
              }}
            >
              {stalls.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.stallNo}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="出摊日期">
            <TextInput type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
        </div>

        <Field label="出摊点位" hint={isFixed ? "该摊位的固定点位" : "非固定点位，需有临时申请批复，否则登记后将标记违规占道"}>
          <Select value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })}>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.code} · {l.address}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="出摊时段（可多选）">
          <div className="flex flex-wrap gap-2">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => toggleSlot(slot)}
                className={cn("chip", form.timeSlots.includes(slot) && "chip-active")}
              >
                <Clock size={12} /> {slot}
              </button>
            ))}
          </div>
        </Field>

        <Field label="经营品类（可多选）">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCat(cat)}
                className={cn("chip", form.categories.includes(cat) && "chip-active")}
              >
                {cat}
              </button>
            ))}
          </div>
        </Field>

        <Field label="备注（选填）">
          <TextInput
            placeholder="如：迁至临时点位 / 节假日补货"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </Field>
      </div>
    </Modal>
  );
}
