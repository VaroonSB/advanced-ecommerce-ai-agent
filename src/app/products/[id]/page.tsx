// app/products/[id]/page.tsx
import { ProductDetails } from "@/components/ProductDetails";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ProductDetailPage({ params }: any) {
  const productId = params.id;
  return <ProductDetails productId={productId} />;
}
