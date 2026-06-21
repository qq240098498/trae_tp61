import { useMemo, useState } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  QrCode,
  CheckCircle,
  ArrowLeft,
  Clock,
  Store,
  Sun,
  Receipt,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { formatMoney, cn } from "@/lib/utils";
import type { OrderItem } from "@/types";

interface CartItem extends OrderItem {}

const MENU_ITEMS: Record<string, { name: string; price: number; category: string }[]> = {
  "ST-001": [
    { name: "原味手抓饼", price: 6, category: "手抓饼" },
    { name: "鸡蛋手抓饼", price: 8, category: "手抓饼" },
    { name: "加肠手抓饼", price: 10, category: "手抓饼" },
    { name: "热豆浆", price: 3, category: "豆浆" },
    { name: "甜豆浆", price: 3.5, category: "豆浆" },
  ],
  "ST-002": [
    { name: "猪肉包子", price: 2.5, category: "包子" },
    { name: "韭菜包子", price: 2, category: "包子" },
    { name: "小米粥", price: 3, category: "粥" },
    { name: "皮蛋瘦肉粥", price: 5, category: "粥" },
  ],
  "ST-003": [
    { name: "油条", price: 3, category: "油条" },
    { name: "胡辣汤（小碗）", price: 5, category: "胡辣汤" },
    { name: "胡辣汤（大碗）", price: 7, category: "胡辣汤" },
  ],
  "ST-004": [
    { name: "基础煎饼果子", price: 7, category: "煎饼果子" },
    { name: "双蛋煎饼", price: 10, category: "煎饼果子" },
    { name: "加肠煎饼", price: 11, category: "煎饼果子" },
  ],
  "ST-005": [
    { name: "阳春面", price: 8, category: "面条" },
    { name: "炸酱面", price: 12, category: "面条" },
    { name: "鲜肉馄饨", price: 10, category: "馄饨" },
    { name: "菜肉大馄饨", price: 12, category: "馄饨" },
  ],
  "ST-006": [
    { name: "原味杂粮煎饼", price: 6, category: "杂粮煎饼" },
    { name: "鸡蛋杂粮煎饼", price: 8, category: "杂粮煎饼" },
    { name: "薄脆杂粮煎饼", price: 9, category: "杂粮煎饼" },
  ],
  "ST-007": [
    { name: "芝麻烧饼", price: 3, category: "烧饼" },
    { name: "咸香烧饼", price: 3.5, category: "烧饼" },
    { name: "烧饼夹菜", price: 6, category: "烧饼" },
  ],
  "ST-008": [
    { name: "鲜肉小笼包", price: 8, category: "小笼包" },
    { name: "蟹粉小笼包", price: 15, category: "小笼包" },
    { name: "鲜肉蒸饺", price: 6, category: "蒸饺" },
    { name: "韭菜蒸饺", price: 5, category: "蒸饺" },
  ],
};

