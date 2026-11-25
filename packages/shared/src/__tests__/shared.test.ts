import { describe, expect, it } from "vitest";
import {
  buildCustomOrderWaLink,
  calculateMinDpAmount,
  calculateMoneyBouquetPrice,
  checkoutSchema,
  formatCompactRupiah,
  formatRupiah,
  getTimeSlotsForDate,
  isStoreOpenOnDate,
  normalizeIndonesianPhone,
} from "../index";

describe("Store Operating Hours (Bumbuket.pku)", () => {
  it("supports pickup slots 09:00-20:00 on Monday-Friday", () => {
    // 2026-11-23 is Monday
    expect(isStoreOpenOnDate("2026-11-23")).toBe(true);
    expect(getTimeSlotsForDate("2026-11-23")).toEqual([
      "09:00-11:00",
      "11:00-13:00",
      "13:00-15:00",
      "15:00-17:00",
      "17:00-20:00",
    ]);
  });

  it("supports pickup slots 12:00-20:00 on Saturday", () => {
    // 2026-11-28 is Saturday
    expect(isStoreOpenOnDate("2026-11-28")).toBe(true);
    expect(getTimeSlotsForDate("2026-11-28")).toEqual([
      "12:00-14:00",
      "14:00-16:00",
      "16:00-18:00",
      "18:00-20:00",
    ]);
  });

  it("is closed on Sunday", () => {
    // 2026-11-29 is Sunday
    expect(isStoreOpenOnDate("2026-11-29")).toBe(false);
    expect(getTimeSlotsForDate("2026-11-29")).toEqual([]);
  });
});

describe("Money Bouquet Pricelist Calculator", () => {
  it("calculates jasa + cash when paid together at checkout", () => {
    const result = calculateMoneyBouquetPrice({
      sheetCount: 25,
      denomination: 50_000,
      cashPaymentMode: "included_in_checkout",
    });

    expect(result.tier.id).toBe("tier-21-30");
    expect(result.craftingFee).toBe(200_000);
    expect(result.cashAmount).toBe(1_250_000);
    expect(result.checkoutPayableAmount).toBe(1_450_000);
    expect(result.canRequestNewNotes).toBe(false);
  });

  it("charges only crafting fee at checkout when cash is handled via WhatsApp", () => {
    const result = calculateMoneyBouquetPrice({
      sheetCount: 50,
      denomination: 10_000,
      cashPaymentMode: "separate_via_whatsapp",
    });

    expect(result.tier.id).toBe("tier-41-50");
    expect(result.craftingFee).toBe(325_000);
    expect(result.cashAmount).toBe(500_000);
    expect(result.checkoutPayableAmount).toBe(325_000);
    expect(result.totalBouquetValue).toBe(825_000);
    expect(result.canRequestNewNotes).toBe(true);
  });

  it("maps top tier 76-100 sheets to 1.150k crafting fee", () => {
    const result = calculateMoneyBouquetPrice({
      sheetCount: 100,
      denomination: 100_000,
      cashPaymentMode: "separate_via_whatsapp",
    });
    expect(result.craftingFee).toBe(1_150_000);
  });
});

describe("Checkout Validation (Pekanbaru Delivery & Store Hours)", () => {
  const validItem = {
    productId: "11111111-1111-4111-8111-111111111111",
    quantity: 1,
    wrappingColor: "Blush Pink",
  };

  it("rejects Sunday bookings", () => {
    const parsed = checkoutSchema.safeParse({
      customerName: "Siti Rahma",
      customerPhone: "082288890279",
      fulfillmentMethod: "pickup_store",
      scheduledDate: "2026-11-29",
      scheduledTimeSlot: "12:00-14:00",
      items: [validItem],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects morning slot on Saturday", () => {
    const parsed = checkoutSchema.safeParse({
      customerName: "Siti Rahma",
      customerPhone: "082288890279",
      fulfillmentMethod: "pickup_store",
      scheduledDate: "2026-11-28",
      scheduledTimeSlot: "08:00-10:00",
      items: [validItem],
    });
    expect(parsed.success).toBe(false);
  });

  it("requires courier provider, recipient name/phone, and address for instant_courier", () => {
    const missingCourier = checkoutSchema.safeParse({
      customerName: "Siti Rahma",
      customerPhone: "082288890279",
      fulfillmentMethod: "instant_courier",
      scheduledDate: "2026-11-23",
      scheduledTimeSlot: "09:00-11:00",
      items: [validItem],
    });
    expect(missingCourier.success).toBe(false);

    const validCourier = checkoutSchema.safeParse({
      customerName: "Siti Rahma",
      customerPhone: "082288890279",
      fulfillmentMethod: "instant_courier",
      courierProvider: "gojek",
      recipientName: "Nadya Putri",
      recipientPhone: "081234567890",
      deliveryDistrict: "Marpoyan Damai",
      deliveryAddress: "Jl. Kaharuddin Nasution No. 45, Pekanbaru",
      scheduledDate: "2026-11-23",
      scheduledTimeSlot: "09:00-11:00",
      items: [validItem],
    });
    expect(validCourier.success).toBe(true);
  });
});

describe("Currency & WhatsApp Helpers", () => {
  it("formats Rupiah properly", () => {
    expect(formatRupiah(185_000)).toBe("Rp 185.000");
    expect(formatCompactRupiah(1_150_000)).toBe("1.150k");
  });

  it("normalizes Indonesian phone and generates custom WA link", () => {
    expect(normalizeIndonesianPhone("0822-8889-0279")).toBe("6282288890279");
    const url = buildCustomOrderWaLink({
      productName: "Blush Pink Lily Premium",
      wrappingColor: "Blush Pink",
      greetingCardText: "Selamat Wisuda!",
      scheduledDate: "2026-11-23",
      scheduledTimeSlot: "10:00-12:00",
      fulfillmentMethod: "instant_courier",
      courierProvider: "grab",
    });
    expect(url).toContain("https://wa.me/6282288890279?text=");
    expect(decodeURIComponent(url)).toContain("Blush Pink Lily Premium");
    expect(decodeURIComponent(url)).toContain("Selamat Wisuda!");
    expect(decodeURIComponent(url)).toContain("Grab");
  });

  it("calculates minimum DP amount (50% or minimum Rp 50.000)", () => {
    expect(calculateMinDpAmount(185_000)).toBe(92_500);
    expect(calculateMinDpAmount(80_000)).toBe(50_000);
    expect(calculateMinDpAmount(45_000)).toBe(45_000);
  });
});

