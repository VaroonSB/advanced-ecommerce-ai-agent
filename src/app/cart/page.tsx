"use client";

import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  if (cart.length === 0) {
    return (
      <div className="text-center py-10">
        <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
        <p className="text-gray-600 mb-6">Looks like you haven`t added anything to your cart yet.</p>
        <Link href="/products" className="bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Your Shopping Cart</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {cart.map((item) => (
            <div key={item.id} className="flex items-center border-b py-4 last:border-b-0">
              <div className="relative w-24 h-24 mr-4 flex-shrink-0">
                <Image src={item.imageUrl} alt={item.name} fill style={{objectFit:"contain"}} className="rounded"/>
              </div>
              <div className="flex-grow">
                <Link href={`/products/${item.id}`} className="text-lg font-semibold hover:text-blue-600">{item.name}</Link>
                <p className="text-sm text-gray-500">{item.category}</p>
                <p className="text-md font-medium">${item.price.toFixed(2)}</p>
              </div>
              <div className="flex flex-col items-end ml-4">
                <div className="flex items-center mb-2">
                  <label htmlFor={`quantity-${item.id}`} className="sr-only">Quantity</label>
                  <input
                    type="number"
                    id={`quantity-${item.id}`}
                    min="1"
                    max={item.stock}
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.id, Math.max(1, Math.min(item.stock, parseInt(e.target.value) || 1)))}
                    className="w-16 p-1 border border-gray-300 rounded-md text-center"
                  />
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 text-sm">
                  Remove
                </button>
              </div>
              <div className="text-lg font-semibold w-24 text-right ml-4">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        <div className="md:col-span-1 bg-gray-50 p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Order Summary</h2>
          <div className="flex justify-between mb-2">
            <span>Subtotal</span>
            <span>${getCartTotal().toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Shipping</span>
            <span className="text-green-600">FREE</span> {/* Or calculate shipping */}
          </div>
          <hr className="my-2"/>
          <div className="flex justify-between font-bold text-xl mb-6">
            <span>Total</span>
            <span>${getCartTotal().toFixed(2)}</span>
          </div>
          <button 
            // onClick={() => router.push('/checkout')} // Link to checkout
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Proceed to Checkout
          </button>
          <button 
            onClick={() => clearCart()} 
            className="w-full mt-3 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition text-sm"
          >
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
}