import type { WrappingColor } from "../types/domain";

export const DEFAULT_WRAPPING_COLORS: readonly WrappingColor[] = [
  { name: "Blush Pink", hex: "#FCE7F3" },
  { name: "Soft Rose", hex: "#F472B6" },
  { name: "Deep Rose", hex: "#9D174D" },
  { name: "Pearl White", hex: "#FFFFFF" },
  { name: "Champagne Cream", hex: "#F5EBE0" },
  { name: "Dusty Lilac", hex: "#E9D5FF" },
  { name: "Baby Blue", hex: "#DBEAFE" },
  { name: "Sage Pastel", hex: "#D8E2DC" },
  { name: "Midnight Black", hex: "#1F2937" },
] as const;

