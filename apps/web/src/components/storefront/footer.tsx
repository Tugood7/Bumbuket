import Link from "next/link";
import { Clock, Instagram, MapPin, MessageCircle } from "lucide-react";
import {
  buildWhatsAppUrl,
  STORE_HOURS_SUMMARY,
  STORE_INFO,
} from "@bumbuket/shared";

export function Footer() {
  const waHref = buildWhatsAppUrl(
    `Halo Kak admin ${STORE_INFO.name}! Saya ingin tanya tentang katalog buket di Pekanbaru.`
  );

  return (
    <footer className="mt-20 border-t border-pink-100 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blush font-serif text-xl font-bold text-brand-rose">
              B
            </span>
            <div>
              <p className="font-serif text-lg font-bold text-brand-rose">
                {STORE_INFO.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {STORE_INFO.tagline}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Buket bunga artifisial, Money Bouquet, buket wisuda, Hari Guru, dan
            custom bouquet elegan di Pekanbaru. Bisa ambil di toko atau kirim
            kurir instan (Gojek, Maxim, Grab).
          </p>
          <div className="mt-4 flex items-center gap-3">
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {STORE_INFO.whatsappDisplay}
            </a>
            <a
              href={STORE_INFO.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-blush px-3.5 py-1.5 text-xs font-semibold text-brand-rose hover:bg-pink-200/70"
            >
              <Instagram className="h-3.5 w-3.5" />
              {STORE_INFO.instagramHandle}
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-serif text-base font-semibold text-brand-rose">
            Lokasi & Pengiriman Pekanbaru
          </h3>
          <div className="mt-3 flex items-start gap-2.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-pink" />
            <div>
              <p>{STORE_INFO.address}</p>
              <a
                href={STORE_INFO.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs font-semibold text-brand-rose hover:underline"
              >
                Buka Google Maps: {STORE_INFO.googleMapsLabel} →
              </a>
            </div>
          </div>
          <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Jam Operasional:</p>
            {STORE_HOURS_SUMMARY.map((row) => (
              <div key={row.days} className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-brand-pink" />
                <span>
                  <strong>{row.days}:</strong> {row.hours}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-serif text-base font-semibold text-brand-rose">
            Kategori Populer
          </h3>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <li>
              <Link
                href="/catalog?availability=ready_stock"
                className="hover:text-brand-rose"
              >
                Ready Stock
              </Link>
            </li>
            <li>
              <Link href="/catalog?category=lily" className="hover:text-brand-rose">
                Lily Bouquet
              </Link>
            </li>
            <li>
              <Link
                href="/catalog?category=mix-flower"
                className="hover:text-brand-rose"
              >
                Mix Flower
              </Link>
            </li>
            <li>
              <Link
                href="/catalog?category=money-bouquet"
                className="hover:text-brand-rose"
              >
                Money Bouquet
              </Link>
            </li>
            <li>
              <Link
                href="/catalog?category=boneka"
                className="hover:text-brand-rose"
              >
                Buket Boneka
              </Link>
            </li>
            <li>
              <Link
                href="/catalog?category=katalog-spesial"
                className="hover:text-brand-rose"
              >
                Wisuda & Hari Guru
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-pink-100 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {STORE_INFO.name} — Marpoyan Damai, Kota
        Pekanbaru.
      </div>
    </footer>
  );
}

