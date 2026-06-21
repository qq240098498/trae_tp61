import { useState, useMemo } from "react";
import {
  Receipt,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Banknote,
  Printer,
  Megaphone,
  History,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import {
  isOverdueFee,
  feeStatusOf,
  getAvailablePeriods,
  computeMonthlyFeeSummary,
  computeFeeStats,
  getPaymentsByStallAndPeriod,
  shouldSendDunning,
} from "@/lib/business";
import {
  formatMoney,
  formatDate,
  formatDateTime,
  todayISO,
  daysBetween,
  cn,
} from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import StatCard from "@/components/StatCard";
import Stamp from "@/components/Stamp";
import Table, { type Column } from "@/components/Table";
import Modal from "@/components/Modal";
import { Field, TextInput, Select } from "@/components/Form";
import type { FeeRecord, MonthlyFeeSummary, PaymentHistory, PayMethod } from "@/types";

const STATUS_META = {
  paid: { variant: "olive" as const, label: "已缴清" },
  partial: { variant: "amber" as const, label: "部分缴纳" },
  unpaid: { variant: "amber" as const, label: "待缴纳" },
  overdue: { variant: "crimson" as const, label: "欠费逾期" },
};

const DUNNING_STATUS_META = {
  pending: { variant: "amber" as const, label: "待发送" },
  sent: { variant: "terracotta" as const, label: "已发送" },
  acknowledged: { variant: "olive" as const, label: "已确认" },
};

const METHOD_LABEL: Record<PayMethod, string> = {
  cash: "现金",
  scan: "扫码",
};

export default function Fees() {
  const {
    fees,
    stalls,
    paymentHistories,
    dunningNotices,
    payFee,
    sendDunningNotice,
    acknowledgeDunning,
  } = useStore();
  const today = todayISO();

  const periods = useMemo(() => getAvailablePeriods(fees), [fees]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(periods[0] ?? today.slice(0, 7));
  const [viewMode, setViewMode] = useState<"summary" | "detail">("summary");
  const [payFeeId, setPayFeeId] = useState<string | null>(null);
  const [historyStallId, setHistoryStallId] = useState<string | null>(null);
  const [historyPeriod, setHistoryPeriod] = useState<string | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<PaymentHistory | null>(null);
  const [dunningFeeId, setDunningFeeId] = useState<string | null>(null);

  const stallMap = useMemo(() => new Map(stalls.map((s) => [s.id, s])), [stalls]);

  const summary = useMemo(
    () => computeMonthlyFeeSummary(stalls, fees, paymentHistories, selectedPeriod),
    [stalls, fees, paymentHistories, selectedPeriod]
  );

  const stats = useMemo(() => computeFeeStats(summary), [summary]);

  const periodFees = useMemo(
    () => fees.filter((f) => f.period === selectedPeriod),
    [fees, selectedPeriod]
  );

  const periodIndex = periods.indexOf(selectedPeriod);

  function goPrevPeriod() {
    if (periodIndex < periods.length - 1) setSelectedPeriod(periods[periodIndex + 1]);
  }
  function goNextPeriod() {
    if (periodIndex > 0) setSelectedPeriod(periods[periodIndex - 1]);
  }

  function handleBatchDunning() {
    periodFees.forEach((fee) => {
      if (shouldSendDunning(fee, dunningNotices, today)) {
        const overdueDays = daysBetween(fee.dueDate, today);
        sendDunningNotice({
          feeId: fee.id,
          stallId: fee.stallId,
          period: fee.period,
          dueAmount: fee.dueAmount - fee.paidAmount,
          overdueDays: Math.max(1, overdueDays),
        });
      }
    });
  }

  const summaryColumns: Column<MonthlyFeeSummary>[] = [
    {
      key: "stall",
      header: "摊主",
      render: (r) => (
        <div className="leading-tight">
          <div className="font-medium text-ink">{r.stallName}</div>
          <div className="text-[11px] text-ink-faint">{r.stallNo}</div>
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
        <span
          className={cn(
            "tnum font-medium",
            r.paidAmount >= r.dueAmount ? "text-olive-500" : "text-ink"
          )}
        >
          {formatMoney(r.paidAmount)}
        </span>
      ),
    },
    {
      key: "overdue",
      header: "欠费",
      align: "right",
      render: (r) =>
        r.overdueAmount > 0 ? (
          <span className="tnum font-semibold text-crimson-500">
            {formatMoney(r.overdueAmount)}
          </span>
        ) : (
          <span className="tnum text-ink-faint">—</span>
        ),
    },
    {
      key: "status",
      header: "状态",
      align: "center",
      render: (r) => {
        const fee = periodFees.find((f) => f.stallId === r.stallId);
        if (!fee) return <span className="text-ink-faint">—</span>;
        const st = feeStatusOf(fee, today);
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
      render: (r) => {
        const fee = periodFees.find((f) => f.stallId === r.stallId);
        if (!fee) return null;
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => {
                setHistoryStallId(r.stallId);
                setHistoryPeriod(r.period);
              }}
              className="btn-ghost !px-2.5 !py-1.5 text-xs"
              title="缴费历史"
            >
              <History size={13} />
            </button>
            {r.paidAmount < r.dueAmount && (
              <button
                onClick={() => setPayFeeId(fee.id)}
                className="btn-ghost !px-2.5 !py-1.5 text-xs"
                title="缴费"
              >
                <Banknote size={13} />
              </button>
            )}
            {r.overdueAmount > 0 && shouldSendDunning(fee, dunningNotices, today) && (
              <button
                onClick={() => setDunningFeeId(fee.id)}
                className="btn-crimson !px-2.5 !py-1.5 text-xs"
                title="催缴"
              >
                <Megaphone size={13} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const detailColumns: Column<FeeRecord>[] = [
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
        <span
          className={cn(
            "tnum font-medium",
            r.paidAmount >= r.dueAmount ? "text-olive-500" : "text-ink"
          )}
        >
          {formatMoney(r.paidAmount)}
        </span>
      ),
    },
    {
      key: "dueDate",
      header: "到期日",
      render: (r) => {
        const overdue = isOverdueFee(r, today);
        return (
          <span
            className={cn(
              "tnum",
              overdue ? "font-medium text-crimson-500" : "text-ink-muted"
            )}
          >
            {formatDate(r.dueDate)}
          </span>
        );
      },
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
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => {
              setHistoryStallId(r.stallId);
              setHistoryPeriod(r.period);
            }}
            className="btn-ghost !px-2.5 !py-1.5 text-xs"
            title="缴费历史"
          >
            <History size={13} />
          </button>
          {r.paidAmount >= r.dueAmount ? (
            <span className="text-[11px] text-ink-faint">已结清</span>
          ) : (
            <button
              onClick={() => setPayFeeId(r.id)}
              className="btn-ghost !px-2.5 !py-1.5 text-xs"
            >
              <Banknote size={13} /> 缴费
            </button>
          )}
        </div>
      ),
    },
  ];

  const payRecord = fees.find((f) => f.id === payFeeId);
  const payRemaining = payRecord ? payRecord.dueAmount - payRecord.paidAmount : 0;

  const historyPayments =
    historyStallId && historyPeriod
      ? getPaymentsByStallAndPeriod(paymentHistories, historyStallId, historyPeriod)
      : [];
  const historyStall = historyStallId ? stallMap.get(historyStallId) : null;

  const dunningFee = dunningFeeId ? fees.find((f) => f.id === dunningFeeId) : null;
  const dunningStall = dunningFee ? stallMap.get(dunningFee.stallId) : null;

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="摊位费对账"
        title="摊位费管理"
        subtitle="按摊主逐月统计应收/实收，欠费自动催缴，缴费记录可打印收据"
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={goPrevPeriod}
            disabled={periodIndex >= periods.length - 1}
            className="btn-ghost !px-2 !py-1.5"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="rounded-lg border border-cream-300 bg-white/70 px-4 py-1.5">
            <span className="font-display text-lg text-ink">{selectedPeriod}</span>
          </div>
          <button
            onClick={goNextPeriod}
            disabled={periodIndex <= 0}
            className="btn-ghost !px-2 !py-1.5"
          >
            <ChevronRight size={16} />
          </button>
          <Select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-32"
          >
            {periods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-cream-300 bg-white/70 p-0.5">
            <button
              onClick={() => setViewMode("summary")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs transition",
                viewMode === "summary"
                  ? "bg-terracotta-400 text-cream-50"
                  : "text-ink-soft hover:bg-cream-100"
              )}
            >
              <FileText size={13} className="inline" /> 对账单
            </button>
            <button
              onClick={() => setViewMode("detail")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs transition",
                viewMode === "detail"
                  ? "bg-terracotta-400 text-cream-50"
                  : "text-ink-soft hover:bg-cream-100"
              )}
            >
              <Receipt size={13} className="inline" /> 明细台账
            </button>
          </div>
          <button onClick={handleBatchDunning} className="btn-crimson text-xs">
            <Megaphone size={14} /> 批量催缴
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={`${selectedPeriod}应缴`}
          value={formatMoney(stats.totalDue)}
          icon={<Receipt size={16} />}
          tone="terracotta"
        />
        <StatCard
          label={`${selectedPeriod}实缴`}
          value={formatMoney(stats.totalPaid)}
          icon={<CheckCircle2 size={16} />}
          tone="olive"
          hint={`收缴率 ${stats.collectionRate}%`}
        />
        <StatCard
          label="欠费金额"
          value={formatMoney(stats.totalOverdue)}
          icon={<AlertTriangle size={16} />}
          tone={stats.overdueCount > 0 ? "crimson" : "olive"}
          hint={stats.overdueCount > 0 ? `${stats.overdueCount} 户逾期` : "无欠费"}
        />
        <StatCard
          label="收缴完成"
          value={stats.paidCount}
          unit={`/ ${stalls.length} 户`}
          icon={<Wallet size={16} />}
          tone="ink"
          hint={`部分缴 ${stats.partialCount} · 未缴 ${stats.unpaidCount}`}
        />
      </div>

      <SectionCard
        title={viewMode === "summary" ? "月度对账单" : "缴费台账明细"}
        subtitle={
          viewMode === "summary"
            ? "按摊主统计摊位费应收/实收，欠费自动标记"
            : "欠费逾期行整行高亮，并显示在概览告警"
        }
        icon={<Receipt size={18} />}
      >
        {viewMode === "summary" ? (
          <Table
            columns={summaryColumns}
            data={summary}
            rowKey={(r) => `${r.stallId}-${r.period}`}
            rowClassName={(r) => (r.overdueAmount > 0 ? "bg-crimson-50/40" : "")}
          />
        ) : (
          <Table
            columns={detailColumns}
            data={periodFees}
            rowKey={(r) => r.id}
            rowClassName={(r) => (isOverdueFee(r, today) ? "bg-crimson-50/40" : "")}
          />
        )}
      </SectionCard>

      <PayModal
        open={payFeeId !== null}
        remaining={payRemaining}
        stallName={payRecord ? stallMap.get(payRecord.stallId)?.name : ""}
        period={payRecord?.period}
        onClose={() => setPayFeeId(null)}
        onPay={(amount, method, operator, remark) => {
          if (payRecord) {
            payFee({
              feeId: payRecord.id,
              stallId: payRecord.stallId,
              period: payRecord.period,
              amount,
              method,
              operator,
              remark,
            });
          }
          setPayFeeId(null);
        }}
      />

      <HistoryModal
        open={historyStallId !== null && historyPeriod !== null}
        stallName={historyStall?.name}
        stallNo={historyStall?.stallNo}
        period={historyPeriod ?? ""}
        payments={historyPayments}
        onClose={() => {
          setHistoryStallId(null);
          setHistoryPeriod(null);
        }}
        onPrintReceipt={(p) => setReceiptPayment(p)}
      />

      <ReceiptModal
        payment={receiptPayment}
        stallName={
          receiptPayment ? stallMap.get(receiptPayment.stallId)?.name : ""
        }
        stallNo={receiptPayment ? stallMap.get(receiptPayment.stallId)?.stallNo : ""}
        onClose={() => setReceiptPayment(null)}
      />

      <DunningModal
        open={dunningFeeId !== null}
        fee={dunningFee}
        stallName={dunningStall?.name}
        stallNo={dunningStall?.stallNo}
        dunnings={
          dunningFee ? dunningNotices.filter((d) => d.feeId === dunningFee.id) : []
        }
        onClose={() => setDunningFeeId(null)}
        onSend={() => {
          if (dunningFee) {
            const overdueDays = Math.max(1, daysBetween(dunningFee.dueDate, today));
            sendDunningNotice({
              feeId: dunningFee.id,
              stallId: dunningFee.stallId,
              period: dunningFee.period,
              dueAmount: dunningFee.dueAmount - dunningFee.paidAmount,
              overdueDays,
            });
          }
          setDunningFeeId(null);
        }}
        onAcknowledge={(id) => acknowledgeDunning(id)}
      />
    </div>
  );
}

function PayModal({
  open,
  remaining,
  stallName,
  period,
  onClose,
  onPay,
}: {
  open: boolean;
  remaining: number;
  stallName?: string;
  period?: string;
  onClose: () => void;
  onPay: (
    amount: number,
    method: PayMethod,
    operator: string,
    remark?: string
  ) => void;
}) {
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PayMethod>("scan");
  const [operator, setOperator] = useState("管理员");
  const [remark, setRemark] = useState("");

  if (!open) return null;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="记录缴费"
      subtitle={`${stallName ?? ""} · ${period ?? ""} · 剩余应缴 ${formatMoney(
        remaining
      )}`}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            取消
          </button>
          <button
            className="btn-primary"
            disabled={amount <= 0 || amount > remaining}
            onClick={() => {
              onPay(amount, method, operator, remark || undefined);
              setAmount(0);
              setRemark("");
            }}
          >
            确认缴费
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-cream-100/60 p-3 text-sm text-ink-soft">
          剩余应缴：
          <span className="font-serif text-lg font-semibold text-terracotta-500 tnum">
            {formatMoney(remaining)}
          </span>
        </div>
        <Field label="本次缴纳金额(元)">
          <TextInput
            type="number"
            min={0}
            max={remaining}
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
        <Field label="支付方式">
          <Select
            value={method}
            onChange={(e) => setMethod(e.target.value as PayMethod)}
          >
            <option value="scan">扫码支付</option>
            <option value="cash">现金</option>
          </Select>
        </Field>
        <Field label="经办人">
          <TextInput
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
          />
        </Field>
        <Field label="备注">
          <TextInput
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="选填"
          />
        </Field>
      </div>
    </Modal>
  );
}

