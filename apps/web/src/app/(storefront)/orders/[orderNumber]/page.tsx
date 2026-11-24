import { getOrderByNumber } from "@/lib/data/orders";
import { OrderTracker } from "@/components/storefront/order-tracker";

interface OrderTrackingPageProps {
  params: Promise<{ orderNumber: string }>;
}

export async function generateMetadata({ params }: OrderTrackingPageProps) {
  const { orderNumber } = await params;
  return {
    title: `Pesanan ${orderNumber}`,
  };
}

export default async function OrderTrackingPage({
  params,
}: OrderTrackingPageProps) {
  const { orderNumber } = await params;
  const order = await getOrderByNumber(orderNumber);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <OrderTracker orderNumber={orderNumber} initialOrder={order} />
    </div>
  );
}
