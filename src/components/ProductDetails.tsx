"use client";

import { useCart } from "@/context/CartContext";
import { getProductById, Product } from "@/lib/products";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";

export const ProductDetails = ({ productId }: { productId: string }) => {
  const [product, setProduct] = useState<Product | null | undefined>(undefined); // undefined for loading state
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    if (productId) {
      const fetchedProduct = getProductById(productId);
      setProduct(fetchedProduct);
      if (!fetchedProduct) {
        // If using client-side notFound, it won't work directly.
        // router.push('/not-found-page') or handle UI. For now, just log.
        console.error("Product not found on client");
      }
    }
  }, [productId]);

  if (product === undefined) return <div>Loading product...</div>; // Loading state
  if (!product) {
    // For a client component, you might redirect or show a "not found" UI.
    // `notFound()` from next/navigation is for Server Components.
    // For simplicity in this POC, we'll just show a message if product remains null.
    return (
      <div>
        Product not found.{" "}
        <Link href="/products" className="text-blue-600">
          Go back to products
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    const message = addToCart(product.id, quantity);
    alert(message); // Simple feedback
    setQuantity(1); // Reset quantity input
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <Link href="/products" className="text-blue-600 hover:underline">
          ← Back to Products
        </Link>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative w-full aspect-[3/4]">
          {" "}
          {/* Aspect ratio for product image */}
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            style={{ objectFit: "cover" }}
            className="rounded-lg shadow-md"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {product.name}
          </h1>
          <p className="text-lg text-gray-600 mb-4">{product.category}</p>
          <p className="text-2xl font-semibold text-green-600 mb-6">
            ${product.price.toFixed(2)}
          </p>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-1">Colors:</h3>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((color) => (
                <span
                  key={color}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm"
                >
                  {color}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-1">Sizes:</h3>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <span
                  key={size}
                  className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm"
                >
                  {size}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="quantity"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Quantity:
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  Math.max(
                    1,
                    Math.min(product.stock, parseInt(e.target.value) || 1)
                  )
                )
              }
              className="w-20 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              disabled={product.stock === 0}
            />
          </div>

          <p className="text-md text-gray-500 mb-4">
            Stock:{" "}
            {product.stock > 0 ? `${product.stock} available` : "Out of Stock"}
          </p>

          <button
            onClick={handleAddToCart}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 disabled:bg-gray-400"
            disabled={product.stock === 0 || quantity > product.stock}
          >
            {product.stock === 0 ? "Out of Stock" : `Add ${quantity} to Cart`}
          </button>
        </div>
      </div>
    </div>
  );
};
