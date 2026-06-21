import { useMemo, useState } from "react";
import { ShieldCheck, Plus, ShieldAlert, CheckCircle2, AlertTriangle, ClipboardCheck } from "lucide-react";
import { useStore } from "@/store/useStore";
import { hasOpenInspection } from "@/lib/business";
import { formatDate, todayISO, cn } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import StatCard from "@/components/StatCard";
import Stamp from "@/components/Stamp";
import Table, { type Column } from "@/components/Table";
import Modal from "@/components/Modal";
import { Field, TextInput, Select } from "@/components/Form";
import type { Inspection } from "@/types";

const INSPECTION_ITEMS = ["从业人员健康证", "食材采购溯源", "操作台卫生", "餐具消毒"];

const RESULT_META = {
  pass: { variant: "olive" as const, label: "合格" },
  warning: { variant: "amber" as const, label: "警告" },
  fail: { variant: "crimson" as const, label: "不合格" },
};

export default function Inspections() {
  const { inspections, stalls, addInspection, toggleRectified } = useStore();
  const [open, setOpen] = useState(false);

  const stallMap = new Map(stalls.map((s) => [s.id, s]));
  const sorted = useMemo(
    () => [...inspections].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [inspections],
  );

  const passCount = inspections.filter((i) => i.result === "pass").length;
  const warnCount = inspections.filter((i) => i.result === "warning").length;
  const openFails = stalls.filter((s) => hasOpenInspection(inspections, s.id)).length;

  const columns: Column<Inspection>[] = [
    {
      key: "date",
      header: "检查日期",
      render: (r) => <span className="tnum text-ink-soft">{formatDate(r.date)}</span>,
    },
    {
      key: "stall",
      header: "摊位",
      render: (r) => (
        <div className="leading-tight">
          <div className="text-ink-soft">{stallMap.get(r.stallId)?.name}</div>
          <div className="text-[11px] text-ink-faint">{stallMap.get(r.stallId)?.stallNo}</div>
        </div>
      ),
    },
    {
      key: "items",
      header: "检查项",
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.items.map((it) => (
            <span
              key={it.name}
              className={cn(
                "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px]",
                it.pass ? "bg-olive-50 text-olive-500" : "bg-crimson-50 text-crimson-500",
              )}
            >
              {it.pass ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
              {it.name}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "result",
      header: "结果",
      align: "center",
      render: (r) => {
        const meta = RESULT_META[r.result];
        return (
          <Stamp variant={meta.variant} rotate={-3}>
            {meta.label}
          </Stamp>
        );
      },
    },
    {
      key: "deduction",
      header: "扣分",
      align: "right",
      render: (r) => (
        <span className={cn("tnum", r.deduction > 0 ? "font-medium text-crimson-500" : "text-ink-faint")}>
          {r.deduction ? `-${r.deduction}` : 0}
        </span>
      ),
    },
    {
      key: "rectified",
      header: "整改",
      align: "center",
      render: (r) =>
        r.result === "pass" ? (
          <span className="text-[11px] text-ink-faint">—</span>
        ) : (
          <button
            onClick={() => toggleRectified(r.id)}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition",
              r.rectified
                ? "bg-olive-100 text-olive-500 hover:bg-olive-200"
                : "bg-crimson-100 text-crimson-500 hover:bg-crimson-200",
            )}
          >
            {r.rectified ? "已整改" : "待整改"}
          </button>
        ),
    },
    { key: "inspector", header: "检查员", render: (r) => <span className="text-ink-muted">{r.inspector}</span> },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="卫生检查"
        title="卫生检查记录"
        subtitle="检查项、结果、扣分与整改状态"
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> 录入检查
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="检查记录" value={inspections.length} unit="次" icon={<ClipboardCheck size={16} />} tone="terracotta" />
        <StatCard label="合格" value={passCount} unit="次" icon={<CheckCircle2 size={16} />} tone="olive" />
        <StatCard label="警告" value={warnCount} unit="次" icon={<AlertTriangle size={16} />} tone="amber" />
        <StatCard
          label="未整改不合格"
          value={openFails}
          unit="项"
          icon={<ShieldAlert size={16} />}
          tone={openFails > 0 ? "crimson" : "olive"}
          hint={openFails > 0 ? "需督促整改" : "全部已整改"}
        />
      </div>

      <SectionCard title="检查台账" subtitle="不合格且未整改项将在概览告警" icon={<ShieldCheck size={18} />}>
        <Table columns={columns} data={sorted} rowKey={(r) => r.id} />
      </SectionCard>

      <InspectionModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={(d) => {
          addInspection(d);
          setOpen(false);
        }}
      />
    </div>
  );
}

interface IData {
  stallId: string;
  date: string;
  items: { name: string; pass: boolean }[];
  deduction: number;
  inspector: string;
}

function InspectionModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (d: IData) => void }) {
  const { stalls } = useStore();
  const [form, setForm] = useState<IData>({
    stallId: stalls[0]?.id ?? "",
    date: todayISO(),
    items: INSPECTION_ITEMS.map((name) => ({ name, pass: true })),
    deduction: 0,
    inspector: "周洁",
  });
  const valid = form.stallId && form.inspector.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="录入卫生检查"
      subtitle="勾选检查项，系统自动判定结果"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            取消
          </button>
          <button className="btn-primary" disabled={!valid} onClick={() => onSubmit(form)}>
            提交
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="受检摊位">
            <Select value={form.stallId} onChange={(e) => setForm({ ...form, stallId: e.target.value })}>
              {stalls.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="检查日期">
            <TextInput type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
        </div>

        <Field label="检查项（合格 / 不合格）">
          <div className="space-y-2">
            {form.items.map((it, idx) => (
              <div
                key={it.name}
                className="flex items-center justify-between rounded-lg border border-cream-200 bg-white/50 px-3 py-2"
              >
                <span className="text-sm text-ink-soft">{it.name}</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, items: form.items.map((x, i) => (i === idx ? { ...x, pass: true } : x)) })}
                    className={cn(
                      "rounded px-2 py-0.5 text-xs font-medium transition",
                      it.pass ? "bg-olive-100 text-olive-500" : "text-ink-faint hover:bg-cream-100",
                    )}
                  >
                    合格
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, items: form.items.map((x, i) => (i === idx ? { ...x, pass: false } : x)) })}
                    className={cn(
                      "rounded px-2 py-0.5 text-xs font-medium transition",
                      !it.pass ? "bg-crimson-100 text-crimson-500" : "text-ink-faint hover:bg-cream-100",
                    )}
                  >
                    不合格
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="扣分">
            <TextInput
              type="number"
              min={0}
              value={form.deduction || ""}
              onChange={(e) => setForm({ ...form, deduction: Number(e.target.value) })}
            />
          </Field>
          <Field label="检查员">
            <TextInput value={form.inspector} onChange={(e) => setForm({ ...form, inspector: e.target.value })} />
          </Field>
        </div>
        <ResultPreview items={form.items} />
      </div>
    </Modal>
  );
}

function ResultPreview({ items }: { items: { name: string; pass: boolean }[] }) {
  const failed = items.filter((i) => !i.pass).length;
  const result = failed >= 2 ? "fail" : failed === 1 ? "warning" : "pass";
  const meta = RESULT_META[result];
  return (
    <div className="flex items-center justify-between rounded-lg bg-cream-100/60 px-3 py-2.5">
      <span className="text-xs text-ink-muted">系统判定结果</span>
      <Stamp variant={meta.variant} rotate={-3}>
        {meta.label}
      </Stamp>
    </div>
  );
}
