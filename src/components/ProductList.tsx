"use client";

import { useCart } from "@/context/CartContext";
import { getProducts } from "@/lib/products";
import Link from "next/link";
import Image from "next/image";

export const ProductList = () => {
  const products = getProducts(undefined);
  const searchQuery = ""; // Placeholder for search query, can be replaced with actual search logic

  const { addToCart } = useCart();

  const handleAddToCart = (productId: string, productName: string) => {
    console.log("add to cart - product name: ", productName);

    const message = addToCart(productId, 1);
    alert(message); // Simple feedback for POC. Agent can also give feedback.
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        {searchQuery ? `Search Results for "${searchQuery}"` : "Our Products"}
      </h1>
      {products.length === 0 ? (
        <p>
          No products found {searchQuery ? `matching "${searchQuery}"` : ""}.
          Try a different search or view all products.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="border rounded-lg overflow-hidden shadow-lg group flex flex-col"
            >
              <Link
                href={`/products/${product.id}`}
                key={product.id}
                className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out group"
              >
                <div className="relative w-full h-64 md:h-72">
                  {" "}
                  {/* Fixed height container for image */}
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill // Replaces layout="fill"
                    style={{ objectFit: "cover" }} // Equivalent to objectFit="cover"
                    className="group-hover:scale-105 transition-transform duration-300 ease-in-out"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" // Basic responsive sizes
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-semibold truncate group-hover:text-blue-600">
                    {product.name}
                  </h2>
                  <p className="text-sm text-gray-600">{product.category}</p>
                  <p className="text-lg font-bold mt-2">
                    ${product.price.toFixed(2)}
                  </p>
                </div>
              </Link>
              <div className="p-4 mt-auto">
                {" "}
                {/* Button at the bottom */}
                <button
                  onClick={() => handleAddToCart(product.id, product.name)}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition disabled:bg-gray-300"
                  disabled={product.stock === 0}
                >
                  {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
