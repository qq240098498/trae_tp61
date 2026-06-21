import { useState } from "react";
import { Receipt, Wallet, AlertTriangle, CheckCircle2, Banknote } from "lucide-react";
import { useStore } from "@/store/useStore";
import { isOverdueFee, feeStatusOf } from "@/lib/business";
import { formatMoney, formatDate, todayISO, cn } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import StatCard from "@/components/StatCard";
import Stamp from "@/components/Stamp";
import Table, { type Column } from "@/components/Table";
import Modal from "@/components/Modal";
import { Field, TextInput } from "@/components/Form";
import type { FeeRecord } from "@/types";

const STATUS_META = {
  paid: { variant: "olive" as const, label: "已缴清" },
  partial: { variant: "amber" as const, label: "部分缴纳" },
  unpaid: { variant: "amber" as const, label: "待缴纳" },
  overdue: { variant: "crimson" as const, label: "欠费逾期" },
};

export default function Fees() {
  const { fees, stalls, payFee } = useStore();
  const [payId, setPayId] = useState<string | null>(null);
  const today = todayISO();

  const stallMap = new Map(stalls.map((s) => [s.id, s]));

  const totalDue = fees.reduce((s, f) => s + f.dueAmount, 0);
  const totalPaid = fees.reduce((s, f) => s + f.paidAmount, 0);
  const overdueCount = fees.filter((f) => isOverdueFee(f, today)).length;
  const rate = totalDue ? Math.round((totalPaid / totalDue) * 100) : 0;

  const columns: Column<FeeRecord>[] = [
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
      key: "period",
      header: "账期",
      render: (r) => <span className="tnum text-ink-soft">{r.period}</span>,
    },
    {
      key: "due",
      header: "应缴",
      align: "right",
      render: (r) => <span className="tnum text-ink-soft">{formatMoney(r.dueAmount)}</span>,
    },
    {
      key: "paid",
      header: "实缴",
      align: "right",
      render: (r) => (
        <span className={cn("tnum font-medium", r.paidAmount >= r.dueAmount ? "text-olive-500" : "text-ink")}>
          {formatMoney(r.paidAmount)}
        </span>
      ),
    },
    {
      key: "dueDate",
      header: "到期日",
      render: (r) => (
        <span className={cn("tnum", isOverdueFee(r, today) ? "font-medium text-crimson-500" : "text-ink-muted")}>
          {formatDate(r.dueDate)}
        </span>
      ),
    },
    {
      key: "status",
      header: "状态",
      align: "center",
      render: (r) => {
        const st = feeStatusOf(r, today);
        const meta = STATUS_META[st.kind];
        return (
          <Stamp variant={meta.variant} rotate={-3}>
            {meta.label}
          </Stamp>
        );
      },
    },
    {
      key: "op",
      header: "操作",
      align: "right",
      render: (r) =>
        r.paidAmount >= r.dueAmount ? (
          <span className="text-[11px] text-ink-faint">已结清</span>
        ) : (
          <button onClick={() => setPayId(r.id)} className="btn-ghost !px-3 !py-1.5 text-xs">
            <Banknote size={13} /> 缴费
          </button>
        ),
    },
  ];

  const payRecord = fees.find((f) => f.id === payId);
  const remaining = payRecord ? payRecord.dueAmount - payRecord.paidAmount : 0;

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="摊位费"
        title="缴纳状态"
        subtitle="按账期管理应缴/实缴，欠费逾期自动标记"
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="本期应缴" value={formatMoney(totalDue)} icon={<Receipt size={16} />} tone="terracotta" />
        <StatCard label="本期实缴" value={formatMoney(totalPaid)} icon={<CheckCircle2 size={16} />} tone="olive" hint={`收缴率 ${rate}%`} />
        <StatCard
          label="欠费逾期"
          value={overdueCount}
          unit="户"
          icon={<AlertTriangle size={16} />}
          tone={overdueCount > 0 ? "crimson" : "olive"}
          hint={overdueCount > 0 ? "已过到期日未缴清" : "无逾期"}
        />
        <StatCard label="收缴率" value={rate} unit="%" icon={<Wallet size={16} />} tone="ink" />
      </div>

      <SectionCard title="缴费台账" subtitle="欠费逾期行整行高亮，并显示在概览告警" icon={<Receipt size={18} />}>
        <Table
          columns={columns}
          data={fees}
          rowKey={(r) => r.id}
          rowClassName={(r) => (isOverdueFee(r, today) ? "bg-crimson-50/40" : "")}
        />
      </SectionCard>

      <PayModal
        open={payId !== null}
        remaining={remaining}
        stallName={payRecord ? stallMap.get(payRecord.stallId)?.name : ""}
        onClose={() => setPayId(null)}
        onPay={(amount) => {
          if (payId) payFee(payId, amount);
          setPayId(null);
        }}
      />
    </div>
  );
}

function PayModal({
  open,
  remaining,
  stallName,
  onClose,
  onPay,
}: {
  open: boolean;
  remaining: number;
  stallName?: string;
  onClose: () => void;
  onPay: (amount: number) => void;
}) {
  const [amount, setAmount] = useState(0);
  const handleOpen = open;
  if (!handleOpen) return null;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="记录缴费"
      subtitle={`${stallName ?? ""} · 剩余应缴 ${formatMoney(remaining)}`}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            取消
          </button>
          <button
            className="btn-primary"
            disabled={amount <= 0}
            onClick={() => {
              onPay(amount);
              setAmount(0);
            }}
          >
            确认缴费
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-cream-100/60 p-3 text-sm text-ink-soft">
          剩余应缴：<span className="font-serif text-lg font-semibold text-terracotta-500 tnum">{formatMoney(remaining)}</span>
        </div>
        <Field label="本次缴纳金额(元)">
          <TextInput
            type="number"
            min={0}
            step="0.01"
            placeholder="0.00"
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </Field>
        <div className="flex gap-2">
          <button className="chip" onClick={() => setAmount(remaining)}>
            全额缴纳
          </button>
          <button className="chip" onClick={() => setAmount(Math.round(remaining / 2))}>
            缴一半
          </button>
        </div>
      </div>
    </Modal>
  );
}
