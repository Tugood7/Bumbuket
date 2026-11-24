import Script from "next/script";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { getMidtransSnapScriptUrl } from "@/lib/midtrans";

export const metadata = {
  title: "Checkout Pesanan",
};

export default function CheckoutPage() {
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  const snapScriptUrl = getMidtransSnapScriptUrl();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {clientKey && (
        <Script
          src={snapScriptUrl}
          data-client-key={clientKey}
          strategy="afterInteractive"
        />
      )}

      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-pink">
          Bumbuket.pku • Pekanbaru
        </p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-foreground sm:text-4xl">
          Checkout Buket
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Lengkapi jadwal pengambilan, metode kurir, dan pilih pembayaran
          otomatis Midtrans, Transfer BRI resmi, atau kirim langsung via
          WhatsApp.
        </p>
      </div>

      <CheckoutForm />
    </div>
  );
}
