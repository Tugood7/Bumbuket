export type UserRole = "customer" | "admin";

export type ProductAvailability = "ready_stock" | "pre_order";

export type FulfillmentMethod = "pickup_store" | "instant_courier";

export type CourierProvider = "gojek" | "maxim" | "grab";

export type CheckoutChannel = "midtrans" | "bank_transfer" | "whatsapp";

export type PaymentPlan = "full" | "dp";

export type PaymentStatus =
  | "unpaid"
  | "pending"
  | "dp_paid"
  | "paid"
  | "failed"
  | "expired"
  | "refunded";

export type OrderStatus =
  | "pending_payment"
  | "processing"
  | "arranging"
  | "ready"
  | "completed"
  | "cancelled";

export type MoneyBouquetCashPaymentMode =
  | "included_in_checkout"
  | "separate_via_whatsapp";

export interface WrappingColor {
  name: string;
  hex: string;
}

export interface MoneyBouquetDetails {
  sheet_count: number;
  denomination: number;
  crafting_fee: number;
  cash_amount: number;
  cash_payment_mode: MoneyBouquetCashPaymentMode;
  include_foil_balloon: boolean;
  request_new_notes: boolean;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_special_catalog: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  availability_type: ProductAvailability;
  lead_time_days: number;
  stock_quantity: number;
  images: string[];
  available_wrapping_colors: WrappingColor[];
  is_customizable: boolean;
  is_money_bouquet: boolean;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price_adjustment: number;
  stock_quantity: number;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductWithRelations extends Product {
  category?: Category | null;
  variants: ProductVariant[];
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  fulfillment_method: FulfillmentMethod;
  courier_provider: CourierProvider | null;
  shipping_paid_separately: boolean;
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time_slot: string; // e.g. "09:00-11:00"
  recipient_name: string | null;
  recipient_phone: string | null;
  delivery_address: string | null;
  delivery_district: string | null;
  delivery_notes: string | null;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total_amount: number;
  checkout_channel: CheckoutChannel;
  payment_plan?: PaymentPlan;
  dp_amount?: number;
  remaining_amount?: number;
  payment_status: PaymentStatus;
  payment_method: string | null;
  payment_expires_at: string | null;
  payment_proof_url?: string | null;
  payment_proof_uploaded_at?: string | null;
  midtrans_order_id: string | null;
  midtrans_snap_token: string | null;
  midtrans_transaction_id: string | null;
  paid_at: string | null;
  order_status: OrderStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  product_image_url: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
  wrapping_color: string | null;
  greeting_card_text: string | null;
  custom_notes: string | null;
  money_bouquet_details: MoneyBouquetDetails | null;
  created_at: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface CartItem {
  /** Unique client key gabungan productId + variantId + kustomisasi */
  cartKey: string;
  productId: string;
  productSlug: string;
  productName: string;
  productImageUrl: string | null;
  availabilityType: ProductAvailability;
  leadTimeDays: number;
  isMoneyBouquet: boolean;
  variantId: string | null;
  variantName: string | null;
  unitPrice: number;
  quantity: number;
  wrappingColor: string | null;
  greetingCardText: string | null;
  customNotes: string | null;
  moneyBouquetDetails: MoneyBouquetDetails | null;
}

