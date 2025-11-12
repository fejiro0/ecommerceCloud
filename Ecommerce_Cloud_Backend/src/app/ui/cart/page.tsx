"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaMinus, FaPlus, FaShoppingCart, FaTrash, FaImage } from "react-icons/fa";
import { toast } from "react-toastify";

const CART_KEY = "gomart:cart";

type CartItem = {
  productId: string;
  productName: string;
  price: number;
  imageURL?: string | null;
  quantity: number;
  stockQuantity: number;
};

type CartState = {
  items: CartItem[];
};

function readCart(): CartState {
  if (typeof window === "undefined") return { items: [] };
  try {
    const stored = localStorage.getItem(CART_KEY);
    const items: CartItem[] = stored ? JSON.parse(stored) : [];
    return { items };
  } catch (error) {
    console.error("Failed to parse cart", error);
    return { items: [] };
  }
}

function writeCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new StorageEvent("storage", { key: CART_KEY }));
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const { items } = readCart();
    setCartItems(items);

    function handleStorage(event: StorageEvent) {
      if (event.key === CART_KEY) {
        const { items } = readCart();
        setCartItems(items);
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const totals = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal === 0 ? 0 : subtotal >= 500 ? 0 : 20;
    const total = subtotal + shipping;
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    return { subtotal, shipping, total, totalItems };
  }, [cartItems]);

  function updateQuantity(productId: string, delta: number) {
    setCartItems((prev) => {
      const updated = prev.map((item) => {
        if (item.productId !== productId) return item;
        const nextQuantity = Math.min(Math.max(item.quantity + delta, 1), item.stockQuantity || item.quantity);
        return { ...item, quantity: nextQuantity };
      });
      writeCart(updated);
      return updated;
    });
  }

  function removeItem(productId: string) {
    setCartItems((prev) => {
      const updated = prev.filter((item) => item.productId !== productId);
      writeCart(updated);
      return updated;
    });
    toast.success("Removed from cart");
  }

  function clearCart() {
    writeCart([]);
    setCartItems([]);
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="glass-surface rounded-3xl p-12">
          <FaShoppingCart className="mx-auto text-5xl text-gray-400 mb-4" />
          <h1 className="text-3xl font-extrabold text-white">Your cart is empty</h1>
          <p className="text-sm text-gray-300">Add products to start checkout.</p>
          <div className="flex justify-center gap-3 mt-6">
            <Link href="/ui/products/list" className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold">
              Browse products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div className="space-y-2">
          <span className="pill">Shopping cart</span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg">Review your items</h1>
          <p className="text-sm text-gray-300">{totals.totalItems} item(s) ready for checkout</p>
        </div>
        <button onClick={clearCart} className="text-sm text-red-400 font-semibold hover:text-red-300 transition-colors">
          Clear cart
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr,0.9fr]">
        <div className="space-y-4">
          {cartItems.map((item) => (
            <div key={item.productId} className="glass-surface rounded-3xl p-5 md:p-6 flex flex-col sm:flex-row gap-4">
              <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-white/10">
                {item.imageURL ? (
                  <Image src={item.imageURL} alt={item.productName} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-300">
                    <FaImage className="text-3xl" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{item.productName}</h3>
                    <p className="text-sm text-gray-200">GH₵ {item.price.toFixed(2)} each</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-red-400 hover:text-red-300"
                  >
                    <FaTrash /> Remove
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="rounded-full border border-white/20 p-2 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white transition-all"
                    >
                      <FaMinus className="text-xs" />
                    </button>
                    <span className="min-w-[36px] text-center font-semibold text-white text-base">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="rounded-full border border-white/20 p-2 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white transition-all"
                      disabled={item.quantity >= item.stockQuantity}
                    >
                      <FaPlus className="text-xs" />
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">
                    {item.stockQuantity > 0 ? `${item.stockQuantity} available` : "Out of stock"}
                  </span>
                </div>

                <p className="text-base font-bold text-[var(--gold)]">
                  Subtotal: GH₵ {(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <aside className="glass-surface rounded-3xl p-6 space-y-5 h-fit">
          <h2 className="text-xl font-bold text-white">Order summary</h2>
          <div className="space-y-3 text-sm text-gray-200">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold">GH₵ {totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-semibold">{totals.shipping === 0 ? "FREE" : `GH₵ ${totals.shipping.toFixed(2)}`}</span>
            </div>
            {totals.subtotal > 0 && totals.subtotal < 500 && (
              <p className="text-xs text-gray-300 bg-white/5 rounded-lg p-2 border border-white/10">
                Add GH₵ {(500 - totals.subtotal).toFixed(2)} more for free shipping.
              </p>
            )}
            <div className="border-t border-white/20 pt-3 flex justify-between text-lg font-bold text-white">
              <span>Total</span>
              <span className="text-[var(--gold)]">GH₵ {totals.total.toFixed(2)}</span>
            </div>
          </div>

          <Link
            href="/ui/checkout"
            className="btn-primary block w-full px-6 py-3 rounded-xl text-sm font-semibold text-center"
          >
            Proceed to checkout
          </Link>
          <Link href="/ui/products/list" className="block text-center text-xs text-gray-300 hover:text-white transition-colors">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}





