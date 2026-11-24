import type { CourierProvider, FulfillmentMethod } from "../types/domain";

export const FULFILLMENT_METHOD_OPTIONS: Record<
  FulfillmentMethod,
  {
    value: FulfillmentMethod;
    label: string;
    shortLabel: string;
    description: string;
  }
> = {
  pickup_store: {
    value: "pickup_store",
    label: "Ambil di Toko (Marpoyan Damai)",
    shortLabel: "Ambil di Toko",
    description:
      "Gratis ongkir. Ambil langsung di Jl. Pahlawan Kerja, Perhentian Marpoyan, Marpoyan Damai, Pekanbaru.",
  },
  instant_courier: {
    value: "instant_courier",
    label: "Kirim Kurir Instan (Area Pekanbaru)",
    shortLabel: "Kurir Instan Pekanbaru",
    description:
      "Dikirim via Gojek, Maxim, atau Grab. Ongkir mengikuti tarif aplikasi dan dibayar terpisah.",
  },
};

export const COURIER_PROVIDER_OPTIONS: Record<
  CourierProvider,
  {
    value: CourierProvider;
    label: string;
    serviceName: string;
    note: string;
  }
> = {
  gojek: {
    value: "gojek",
    label: "Gojek",
    serviceName: "GoSend / GoCar Instant",
    note: "Ongkir sesuai aplikasi Gojek (dibayar terpisah).",
  },
  maxim: {
    value: "maxim",
    label: "Maxim",
    serviceName: "Maxim Delivery / Car",
    note: "Ongkir sesuai aplikasi Maxim (dibayar terpisah).",
  },
  grab: {
    value: "grab",
    label: "Grab",
    serviceName: "GrabExpress / GrabCar",
    note: "Ongkir sesuai aplikasi Grab (dibayar terpisah).",
  },
};

export const PEKANBARU_DISTRICTS = [
  "Marpoyan Damai",
  "Bukit Raya",
  "Bina Widya",
  "Tuah Madani",
  "Sukajadi",
  "Pekanbaru Kota",
  "Sail",
  "Lima Puluh",
  "Senapelan",
  "Payung Sekaki",
  "Tenayan Raya",
  "Kulim",
  "Rumbai",
  "Rumbai Barat",
  "Rumbai Timur",
] as const;

export type PekanbaruDistrict = (typeof PEKANBARU_DISTRICTS)[number];

