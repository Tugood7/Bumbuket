import { MessageCircle } from "lucide-react";
import { buildWhatsAppUrl, STORE_INFO } from "@bumbuket/shared";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { Footer } from "@/components/storefront/footer";
import { Navbar } from "@/components/storefront/navbar";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const floatingWaUrl = buildWhatsAppUrl(
    `Halo Kak admin ${STORE_INFO.name}! Saya ingin konsultasi / custom buket.`
  );

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />

      <a
        href={floatingWaUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat WhatsApp Bumbuket.pku"
        className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-emerald-700"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden sm:inline">Tanya via WA</span>
      </a>
    </>
  );
}

