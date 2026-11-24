"use client";

import type { CartItem } from "@bumbuket/shared";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (item: Omit<CartItem, "cartKey">) => void;
  removeItem: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  clearCart: () => void;
}

export function buildCartKey(item: Omit<CartItem, "cartKey">): string {
  const moneyPart = item.moneyBouquetDetails
    ? JSON.stringify(item.moneyBouquetDetails)
    : "no-mb";
  return [
    item.productId,
    item.variantId ?? "no-var",
    item.wrappingColor ?? "no-wrap",
    item.greetingCardText ?? "",
    item.customNotes ?? "",
    moneyPart,
  ].join("::");
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isDrawerOpen: false,
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      addItem: (incoming) =>
        set((state) => {
          const cartKey = buildCartKey(incoming);
          const existing = state.items.find((i) => i.cartKey === cartKey);

          if (existing) {
            return {
              isDrawerOpen: true,
              items: state.items.map((i) =>
                i.cartKey === cartKey
                  ? { ...i, quantity: i.quantity + incoming.quantity }
                  : i
              ),
            };
          }

          return {
            isDrawerOpen: true,
            items: [...state.items, { ...incoming, cartKey }],
          };
        }),
      removeItem: (cartKey) =>
        set((state) => ({
          items: state.items.filter((i) => i.cartKey !== cartKey),
        })),
      updateQuantity: (cartKey, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.cartKey !== cartKey) };
          }
          return {
            items: state.items.map((i) =>
              i.cartKey === cartKey ? { ...i, quantity } : i
            ),
          };
        }),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "bumbuket-pku-cart-v1",
      partialize: (state) => ({ items: state.items }),
    }
  )
);

