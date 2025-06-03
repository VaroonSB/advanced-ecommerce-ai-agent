import { ProductDetails } from "@/components/ProductDetails";
import { sampleProducts } from "@/lib/products"; // Adjust path

// Optional: For static generation if you want to pre-render PDPs
export async function generateStaticParams() {
  return sampleProducts.map((product) => ({
    id: product.id,
  }));
}

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Get ID from URL
  const productId = typeof params.id === "string" ? params.id : undefined;

  return <ProductDetails productId={productId || ""} />; // Pass ID to ProductDetails component
}
