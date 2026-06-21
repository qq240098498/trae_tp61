import { useState } from "react";
import {
  MapPin,
  Plus,
  Check,
  X,
  Clock,
  Users,
  MapPinned,
  FileText,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { locationOccupancy } from "@/lib/business";
import { todayISO, formatDate, cn } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import Stamp from "@/components/Stamp";
import Modal from "@/components/Modal";
import { Field, TextInput, Select } from "@/components/Form";
import { TIME_SLOTS } from "@/data/seed";
import type { AppStatus } from "@/types";

type Tab = "fixed" | "applications";

export default function Locations() {
  const {
    locations,
    stalls,
    dailyRegs,
    applications,
    setApplicationStatus,
    addApplication,
  } = useStore();
  const [tab, setTab] = useState<Tab>("fixed");
  const [openApply, setOpenApply] = useState(false);
  const today = todayISO();

  const stallMap = new Map(stalls.map((s) => [s.id, s]));
  const locMap = new Map(locations.map((l) => [l.id, l]));

  const pendingApps = applications.filter((a) => a.status === "pending").length;

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="点位管理"
        title="出摊点位"
        subtitle={`固定点位 ${locations.filter((l) => l.type === "fixed").length} 个 · 临时点位 ${locations.filter((l) => l.type === "temporary").length} 个`}
        actions={
          <button className="btn-primary" onClick={() => setOpenApply(true)}>
            <Plus size={16} /> 临时点位申请
          </button>
        }
      />

      <div className="mb-5 inline-flex rounded-lg border border-cream-300 bg-cream-50/70 p-1">
        <TabButton active={tab === "fixed"} onClick={() => setTab("fixed")}>
          <MapPinned size={15} /> 固定点位
        </TabButton>
        <TabButton active={tab === "applications"} onClick={() => setTab("applications")}>
          <FileText size={15} /> 临时申请
          {pendingApps > 0 && (
            <span className="ml-1 rounded-full bg-amber2-400 px-1.5 text-[10px] font-bold text-cream-50">
              {pendingApps}
            </span>
          )}
        </TabButton>
      </div>

      {tab === "fixed" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations
            .filter((l) => l.type === "fixed")
            .map((loc, i) => {
              const occ = locationOccupancy(loc.id, dailyRegs, today);
              const ratio = loc.capacity ? occ / loc.capacity : 0;
              const full = occ >= loc.capacity;
              return (
                <div
                  key={loc.id}
                  className="card card-hover animate-fade-up relative overflow-hidden p-5"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <span className="absolute left-0 top-5 h-12 w-1.5 rounded-r bg-terracotta-400" />
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-lg font-semibold text-ink">{loc.code}</span>
                        <span className="rounded bg-cream-100 px-1.5 py-0.5 text-[10px] text-ink-muted">
                          {loc.district}
                        </span>
                      </div>
                      <p className="mt-1 flex items-start gap-1 text-xs text-ink-muted">
                        <MapPin size={12} className="mt-0.5 shrink-0 text-terracotta-300" />
                        {loc.address}
                      </p>
                    </div>
                    {full ? (
                      <Stamp variant="crimson" rotate={-4}>
                        已满
                      </Stamp>
                    ) : occ > 0 ? (
                      <Stamp variant="olive" rotate={-4}>
                        经营中
                      </Stamp>
                    ) : (
                      <Stamp variant="ink" rotate={-4}>
                        空置
                      </Stamp>
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-ink-muted">
                        <Users size={12} /> 今日占用
                      </span>
                      <span className="tnum text-ink-soft">
                        {occ} / {loc.capacity}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cream-200">
                      <div
                        className={cn("h-full rounded-full transition-all", full ? "bg-crimson-400" : "bg-terracotta-300")}
                        style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        <SectionCard title="临时点位申请" subtitle="审核临时出摊与迁移申请" icon={<FileText size={18} />}>
          <div className="space-y-3">
            {applications.length === 0 && <p className="py-6 text-center text-sm text-ink-faint">暂无申请</p>}
            {applications.map((app) => {
              const stall = stallMap.get(app.stallId);
              const loc = locMap.get(app.locationId);
              return (
                <div
                  key={app.id}
                  className="flex flex-col gap-3 rounded-lg border border-cream-200/80 bg-white/50 p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-ink">{stall?.name}</span>
                      <span className="text-xs text-ink-faint">{stall?.stallNo}</span>
                      <AppStamp status={app.status} />
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">
                      申请点位：<span className="text-ink-soft">{loc?.code}</span> · {loc?.address}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-ink-faint">
                      <Clock size={11} /> {formatDate(app.date)} · {app.timeSlot} · 提交于 {formatDate(app.createdAt)}
                    </p>
                    <p className="mt-1.5 rounded bg-cream-100/70 p-2 text-xs text-ink-soft">{app.reason}</p>
                  </div>
                  {app.status === "pending" ? (
                    <div className="flex shrink-0 gap-2">
                      <button
                        className="btn-olive !px-3 !py-1.5 text-xs"
                        onClick={() => setApplicationStatus(app.id, "approved")}
                      >
                        <Check size={14} /> 通过
                      </button>
                      <button
                        className="btn-crimson !px-3 !py-1.5 text-xs"
                        onClick={() => setApplicationStatus(app.id, "rejected")}
                      >
                        <X size={14} /> 驳回
                      </button>
                    </div>
                  ) : (
                    <div className="shrink-0 text-right text-xs text-ink-faint">
                      已{app.status === "approved" ? "通过" : "驳回"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      <ApplyModal
        open={openApply}
        onClose={() => setOpenApply(false)}
        onSubmit={(data) => {
          addApplication(data);
          setOpenApply(false);
        }}
      />
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition",
        active ? "bg-terracotta-400 text-cream-50 shadow-stamp" : "text-ink-muted hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function AppStamp({ status }: { status: AppStatus }) {
  if (status === "approved") return <Stamp variant="olive">已通过</Stamp>;
  if (status === "rejected") return <Stamp variant="crimson">已驳回</Stamp>;
  return <Stamp variant="amber">待审核</Stamp>;
}

interface ApplyData {
  stallId: string;
  locationId: string;
  date: string;
  timeSlot: string;
  reason: string;
}

function ApplyModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ApplyData) => void;
}) {
  const { stalls, locations } = useStore();
  const [form, setForm] = useState<ApplyData>({
    stallId: stalls[0]?.id ?? "",
    locationId: locations.find((l) => l.type === "temporary")?.id ?? locations[0]?.id ?? "",
    date: todayISO(),
    timeSlot: TIME_SLOTS[0],
    reason: "",
  });
  const valid = form.stallId && form.locationId && form.reason.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="临时点位申请"
      subtitle="申请在非固定点位出摊，待管理员审核"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            取消
          </button>
          <button
            className="btn-primary"
            disabled={!valid}
            onClick={() => onSubmit(form)}
          >
            提交申请
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="申请摊位">
          <Select value={form.stallId} onChange={(e) => setForm({ ...form, stallId: e.target.value })}>
            {stalls.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.stallNo}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="申请点位">
          <Select value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })}>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.code} · {l.address}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="出摊日期">
            <TextInput type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="出摊时段">
            <Select value={form.timeSlot} onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}>
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="申请理由" hint="说明迁出原因，便于审核">
          <TextInput
            placeholder="如：周末赛事人流大，临时增设点位"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
        </Field>
      </div>
    </Modal>
  );
}
