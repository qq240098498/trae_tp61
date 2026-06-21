import { useMemo, useState } from "react";
import {
  Bell,
  Clock,
  CheckCircle,
  ChefHat,
  Users,
  QrCode,
  Store,
  Volume2,
  Trophy,
  Medal,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { todayISO, formatMoney, cn, startOfWeekISO, formatDate } from "@/lib/utils";
import { getWeeklyCategoryRankings } from "@/lib/business";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import SectionCard from "@/components/SectionCard";
import Modal from "@/components/Modal";
import { Select } from "@/components/Form";
import type { Order, OrderStatus } from "@/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "待制作",
  preparing: "制作中",
  ready: "待取餐",
  completed: "已完成",
  cancelled: "已取消",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "text-amber2-500 bg-amber2-50",
  preparing: "text-terracotta-500 bg-terracotta-50",
  ready: "text-olive-500 bg-olive-50",
  completed: "text-ink-muted bg-cream-100",
  cancelled: "text-crimson-500 bg-crimson-50",
};

export default function QueueSystem() {
  const { stalls, locations, salesRecords, orders, updateOrderStatus, callNextOrder, recallOrder, completeOrder, cancelOrder } = useStore();
  const [selectedStall, setSelectedStall] = useState<string>(stalls[0]?.id ?? "");
  const [callingOrder, setCallingOrder] = useState<Order | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);

  const today = todayISO();

  const todayOrders = useMemo(
    () => orders.filter((o) => o.createdAt.startsWith(today) && o.stallId === selectedStall),
    [orders, today, selectedStall],
  );

  const stats = useMemo(() => {
    const pending = todayOrders.filter((o) => o.status === "pending").length;
    const preparing = todayOrders.filter((o) => o.status === "preparing").length;
    const ready = todayOrders.filter((o) => o.status === "ready").length;
    const completed = todayOrders.filter((o) => o.status === "completed").length;
    return { pending, preparing, ready, completed, total: todayOrders.length };
  }, [todayOrders]);

  const pendingQueue = useMemo(
    () =>
      todayOrders
        .filter((o) => o.status === "pending")
        .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)),
    [todayOrders],
  );

  const preparingQueue = useMemo(
    () =>
      todayOrders
        .filter((o) => o.status === "preparing")
        .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)),
    [todayOrders],
  );

  const readyQueue = useMemo(
    () =>
      todayOrders
        .filter((o) => o.status === "ready")
        .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)),
    [todayOrders],
  );

  const currentStall = stalls.find((s) => s.id === selectedStall);

  const weeklyRankings = useMemo(() => {
    if (!currentStall) return null;
    const rankings = getWeeklyCategoryRankings(salesRecords, stalls, locations, currentStall.locationId);
    return rankings[0] ?? null;
  }, [salesRecords, stalls, locations, currentStall]);

  const top3Categories = useMemo(() => {
    if (!weeklyRankings) return [];
    return weeklyRankings.rankings.slice(0, 3);
  }, [weeklyRankings]);

  const handleCallNext = () => {
    const next = callNextOrder(selectedStall);
    if (next) {
      setCallingOrder(next);
      setShowCallModal(true);
    }
  };

  const handleRecall = (order: Order) => {
    const found = recallOrder(order.id);
    if (found) {
      setCallingOrder(found);
      setShowCallModal(true);
    }
  };

  const handleMarkReady = (orderId: string) => {
    updateOrderStatus(orderId, "ready");
  };

  const handleComplete = (orderId: string) => {
    completeOrder(orderId);
  };

  const handleCancel = (orderId: string) => {
    if (window.confirm("确定取消该订单吗？")) {
      cancelOrder(orderId);
    }
  };

  const getWaitTime = (order: Order) => {
    const created = new Date(order.createdAt.replace(/-/g, "/"));
    const now = new Date();
    const diff = Math.floor((now.getTime() - created.getTime()) / 60000);
    return diff;
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="运营管理"
        title="排队叫号"
        subtitle="扫码下单，按号叫取，减少拥堵和错单"
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={selectedStall}
              onChange={(e) => setSelectedStall(e.target.value)}
              className="!w-auto"
            >
              {stalls.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.stallNo}
                </option>
              ))}
            </Select>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="待制作"
          value={stats.pending}
          icon={<ChefHat size={16} />}
          tone="amber"
          hint="排队中"
        />
        <StatCard
          label="制作中"
          value={stats.preparing}
          icon={<Users size={16} />}
          tone="terracotta"
          hint="正在制作"
        />
        <StatCard
          label="待取餐"
          value={stats.ready}
          icon={<Bell size={16} />}
          tone="olive"
          hint="等待取餐"
        />
        <StatCard
          label="今日完成"
          value={stats.completed}
          icon={<CheckCircle size={16} />}
          tone="ink"
          hint={`共 ${stats.total} 单`}
        />
      </div>

      <div className="mb-6">
        <SectionCard
          title="叫号器"
          subtitle="优先呼叫待取餐订单，其次呼叫制作中订单，最后开始制作下一个订单"
          icon={<Bell size={18} />}
        >
          <div className="flex flex-col items-center gap-4 py-6 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-terracotta-500 text-cream-50 shadow-stamp">
                  <Volume2 size={36} />
                </div>
                {stats.ready + stats.preparing + stats.pending > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-crimson-400 px-2 text-xs font-bold text-cream-50">
                    {stats.ready + stats.preparing + stats.pending}
                  </span>
                )}
              </div>
              <div>
                <div className="text-sm text-ink-muted">当前摊位</div>
                <div className="font-display text-xl text-ink">{currentStall?.name}</div>
                <div className="text-xs text-ink-faint">{currentStall?.category}</div>
                {stats.ready > 0 && (
                  <div className="mt-1 text-xs text-olive-500">
                    待取餐：{stats.ready} 单
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                className="btn-primary !px-6 !py-3 text-base"
                onClick={handleCallNext}
                disabled={stats.ready + stats.preparing + stats.pending === 0}
              >
                <Bell size={20} />
                {stats.ready > 0 ? "叫号取餐" : stats.preparing > 0 ? "叫号提醒" : "叫下一号"}
              </button>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mb-6">
        <SectionCard
          title="招牌菜 PK 榜"
          subtitle={`${weeklyRankings?.locationCode ?? ""} ${weeklyRankings?.locationName ?? ""} · 本周品类销量排名 · 摊主菜单参考`}
          icon={<Trophy size={18} />}
          action={
            <span className="text-[11px] text-ink-faint">
              {weeklyRankings ? `${formatDate(startOfWeekISO(today))} 至今` : ""}
            </span>
          }
        >
          {top3Categories.length === 0 ? (
            <div className="py-8 text-center text-sm text-ink-faint">暂无本周销量数据</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {top3Categories.map((item, index) => (
                <div
                  key={item.category}
                  className={cn(
                    "relative rounded-xl border p-4 transition-all hover:shadow-md",
                    index === 0
                      ? "border-amber2-200 bg-amber2-50/50"
                      : index === 1
                      ? "border-ink-200 bg-cream-50"
                      : "border-terracotta-200 bg-terracotta-50/30",
                  )}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold",
                        index === 0
                          ? "bg-amber2-400 text-cream-50"
                          : index === 1
                          ? "bg-ink-300 text-cream-50"
                          : "bg-terracotta-300 text-cream-50",
                      )}
                    >
                      {index + 1}
                    </span>
                    <Medal
                      size={20}
                      className={cn(
                        index === 0
                          ? "text-amber2-500"
                          : index === 1
                          ? "text-ink-400"
                          : "text-terracotta-400",
                      )}
                    />
                  </div>
                  <div className="font-display text-lg text-ink">{item.category}</div>
                  <div className="mt-1 text-xs text-ink-muted">本周销量 TOP</div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="font-serif text-2xl font-bold text-ink">
                      {item.totalQuantity}
                    </span>
                    <span className="text-xs text-ink-faint">份</span>
                  </div>
                  <div className="mt-1 text-xs text-ink-soft">
                    营收 {formatMoney(item.totalRevenue)}
                  </div>
                  <div className="mt-3 border-t border-cream-200/60 pt-2">
                    <div className="text-[11px] text-ink-faint">销量冠军摊主</div>
                    <div className="mt-0.5 flex items-center gap-1 text-sm font-medium text-ink">
                      <ChefHat size={14} className="text-terracotta-400" />
                      {item.topStall?.stallName}
                      <span className="text-[10px] text-ink-faint">{item.topStall?.stallNo}</span>
                    </div>
                    <div className="text-[11px] text-ink-muted">
                      售出 {item.topStall?.quantity} 份
                    </div>
                  </div>
                  {index === 0 && (
                    <div className="absolute -right-2 -top-2">
                      <div className="rotate-12 rounded-full bg-amber2-500 px-2 py-0.5 text-[10px] font-bold text-cream-50 shadow-sm">
                        招牌王
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {weeklyRankings && weeklyRankings.rankings.length > 3 && (
            <div className="mt-4 border-t border-cream-200/60 pt-3">
              <div className="mb-2 text-xs font-medium text-ink-soft">更多品类排名</div>
              <div className="space-y-1.5">
                {weeklyRankings.rankings.slice(3, 6).map((item, index) => (
                  <div
                    key={item.category}
                    className="flex items-center justify-between rounded-md bg-cream-50/50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cream-200 text-[10px] font-bold text-ink-muted">
                        {index + 4}
                      </span>
                      <span className="text-sm text-ink">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-sm font-semibold text-ink tnum">
                        {item.totalQuantity} 份
                      </span>
                      <span className="text-[11px] text-ink-faint">
                        {item.stallCount} 摊竞争
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="待制作队列"
          subtitle={`${pendingQueue.length} 单等待`}
          icon={<Clock size={16} />}
        >
          <div className="space-y-3">
            {pendingQueue.length === 0 && (
              <p className="py-8 text-center text-sm text-ink-faint">暂无待制作订单</p>
            )}
            {pendingQueue.map((order, idx) => (
              <OrderCard
                key={order.id}
                order={order}
                waitTime={getWaitTime(order)}
                position={idx + 1}
                actions={
                  <div className="flex gap-2">
                    <button
                      className="btn-primary !py-1.5 !px-3 text-xs"
                      onClick={() => updateOrderStatus(order.id, "preparing")}
                    >
                      开始制作
                    </button>
                    <button
                      className="btn-ghost !py-1.5 !px-3 text-xs text-crimson-500 hover:bg-crimson-50"
                      onClick={() => handleCancel(order.id)}
                    >
                      取消
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="制作中"
          subtitle={`${preparingQueue.length} 单制作中`}
          icon={<ChefHat size={16} />}
        >
          <div className="space-y-3">
            {preparingQueue.length === 0 && (
              <p className="py-8 text-center text-sm text-ink-faint">暂无制作中订单</p>
            )}
            {preparingQueue.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                waitTime={getWaitTime(order)}
                actions={
                  <div className="flex gap-2">
                    <button
                      className="btn-ghost !py-1.5 !px-3 text-xs"
                      onClick={() => handleRecall(order)}
                    >
                      <Bell size={14} />
                      再次呼叫
                    </button>
                    <button
                      className="btn-primary !py-1.5 !px-3 text-xs !bg-olive-500 hover:!bg-olive-600"
                      onClick={() => handleMarkReady(order.id)}
                    >
                      <CheckCircle size={14} />
                      完成制作
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="待取餐"
          subtitle={`${readyQueue.length} 单等待取餐`}
          icon={<Bell size={16} />}
        >
          <div className="space-y-3">
            {readyQueue.length === 0 && (
              <p className="py-8 text-center text-sm text-ink-faint">暂无待取餐订单</p>
            )}
            {readyQueue.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                waitTime={getWaitTime(order)}
                highlight
                actions={
                  <div className="flex gap-2">
                    <button
                      className="btn-ghost !py-1.5 !px-3 text-xs"
                      onClick={() => handleRecall(order)}
                    >
                      <Bell size={14} />
                      再次呼叫
                    </button>
                    <button
                      className="btn-primary !py-1.5 !px-3 text-xs"
                      onClick={() => handleComplete(order.id)}
                    >
                      确认取餐
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        </SectionCard>
      </div>

      <Modal
        open={showCallModal}
        onClose={() => setShowCallModal(false)}
        title="叫号通知"
        subtitle={
          callingOrder
            ? callingOrder.status === "ready"
              ? "请顾客前来取餐"
              : callingOrder.status === "preparing"
              ? "您的餐点正在制作中"
              : "已开始为您制作"
            : "请顾客前来取餐"
        }
      >
        {callingOrder && (
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-terracotta-100">
              <Bell size={40} className="text-terracotta-500" />
            </div>
            <div className="mb-2 text-6xl font-serif font-bold text-terracotta-500">
              {callingOrder.orderNo}
            </div>
            <p className="text-sm text-ink-muted">
              {callingOrder.status === "ready"
                ? "号顾客，您的餐点已备好，请前来取餐"
                : callingOrder.status === "preparing"
                ? "号顾客，您的餐点正在制作中，请稍候"
                : "号顾客，您的餐点已开始制作"}
            </p>
            <div className="mt-4 rounded-lg bg-cream-50 p-4 text-left">
              <div className="mb-2 text-sm font-medium text-ink">订单明细</div>
              {callingOrder.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm text-ink-soft">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>{formatMoney(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="mt-2 border-t border-cream-200 pt-2 text-right font-medium text-ink">
                合计：{formatMoney(callingOrder.totalAmount)}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

interface OrderCardProps {
  order: Order;
  waitTime: number;
  position?: number;
  highlight?: boolean;
  actions?: React.ReactNode;
}

function OrderCard({ order, waitTime, position, highlight, actions }: OrderCardProps) {
  const { stalls } = useStore();
  const stall = stalls.find((s) => s.id === order.stallId);

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-all",
        highlight
          ? "border-olive-300 bg-olive-50/50 shadow-sm"
          : "border-cream-200/80 bg-white/50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {position && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber2-100 text-xs font-bold text-amber2-500">
              {position}
            </span>
          )}
          <span
            className={cn(
              "font-serif text-xl font-bold",
              highlight ? "text-olive-600" : "text-terracotta-500",
            )}
          >
            {order.orderNo}
          </span>
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_COLORS[order.status])}>
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="mt-2 space-y-1">
        {order.items.slice(0, 3).map((item, i) => (
          <div key={i} className="flex justify-between text-xs text-ink-soft">
            <span className="truncate">
              {item.name} × {item.quantity}
            </span>
          </div>
        ))}
        {order.items.length > 3 && (
          <div className="text-[10px] text-ink-faint">还有 {order.items.length - 3} 项...</div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[10px] text-ink-faint">
          <span className="flex items-center gap-1">
            <Clock size={10} />
            等待 {waitTime} 分钟
          </span>
          {order.source === "scan" ? (
            <span className="flex items-center gap-1 text-olive-500">
              <QrCode size={10} /> 扫码下单
            </span>
          ) : (
            <span className="flex items-center gap-1 text-terracotta-500">
              <Store size={10} /> 柜台下单
            </span>
          )}
        </div>
        <span className="font-serif text-sm font-semibold text-ink">
          {formatMoney(order.totalAmount)}
        </span>
      </div>

      {order.note && (
        <div className="mt-2 rounded bg-cream-100/60 px-2 py-1 text-[10px] text-ink-muted">
          备注：{order.note}
        </div>
      )}

      {actions && <div className="mt-3 flex justify-end">{actions}</div>}
    </div>
  );
}
