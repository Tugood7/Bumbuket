import Link from "next/link";
import { Flower2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StorefrontNotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-blush text-brand-rose">
        <Flower2 className="h-8 w-8" />
      </div>
      <h1 className="mt-5 font-serif text-3xl font-bold text-foreground">
        Buket Tidak Ditemukan
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Maaf, halaman atau buket yang Anda cari mungkin sudah terjual atau
        dipindahkan.
      </p>
      <Link href="/catalog" className="mt-6">
        <Button>Kembali ke Katalog</Button>
      </Link>
    </div>
  );
}