export default function CustomerOrder() {
  const { stalls, orders, addOrder } = useStore();
  const [selectedStall, setSelectedStall] = useState<string>(stalls[0]?.id ?? "");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");

  const currentStall = stalls.find((s) => s.id === selectedStall);
  const menu = MENU_ITEMS[selectedStall] || [];

  const categories = useMemo(() => {
    const cats = new Set(menu.map((m) => m.category));
    return Array.from(cats);
  }, [menu]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const addToCart = (item: { name: string; price: number; category: string }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.name === item.name);
      if (existing) {
        return prev.map((i) =>
          i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemName: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.name === itemName);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.name === itemName ? { ...i, quantity: i.quantity - 1 } : i,
        );
      }
      return prev.filter((i) => i.name !== itemName);
    });
  };

  const getCartQuantity = (itemName: string) => {
    return cart.find((i) => i.name === itemName)?.quantity || 0;
  };

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;

    addOrder({
      stallId: selectedStall,
      items: cart,
      source: "scan",
      customerName: customerName || undefined,
      note: note || undefined,
    });

    const todayOrders = orders.filter(
      (o) => o.createdAt.startsWith(new Date().toISOString().slice(0, 10)) && o.stallId === selectedStall,
    );
    const orderNo = `A${String(100 + todayOrders.length + 1)}`;
    setOrderPlaced(orderNo);
    setCart([]);
    setShowCart(false);
  };

  const resetOrder = () => {
    setOrderPlaced(null);
    setCustomerName("");
    setNote("");
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream-100 to-cream-50">
        <div className="mx-auto max-w-md px-4 py-8">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-olive-100">
              <CheckCircle size={48} className="text-olive-500" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-ink">下单成功</h1>
            <p className="mt-1 text-sm text-ink-muted">请凭取餐号取餐</p>
          </div>

          <div className="mt-8 rounded-2xl border-2 border-terracotta-200 bg-white p-6 shadow-stamp">
            <div className="text-center">
              <div className="text-xs uppercase tracking-wider text-ink-faint">您的取餐号</div>
              <div className="mt-2 font-serif text-7xl font-bold text-terracotta-500">
                {orderPlaced}
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-ink-soft">
                <Store size={14} className="text-terracotta-400" />
                {currentStall?.name} · {currentStall?.category}
              </div>
            </div>

            <div className="mt-6 border-t border-dashed border-cream-300 pt-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
                <Receipt size={16} className="text-terracotta-400" />
                订单明细
              </div>
              <div className="space-y-2">
                {cart.length > 0 ? (
                  cart.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm text-ink-soft">
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span>{formatMoney(item.price * item.quantity)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-ink-faint">（订单详情已保存）</p>
                )}
              </div>
              <div className="mt-3 flex justify-between border-t border-cream-200 pt-3 font-medium text-ink">
                <span>合计</span>
                <span className="text-terracotta-500">{formatMoney(cartTotal || 0)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-ink-faint">
              <Clock size={12} />
              <span>预计等待时间：约 5-8 分钟</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="rounded-xl bg-amber2-50 p-4">
              <div className="flex items-start gap-3">
                <QrCode size={20} className="shrink-0 text-amber2-500" />
                <div>
                  <div className="text-sm font-medium text-amber2-700">温馨提示</div>
                  <p className="mt-1 text-xs text-amber2-600">
                    请留意叫号屏幕，听到您的号码后请到取餐口取餐。如需帮助请联系工作人员。
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={resetOrder}
              className="btn-primary w-full justify-center"
            >
              <ArrowLeft size={16} />
              继续下单
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-100 to-cream-50">
      <header className="sticky top-0 z-20 border-b border-cream-300/60 bg-cream-100/90 backdrop-blur-md">
        <div className="mx-auto max-w-md px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-terracotta-400 text-cream-50">
                <Sun size={18} />
              </div>
              <div>
                <div className="font-display text-base text-ink">晨光摊位</div>
                <div className="text-[10px] text-ink-faint">扫码下单 · 快速取餐</div>
              </div>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-terracotta-500 text-cream-50 shadow-stamp"
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-crimson-400 px-1 text-[10px] font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 py-4">
        <div className="mb-4">
          <label className="text-xs text-ink-muted">选择摊位</label>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
            {stalls.map((stall) => (
              <button
                key={stall.id}
                onClick={() => {
                  setSelectedStall(stall.id);
                  setCart([]);
                }}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  selectedStall === stall.id
                    ? "border-terracotta-400 bg-terracotta-400 text-cream-50"
                    : "border-cream-300 bg-white/60 text-ink-soft",
                )}
              >
                {stall.name}
              </button>
            ))}
          </div>
        </div>

        {categories.map((category) => (
          <div key={category} className="mb-6">
            <h2 className="mb-3 font-display text-lg font-semibold text-ink">
              {category}
            </h2>
            <div className="space-y-2">
              {menu
                .filter((m) => m.category === category)
                .map((item, idx) => {
                  const qty = getCartQuantity(item.name);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-cream-200/80 bg-white/70 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-ink">{item.name}</div>
                        <div className="mt-0.5 font-serif text-base font-semibold text-terracotta-500">
                          {formatMoney(item.price)}
                        </div>
                      </div>
                      <div className="ml-3 flex items-center gap-2">
                        {qty > 0 && (
                          <>
                            <button
                              onClick={() => removeFromCart(item.name)}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-cream-100 text-ink-soft transition hover:bg-cream-200"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-6 text-center font-serif text-sm font-semibold text-ink">
                              {qty}
                            </span>
                          </>
                        )}
                        <button
                          onClick={() => addToCart(item)}
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full transition",
                            qty > 0
                              ? "bg-terracotta-500 text-cream-50 hover:bg-terracotta-600"
                              : "bg-terracotta-100 text-terracotta-500 hover:bg-terracotta-200",
                          )}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-cream-300/60 bg-cream-50/95 p-4 backdrop-blur-md">
          <div className="mx-auto max-w-md">
            <button
              onClick={() => setShowCart(true)}
              className="btn-primary w-full justify-between !py-3"
            >
              <span className="flex items-center gap-2">
                <ShoppingCart size={18} />
                去结算
                <span className="text-sm font-normal text-cream-50/80">
                  ({cartCount} 件)
                </span>
              </span>
              <span className="font-serif text-lg font-semibold">
                {formatMoney(cartTotal)}
              </span>
            </button>
          </div>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setShowCart(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-cream-50 p-4 shadow-lift">
            <div className="mx-auto max-w-md">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-ink">购物车</h3>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-ink-muted hover:text-ink"
                >
                  关闭
                </button>
              </div>

              <div className="space-y-3">
                {cart.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-white/60 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-ink">{item.name}</div>
                      <div className="text-xs text-ink-muted">{formatMoney(item.price)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeFromCart(item.name)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-cream-100 text-ink-soft transition hover:bg-cream-200"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center font-serif text-sm font-semibold text-ink">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => addToCart(item)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-terracotta-500 text-cream-50 transition hover:bg-terracotta-600"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs text-ink-muted">备注（选填）</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="如：不要辣、少糖等"
                    className="input mt-1 w-full"
                  />
                </div>

                <div>
                  <label className="text-xs text-ink-muted">您的称呼（选填）</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="方便叫号时称呼您"
                    className="input mt-1 w-full"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-cream-200 pt-4">
                <span className="text-sm text-ink-muted">合计</span>
                <span className="font-serif text-2xl font-bold text-terracotta-500">
                  {formatMoney(cartTotal)}
                </span>
              </div>

              <button
                onClick={handlePlaceOrder}
                className="btn-primary mt-4 w-full justify-center !py-3"
                disabled={cart.length === 0}
              >
                <QrCode size={18} />
                确认下单
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
