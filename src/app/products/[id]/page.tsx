// app/products/[id]/page.tsx
import { ProductDetails } from "@/components/ProductDetails";

type PageProps = {
  params: { id: string };
};

export default function ProductDetailPage({ params }: PageProps) {
  const productId = params.id;
  return <ProductDetails productId={productId} />;
}
