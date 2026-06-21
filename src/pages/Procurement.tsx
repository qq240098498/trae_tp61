import { useMemo, useState } from "react";
import { Package, Plus, Store, Calendar } from "lucide-react";
import { useStore } from "@/store/useStore";
import { formatMoney, formatDate, todayISO } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import StatCard from "@/components/StatCard";
import Table, { type Column } from "@/components/Table";
import Modal from "@/components/Modal";
import { Field, TextInput, Select } from "@/components/Form";
import type { Procurement } from "@/types";

export default function ProcurementPage() {
  const { procurements, stalls, addProcurement } = useStore();
  const [open, setOpen] = useState(false);
  const [filterStall, setFilterStall] = useState("all");

  const stallMap = new Map(stalls.map((s) => [s.id, s]));

  const rows = useMemo(
    () => procurements.filter((p) => filterStall === "all" || p.stallId === filterStall),
    [procurements, filterStall],
  );

  const totalAmount = rows.reduce((s, p) => s + p.amount, 0);
  const monthAmount = procurements
    .filter((p) => p.date.startsWith(todayISO().slice(0, 7)))
    .reduce((s, p) => s + p.amount, 0);

  const columns: Column<Procurement>[] = [
    {
      key: "date",
      header: "进货日期",
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
      key: "supplier",
      header: "供应商",
      render: (r) => (
        <span className="flex items-center gap-1 text-ink-soft">
          <Store size={12} className="text-terracotta-300" /> {r.supplier}
        </span>
      ),
    },
    { key: "item", header: "品名", render: (r) => <span className="text-ink">{r.item}</span> },
    {
      key: "qty",
      header: "数量",
      align: "right",
      render: (r) => (
        <span className="tnum text-ink-muted">
          {r.quantity} {r.unit}
        </span>
      ),
    },
    {
      key: "amount",
      header: "金额",
      align: "right",
      render: (r) => <span className="tnum font-medium text-terracotta-500">{formatMoney(r.amount)}</span>,
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="食材进货"
        title="进货记录"
        subtitle="登记供应商、品名、数量与金额"
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> 新增进货
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="进货记录" value={procurements.length} unit="笔" icon={<Package size={16} />} tone="terracotta" />
        <StatCard label="本月进货额" value={formatMoney(monthAmount)} icon={<Calendar size={16} />} tone="olive" />
        <StatCard
          label="当前筛选合计"
          value={formatMoney(totalAmount)}
          icon={<Store size={16} />}
          tone="ink"
          hint={`${rows.length} 笔记录`}
        />
      </div>

      <SectionCard
        title="进货台账"
        icon={<Package size={18} />}
        action={
          <Select value={filterStall} onChange={(e) => setFilterStall(e.target.value)} className="!w-auto !py-1.5 text-xs">
            <option value="all">全部摊位</option>
            {stalls.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        }
      >
        <Table columns={columns} data={rows} rowKey={(r) => r.id} />
      </SectionCard>

      <ProcurementModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={(data) => {
          addProcurement(data);
          setOpen(false);
        }}
      />
    </div>
  );
}

interface PData {
  stallId: string;
  supplier: string;
  item: string;
  quantity: number;
  unit: string;
  amount: number;
  date: string;
}

function ProcurementModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (d: PData) => void;
}) {
  const { stalls } = useStore();
  const [form, setForm] = useState<PData>({
    stallId: stalls[0]?.id ?? "",
    supplier: "",
    item: "",
    quantity: 0,
    unit: "kg",
    amount: 0,
    date: todayISO(),
  });
  const valid = form.stallId && form.supplier.trim() && form.item.trim() && form.amount > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="新增进货记录"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            取消
          </button>
          <button className="btn-primary" disabled={!valid} onClick={() => onSubmit(form)}>
            保存
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="进货摊位">
            <Select value={form.stallId} onChange={(e) => setForm({ ...form, stallId: e.target.value })}>
              {stalls.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="进货日期">
            <TextInput type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
        </div>
        <Field label="供应商">
          <TextInput placeholder="如：兴粮粮油批发" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
        </Field>
        <Field label="品名">
          <TextInput placeholder="如：面粉（高筋）" value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="数量">
            <TextInput
              type="number"
              min={0}
              value={form.quantity || ""}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
            />
          </Field>
          <Field label="单位">
            <Select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              <option value="kg">kg</option>
              <option value="L">L</option>
              <option value="包">包</option>
              <option value="箱">箱</option>
              <option value="份">份</option>
            </Select>
          </Field>
          <Field label="金额(元)">
            <TextInput
              type="number"
              min={0}
              step="0.01"
              value={form.amount || ""}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