function HistoryModal({
  open,
  stallName,
  stallNo,
  period,
  payments,
  onClose,
  onPrintReceipt,
}: {
  open: boolean;
  stallName?: string;
  stallNo?: string;
  period: string;
  payments: PaymentHistory[];
  onClose: () => void;
  onPrintReceipt: (p: PaymentHistory) => void;
}) {
  if (!open) return null;
  const total = payments.reduce((s, p) => s + p.amount, 0);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="缴费历史"
      subtitle={`${stallName ?? ""} · ${stallNo ?? ""} · ${period}`}
      className="max-w-xl"
    >
      <div className="space-y-3">
        {payments.length === 0 ? (
          <div className="py-8 text-center text-sm text-ink-faint">暂无缴费记录</div>
        ) : (
          <>
            <div className="rounded-lg bg-olive-50 p-3 text-sm text-olive-600">
              累计已缴：
              <span className="font-serif text-lg font-semibold tnum">
                {formatMoney(total)}
              </span>
              <span className="ml-2 text-xs text-olive-500">共 {payments.length} 笔</span>
            </div>
            <div className="space-y-2">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-cream-200 bg-white/60 p-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-base font-semibold text-ink tnum">
                        {formatMoney(p.amount)}
                      </span>
                      <Stamp variant="terracotta" rotate={0}>
                        {METHOD_LABEL[p.method]}
                      </Stamp>
                    </div>
                    <div className="mt-1 text-[11px] text-ink-faint">
                      单号 {p.receiptNo} · 经办人 {p.operator} ·{" "}
                      {formatDateTime(p.paidAt)}
                    </div>
                    {p.remark && (
                      <div className="mt-0.5 text-[11px] text-ink-muted">
                        备注：{p.remark}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onPrintReceipt(p)}
                    className="btn-ghost !px-2.5 !py-1.5 text-xs"
                    title="打印收据"
                  >
                    <Printer size={13} /> 收据
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

function ReceiptModal({
  payment,
  stallName,
  stallNo,
  onClose,
}: {
  payment: PaymentHistory | null;
  stallName?: string;
  stallNo?: string;
  onClose: () => void;
}) {
  if (!payment) return null;
  const open = payment !== null;

  function handlePrint() {
    window.print();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="摊位费收据"
      subtitle="预览 · 可直接打印"
      className="max-w-md print:shadow-none print:border-none"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            关闭
          </button>
          <button className="btn-primary" onClick={handlePrint}>
            <Printer size={14} /> 打印收据
          </button>
        </>
      }
    >
      <div
        id="receipt-print-area"
        className="space-y-4 rounded-lg border-2 border-dashed border-cream-300 bg-white p-5"
      >
        <div className="text-center">
          <div className="font-display text-xl text-ink">晨光摊位</div>
          <div className="text-[10px] tracking-[0.2em] text-ink-faint">
            MORNING MARKET
          </div>
          <div className="mt-2 font-display text-lg font-bold text-terracotta-500">
            摊位费收据
          </div>
        </div>
        <div className="flex justify-between border-b border-dashed border-cream-200 pb-2 text-xs text-ink-muted">
          <span>收据编号：{payment.receiptNo}</span>
          <span>开具日期：{formatDate(payment.paidAt)}</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-muted">摊主姓名：</span>
            <span className="font-medium text-ink">{stallName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">摊位编号：</span>
            <span className="font-medium text-ink">{stallNo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">缴费账期：</span>
            <span className="font-medium text-ink tnum">{payment.period}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">支付方式：</span>
            <span className="font-medium text-ink">{METHOD_LABEL[payment.method]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">缴费时间：</span>
            <span className="font-medium text-ink tnum">
              {formatDateTime(payment.paidAt)}
            </span>
          </div>
          {payment.remark && (
            <div className="flex justify-between">
              <span className="text-ink-muted">备注：</span>
              <span className="font-medium text-ink">{payment.remark}</span>
            </div>
          )}
        </div>
        <div className="rounded-lg bg-cream-100 p-4 text-center">
          <div className="text-xs text-ink-muted">实收金额</div>
          <div className="font-serif text-3xl font-bold text-terracotta-500 tnum">
            {formatMoney(payment.amount)}
          </div>
          <div className="mt-1 text-[11px] text-ink-faint">
            人民币 {numberToChinese(payment.amount)} 元整
          </div>
        </div>
        <div className="flex justify-between pt-2 text-xs text-ink-muted">
          <div>
            <div>经办人：{payment.operator}</div>
            <div className="mt-3">签字：______________</div>
          </div>
          <div className="text-right">
            <div>摊主确认：</div>
            <div className="mt-3">签字：______________</div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function DunningModal({
  open,
  fee,
  stallName,
  stallNo,
  dunnings,
  onClose,
  onSend,
  onAcknowledge,
}: {
  open: boolean;
  fee?: FeeRecord;
  stallName?: string;
  stallNo?: string;
  dunnings: ReturnType<typeof useStore.getState>["dunningNotices"];
  onClose: () => void;
  onSend: () => void;
  onAcknowledge: (id: string) => void;
}) {
  if (!open || !fee) return null;
  const overdueAmount = fee.dueAmount - fee.paidAmount;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="欠费催缴"
      subtitle={`${stallName ?? ""} · ${stallNo ?? ""} · ${fee.period}`}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            关闭
          </button>
          <button className="btn-crimson" onClick={onSend}>
            <Megaphone size={14} /> 发送催缴通知
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-crimson-200 bg-crimson-50 p-4">
          <div className="flex items-center gap-2 text-crimson-500">
            <AlertTriangle size={18} />
            <span className="font-medium">欠费提醒</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[11px] text-ink-faint">应缴金额</div>
              <div className="tnum font-medium text-ink">{formatMoney(fee.dueAmount)}</div>
            </div>
            <div>
              <div className="text-[11px] text-ink-faint">已缴金额</div>
              <div className="tnum font-medium text-ink">{formatMoney(fee.paidAmount)}</div>
            </div>
            <div>
              <div className="text-[11px] text-ink-faint">欠费金额</div>
              <div className="tnum font-semibold text-crimson-500">
                {formatMoney(overdueAmount)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-ink-faint">到期日期</div>
              <div className="tnum font-medium text-ink">{formatDate(fee.dueDate)}</div>
            </div>
          </div>
        </div>

        {dunnings.length > 0 && (
          <div>
            <div className="mb-2 text-xs font-medium text-ink-muted">催缴记录</div>
            <div className="space-y-2">
              {dunnings.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-lg border border-cream-200 bg-white/60 p-2.5 text-xs"
                >
                  <div>
                    <div className="text-ink">
                      欠费 {formatMoney(d.dueAmount)} · 逾期 {d.overdueDays} 天
                    </div>
                    <div className="text-[11px] text-ink-faint">
                      发送时间：{formatDateTime(d.sentAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Stamp variant={DUNNING_STATUS_META[d.status].variant} rotate={0}>
                      {DUNNING_STATUS_META[d.status].label}
                    </Stamp>
                    {d.status === "sent" && (
                      <button
                        onClick={() => onAcknowledge(d.id)}
                        className="btn-olive !px-2 !py-1 text-[11px]"
                      >
                        标记确认
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg bg-cream-100/60 p-3 text-xs text-ink-soft">
          <div className="font-medium text-ink-muted">催缴通知内容</div>
          <div className="mt-2 leading-relaxed">
            尊敬的 {stallName} 摊主：您好！您 {fee.period} 期摊位费尚有{" "}
            {formatMoney(overdueAmount)} 未缴纳，请尽快到管理处或通过线上渠道完成缴费，感谢配合！——晨光摊位管理处
          </div>
        </div>
      </div>
    </Modal>
  );
}

function numberToChinese(n: number): string {
  const digits = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];
  const units = ["", "拾", "佰", "仟", "万"];
  const intPart = Math.floor(n);
  const decPart = Math.round((n - intPart) * 100);
  let result = "";
  const intStr = intPart.toString();
  for (let i = 0; i < intStr.length; i++) {
    const d = parseInt(intStr[i], 10);
    const u = intStr.length - 1 - i;
    if (d !== 0) {
      result += digits[d] + units[u];
    } else if (result && !result.endsWith("零")) {
      result += "零";
    }
  }
  result = result.replace(/零+$/, "") || "零";
  if (decPart > 0) {
    const jiao = Math.floor(decPart / 10);
    const fen = decPart % 10;
    if (jiao > 0) result += digits[jiao] + "角";
    if (fen > 0) result += digits[fen] + "分";
  }
  return result;
}
