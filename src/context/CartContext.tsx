"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product, getProductById } from '@/lib/products'; // Assuming Product interface is here

export interface CartItem extends Product { // Or just store necessary fields
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (productId: string, quantity?: number) => string; // Returns a message
  removeFromCart: (productId: string) => string;
  updateQuantity: (productId: string, newQuantity: number) => string;
  clearCart: () => string;
  getCartTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    // Load cart from localStorage if available (for persistence across refreshes in POC)
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('ecommerceCart');
      return savedCart ? JSON.parse(savedCart) : [];
    }
    return [];
  });

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    if (typeof window !== 'undefined') {
      localStorage.setItem('ecommerceCart', JSON.stringify(cart));
    }
  }, [cart]);

  const addToCart = (productId: string, quantity: number = 1): string => {
    const product = getProductById(productId);
    if (!product) return `Product with ID ${productId} not found.`;
    if (product.stock < quantity) return `Not enough stock for ${product.name}. Only ${product.stock} available.`;

    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex((item) => item.id === productId);
      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        const newQuantity = updatedCart[existingItemIndex].quantity + quantity;
        if (newQuantity > product.stock) {
          // Don't update, message will be handled by caller based on return
          // This logic could be improved to cap at stock. For now, simple check.
          return prevCart; // Or cap quantity here: updatedCart[existingItemIndex].quantity = product.stock;
        }
        updatedCart[existingItemIndex].quantity = newQuantity;
        return updatedCart;
      } else {
        return [...prevCart, { ...product, quantity }];
      }
    });
    // Re-check after potential update
    const currentItemInCart = cart.find(item => item.id === productId);
    const finalQuantity = currentItemInCart ? currentItemInCart.quantity + (currentItemInCart.id === productId ? 0 : quantity) : quantity;

    if(finalQuantity > product.stock && cart.find(item => item.id === productId)) { // if item was already in cart and new qty exceeds stock
        return `Cannot add ${quantity} more of ${product.name}. You already have ${cart.find(item => item.id === productId)?.quantity}. Only ${product.stock} total available.`;
    }
    return `Added ${quantity} x ${product.name} to cart.`;
  };

  const removeFromCart = (productId: string): string => {
    const product = getProductById(productId);
    const productName = product ? product.name : `product ID ${productId}`;
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
    return `Removed ${productName} from cart.`;
  };

  const updateQuantity = (productId: string, newQuantity: number): string => {
    const product = getProductById(productId);
    if (!product) return `Product with ID ${productId} not found.`;

    if (newQuantity <= 0) {
      return removeFromCart(productId);
    }
    if (newQuantity > product.stock) {
        return `Cannot set quantity to ${newQuantity} for ${product.name}. Only ${product.stock} available.`;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
    return `Updated ${product.name} quantity to ${newQuantity}.`;
  };

  const clearCart = (): string => {
    setCart([]);
    return "Cart cleared.";
  };

  const getCartTotal = (): number => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getItemCount = (): number => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getItemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};