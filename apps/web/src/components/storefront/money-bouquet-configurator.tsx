"use client";

import { Check, Info, Sparkles } from "lucide-react";
import {
  calculateMoneyBouquetPrice,
  formatCompactRupiah,
  formatRupiah,
  MONEY_BOUQUET_CASH_PAYMENT_MODES,
  MONEY_BOUQUET_DENOMINATIONS,
  MONEY_BOUQUET_DISCLAIMER,
  MONEY_BOUQUET_INCLUDES,
  MONEY_BOUQUET_MAX_SHEETS,
  MONEY_BOUQUET_MIN_SHEETS,
  MONEY_BOUQUET_TIERS,
  type MoneyBouquetCashPaymentMode,
  type MoneyBouquetDetails,
} from "@bumbuket/shared";
import { cn } from "@/lib/utils";

interface MoneyBouquetConfiguratorProps {
  value: MoneyBouquetDetails;
  onChange: (next: MoneyBouquetDetails) => void;
}

const SHEET_PRESETS = [10, 20, 30, 50, 75, 100];

export function MoneyBouquetConfigurator({
  value,
  onChange,
}: MoneyBouquetConfiguratorProps) {
  const breakdown = calculateMoneyBouquetPrice({
    sheetCount: value.sheet_count,
    denomination: value.denomination,
    cashPaymentMode: value.cash_payment_mode,
  });

  const updateConfig = (
    partial: Partial<{
      sheet_count: number;
      denomination: number;
      cash_payment_mode: MoneyBouquetCashPaymentMode;
      include_foil_balloon: boolean;
      request_new_notes: boolean;
    }>
  ) => {
    const nextSheets = Math.min(
      MONEY_BOUQUET_MAX_SHEETS,
      Math.max(
        MONEY_BOUQUET_MIN_SHEETS,
        partial.sheet_count ?? value.sheet_count
      )
    );
    const nextDenom = partial.denomination ?? value.denomination;
    const nextMode = partial.cash_payment_mode ?? value.cash_payment_mode;
    const calc = calculateMoneyBouquetPrice({
      sheetCount: nextSheets,
      denomination: nextDenom,
      cashPaymentMode: nextMode,
    });

    onChange({
      sheet_count: nextSheets,
      denomination: nextDenom,
      crafting_fee: calc.craftingFee,
      cash_amount: calc.cashAmount,
      cash_payment_mode: nextMode,
      include_foil_balloon:
        partial.include_foil_balloon ?? value.include_foil_balloon,
      request_new_notes: calc.canRequestNewNotes
        ? (partial.request_new_notes ?? value.request_new_notes)
        : false,
    });
  };

  return (
    <div className="space-y-5 rounded-2xl border border-pink-200/80 bg-gradient-to-br from-brand-blush/40 via-white to-pink-50/40 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-rose" />
          <h3 className="font-serif text-lg font-semibold text-brand-rose">
            Kalkulator Money Bouquet
          </h3>
        </div>
        <span className="rounded-full bg-brand-blush px-2.5 py-1 text-xs font-semibold text-brand-rose">
          Tier: {breakdown.tier.label}
        </span>
      </div>

      {/* 1. Jumlah Lembar */}
      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="mb-sheets"
            className="text-sm font-semibold text-foreground"
          >
            Jumlah Lembar Uang (1–100 lembar)
          </label>
          <span className="text-sm font-bold text-brand-rose">
            {value.sheet_count} lembar
          </span>
        </div>

        <input
          id="mb-sheets"
          type="range"
          min={MONEY_BOUQUET_MIN_SHEETS}
          max={MONEY_BOUQUET_MAX_SHEETS}
          value={value.sheet_count}
          onChange={(e) =>
            updateConfig({ sheet_count: Number(e.target.value) })
          }
          className="mt-2 h-2 w-full cursor-pointer accent-brand-rose"
        />

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {SHEET_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => updateConfig({ sheet_count: preset })}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                value.sheet_count === preset
                  ? "bg-brand-rose text-white"
                  : "border border-pink-200 bg-white text-foreground hover:bg-brand-blush/60"
              )}
            >
              {preset} lbr
            </button>
          ))}
        </div>

        {/* Ringkasan Tier Pricelist */}
        <details className="mt-3 rounded-xl border border-pink-100 bg-white/80 px-3.5 py-2 text-xs">
          <summary className="cursor-pointer font-semibold text-brand-rose">
            Lihat Pricelist Jasa Rangkai (1–100 Lembar)
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-1.5 pb-1">
            {MONEY_BOUQUET_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={cn(
                  "flex items-center justify-between rounded-lg px-2 py-1",
                  tier.id === breakdown.tier.id
                    ? "bg-brand-blush font-semibold text-brand-rose"
                    : "text-muted-foreground"
                )}
              >
                <span>{tier.label}</span>
                <span>{formatCompactRupiah(tier.craftingFee)}</span>
              </div>
            ))}
          </div>
        </details>
      </div>

      {/* 2. Pecahan Uang */}
      <div>
        <p className="text-sm font-semibold text-foreground">
          Pilih Pecahan Uang
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {MONEY_BOUQUET_DENOMINATIONS.map((denom) => (
            <button
              key={denom}
              type="button"
              onClick={() => updateConfig({ denomination: denom })}
              className={cn(
                "rounded-xl border px-3 py-2 text-xs font-semibold transition-all",
                value.denomination === denom
                  ? "border-brand-rose bg-brand-rose text-white shadow-xs"
                  : "border-pink-200 bg-white text-foreground hover:bg-brand-blush/50"
              )}
            >
              {formatRupiah(denom)}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Opsi Pembayaran Isi Uang */}
      <div>
        <p className="text-sm font-semibold text-foreground">
          Metode Pembayaran Isi Uang
        </p>
        <div className="mt-2 space-y-2">
          {(
            Object.keys(
              MONEY_BOUQUET_CASH_PAYMENT_MODES
            ) as MoneyBouquetCashPaymentMode[]
          ).map((modeKey) => {
            const option = MONEY_BOUQUET_CASH_PAYMENT_MODES[modeKey];
            const active = value.cash_payment_mode === modeKey;

            return (
              <button
                key={modeKey}
                type="button"
                onClick={() => updateConfig({ cash_payment_mode: modeKey })}
                className={cn(
                  "w-full rounded-xl border p-3 text-left transition-all",
                  active
                    ? "border-brand-rose bg-brand-blush/45 ring-1 ring-brand-rose"
                    : "border-pink-200 bg-white hover:bg-brand-blush/20"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-foreground">
                    {option.label}
                  </span>
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full border",
                      active
                        ? "border-brand-rose bg-brand-rose text-white"
                        : "border-pink-300"
                    )}
                  >
                    {active && <Check className="h-2.5 w-2.5" />}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Opsi Tambahan Gratis */}
      <div className="space-y-2 rounded-xl border border-pink-100 bg-white/90 p-3.5 text-xs">
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={value.include_foil_balloon}
            onChange={(e) =>
              updateConfig({ include_foil_balloon: e.target.checked })
            }
            className="h-4 w-4 rounded border-pink-300 accent-brand-rose"
          />
          <span className="font-medium text-foreground">
            Tambahkan <strong>Balon Foil</strong> (Gratis)
          </span>
        </label>

        <label
          className={cn(
            "flex items-center gap-2.5",
            breakdown.canRequestNewNotes
              ? "cursor-pointer"
              : "cursor-not-allowed opacity-50"
          )}
        >
          <input
            type="checkbox"
            disabled={!breakdown.canRequestNewNotes}
            checked={value.request_new_notes}
            onChange={(e) =>
              updateConfig({ request_new_notes: e.target.checked })
            }
            className="h-4 w-4 rounded border-pink-300 accent-brand-rose"
          />
          <span className="font-medium text-foreground">
            Request <strong>Uang Pecahan Baru 2k–20k</strong> (selama stok
            tersedia)
          </span>
        </label>
      </div>

      {/* 5. Rincian Biaya Transparan */}
      <div className="rounded-xl bg-white p-4 text-xs shadow-xs ring-1 ring-pink-100">
        <div className="space-y-1.5">
          <div className="flex justify-between text-muted-foreground">
            <span>Biaya Jasa Rangkai ({breakdown.tier.label})</span>
            <span className="font-semibold text-foreground">
              {formatRupiah(breakdown.craftingFee)}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>
              Nominal Isi Uang ({value.sheet_count} ×{" "}
              {formatRupiah(value.denomination)})
            </span>
            <span className="font-semibold text-foreground">
              {formatRupiah(breakdown.cashAmount)}
            </span>
          </div>
          <div className="flex justify-between border-t border-pink-100 pt-2 text-sm font-bold text-brand-rose">
            <span>
              {value.cash_payment_mode === "included_in_checkout"
                ? "Total Dibayar di Checkout"
                : "Dibayar di Checkout (Jasa Dulu)"}
            </span>
            <span>{formatRupiah(breakdown.checkoutPayableAmount)}</span>
          </div>
        </div>

        <p className="mt-2.5 flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-pink" />
          <span>{MONEY_BOUQUET_DISCLAIMER}</span>
        </p>
      </div>

      {/* Include Checklist */}
      <div className="text-[11px] text-muted-foreground">
        <p className="font-semibold text-foreground">Sudah termasuk:</p>
        <ul className="mt-1 space-y-0.5">
          {MONEY_BOUQUET_INCLUDES.map((inc) => (
            <li key={inc} className="flex items-start gap-1.5">
              <Check className="mt-0.5 h-3 w-3 shrink-0 text-brand-rose" />
              <span>{inc}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

