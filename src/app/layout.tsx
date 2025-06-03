import "./globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // We'll create this next
import AgentChatAdvanced from "@/components/AgentChatAdvanced"; // Changed import
import Link from "next/link";
import { CartProvider } from "@/context/CartContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI E-commerce Agent POC",
  description: "Speech-controlled e-commerce site",
}; // ... other imports

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <header className="bg-gray-800 text-white p-4">
            <nav className="container mx-auto flex justify-between">
              <Link href="/" className="text-xl font-bold">
                MyStore
              </Link>
              <div>
                <Link href="/products" className="px-3 hover:text-gray-300">
                  Products
                </Link>
                <Link href="/sale" className="px-3 hover:text-gray-300">
                  Sale
                </Link>
                <Link href="/cart" className="px-3 hover:text-gray-300">
                  Cart
                </Link>
              </div>
            </nav>
          </header>
          <main className="container mx-auto p-4">{children}</main>
          <AgentChatAdvanced /> {/* Use the advanced component */}
          <footer className="bg-gray-200 text-center p-4 mt-8">
            © 2024 MyStore
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
