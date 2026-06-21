import { useMemo, useState } from "react";
import { Wallet, Plus, Banknote, QrCode, Trash2, Receipt } from "lucide-react";
import { useStore } from "@/store/useStore";
import { dayTxSummary } from "@/lib/business";
import { formatMoney, formatDateTime, todayISO, cn } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import StatCard from "@/components/StatCard";
import Table, { type Column } from "@/components/Table";
import Modal from "@/components/Modal";
import { Field, TextInput, Select } from "@/components/Form";
import { CATEGORIES } from "@/data/seed";
import type { Transaction, PayMethod } from "@/types";

export default function Transactions() {
  const { transactions, stalls, addTransaction, removeTransaction } = useStore();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [method, setMethod] = useState<"all" | PayMethod>("all");

  const stallMap = new Map(stalls.map((s) => [s.id, s]));
  const summary = dayTxSummary(transactions, date);

  const rows = useMemo(() => {
    return transactions
      .filter((t) => t.time.startsWith(date))
      .filter((t) => method === "all" || t.method === method)
      .sort((a, b) => (a.time < b.time ? 1 : -1));
  }, [transactions, date, method]);

  const columns: Column<Transaction>[] = [
    {
      key: "time",
      header: "时间",
      render: (r) => <span className="tnum text-ink-soft">{formatDateTime(r.time).split(" ")[1]}</span>,
    },
    {
      key: "stall",
      header: "摊位",
      render: (r) => (
        <span className="text-ink-soft">{stallMap.get(r.stallId)?.name}</span>
      ),
    },
    { key: "category", header: "品类", render: (r) => <span className="text-ink">{r.category}</span> },
    {
      key: "method",
      header: "支付",
      render: (r) =>
        r.method === "cash" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-terracotta-50 px-2 py-0.5 text-[11px] text-terracotta-500">
            <Banknote size={11} /> 现金
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-olive-50 px-2 py-0.5 text-[11px] text-olive-500">
            <QrCode size={11} /> 扫码
          </span>
        ),
    },
    {
      key: "note",
      header: "备注",
      render: (r) => <span className="text-xs text-ink-faint">{r.note || "—"}</span>,
    },
    {
      key: "amount",
      header: "金额",
      align: "right",
      render: (r) => (
        <span className={cn("tnum font-medium", r.method === "cash" ? "text-terracotta-500" : "text-olive-500")}>
          {formatMoney(r.amount)}
        </span>
      ),
    },
    {
      key: "op",
      header: "",
      align: "right",
      render: (r) => (
        <button
          onClick={() => removeTransaction(r.id)}
          className="rounded-md p-1.5 text-ink-faint transition hover:bg-crimson-50 hover:text-crimson-500"
          aria-label="删除"
        >
          <Trash2 size={15} />
        </button>
      ),
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="流水记账"
        title="收支流水"
        subtitle="现金与扫码逐笔记录，支持日汇总"
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> 记一笔
          </button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-ink-muted">日期</label>
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} className="!w-auto" />
        </div>
        <div className="inline-flex rounded-lg border border-cream-300 bg-cream-50/70 p-1">
          {(["all", "cash", "scan"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition",
                method === m ? "bg-terracotta-400 text-cream-50 shadow-stamp" : "text-ink-muted hover:text-ink",
              )}
            >
              {m === "all" ? "全部" : m === "cash" ? "现金" : "扫码"}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="现金收入"
          value={formatMoney(summary.cash)}
          icon={<Banknote size={16} />}
          tone="terracotta"
          hint={`${transactions.filter((t) => t.time.startsWith(date) && t.method === "cash").length} 笔`}
        />
        <StatCard
          label="扫码收入"
          value={formatMoney(summary.scan)}
          icon={<QrCode size={16} />}
          tone="olive"
          hint={`${transactions.filter((t) => t.time.startsWith(date) && t.method === "scan").length} 笔`}
        />
        <StatCard
          label="当日合计"
          value={formatMoney(summary.total)}
          icon={<Wallet size={16} />}
          tone="ink"
          hint={`共 ${summary.count} 笔`}
        />
      </div>

      <SectionCard
        title="流水明细"
        subtitle={`${date} 共 ${rows.length} 笔`}
        icon={<Receipt size={18} />}
      >
        <Table columns={columns} data={rows} rowKey={(r) => r.id} empty="当日暂无流水" />
      </SectionCard>

      <TxModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={(d) => {
          addTransaction(d);
          setDate(todayISO());
          setOpen(false);
        }}
      />
    </div>
  );
}

interface TxData {
  stallId: string;
  amount: number;
  method: PayMethod;
  category: string;
  note: string;
}

function TxModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (d: TxData) => void }) {
  const { stalls } = useStore();
  const [form, setForm] = useState<TxData>({
    stallId: stalls[0]?.id ?? "",
    amount: 0,
    method: "scan",
    category: CATEGORIES[0],
    note: "",
  });
  const valid = form.stallId && form.amount > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="记一笔流水"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            取消
          </button>
          <button className="btn-primary" disabled={!valid} onClick={() => onSubmit(form)}>
            确认记账
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="摊位">
            <Select value={form.stallId} onChange={(e) => setForm({ ...form, stallId: e.target.value })}>
              {stalls.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="经营品类">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="支付方式">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, method: "cash" })}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition",
                form.method === "cash"
                  ? "border-terracotta-400 bg-terracotta-50 text-terracotta-500"
                  : "border-cream-300 bg-white/60 text-ink-muted hover:border-terracotta-200",
              )}
            >
              <Banknote size={16} /> 现金
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, method: "scan" })}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition",
                form.method === "scan"
                  ? "border-olive-400 bg-olive-50 text-olive-500"
                  : "border-cream-300 bg-white/60 text-ink-muted hover:border-olive-200",
              )}
            >
              <QrCode size={16} /> 扫码
            </button>
          </div>
        </Field>

        <Field label="金额(元)">
          <TextInput
            type="number"
            min={0}
            step="0.01"
            placeholder="0.00"
            value={form.amount || ""}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
          />
        </Field>

        <Field label="备注（选填）">
          <TextInput
            placeholder="如：早餐套餐 / 找零"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </Field>
      </div>
    </Modal>
  );
}
