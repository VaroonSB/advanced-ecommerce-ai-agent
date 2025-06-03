"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { NLUResponse } from "@/app/api/interpret/route"; // Import the interface
import { sampleProducts, Product, getProductById } from "@/lib/products"; // Import product data
import { useCart } from "@/context/CartContext";

// Dummy product data for POC
// const DUMMY_PRODUCTS = [
//     { id: "1", name: "Classic T-Shirt", category: "Tops", color: "White", price: 19.99 },
//     { id: "2", name: "Slim Fit Jeans", category: "Bottoms", color: "Blue", price: 49.99 },
//     { id: "3", name: "Running Sneakers", category: "Shoes", color: "Red", price: 79.99 },
//     { id: "4", name: "Summer Dress", category: "Dresses", color: "Floral", price: 39.99 },
// ];

const AgentChatAdvanced = () => {
  const router = useRouter();
  const pathname = usePathname(); // Get current path

  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userTranscript, setUserTranscript] = useState("");
  const [agentMessage, setAgentMessage] = useState(
    "Hi! Click the mic and speak."
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity: updateCartItemQuantity,
    clearCart: clearCartContext,
    getCartTotal,
    getItemCount,
  } = useCart();
  // Text-to-Speech
  const speak = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          }); // or 'audio/wav' etc.
          // audioChunksRef.current = []; // Clear for next recording

          // Ensure stream tracks are stopped to turn off microphone indicator
          stream.getTracks().forEach((track) => track.stop());

          if (audioBlob.size === 0) {
            setAgentMessage("No audio recorded. Please try again.");
            setIsLoading(false);
            return;
          }
          await processAudio(audioBlob);
        };

        mediaRecorderRef.current.start();
        setIsListening(true);
        setAgentMessage("Listening...");
        setUserTranscript("");
      } catch (err) {
        console.error("Error accessing microphone:", err);
        setAgentMessage(
          "Microphone access denied or error. Please check permissions."
        );
        setIsListening(false);
      }
    } else {
      setAgentMessage("Audio recording not supported by your browser.");
    }
  };

  const stopListening = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      setIsLoading(true); // Indicate processing will start
      setAgentMessage("Processing audio...");
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const getCurrentPageProductId = (): string | null => {
    if (pathname.startsWith("/products/")) {
      const parts = pathname.split("/");
      if (parts.length > 2 && parts[2]) {
        return parts[2]; // e.g., /products/XYZ -> XYZ
      }
    }
    return null;
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsLoading(true);
    setAgentMessage("Transcribing audio...");
    speak("Let me hear that...");

    const formData = new FormData();
    // Whisper API expects a file with a name
    const audioFile = new File([audioBlob], "user_audio.webm", {
      type: audioBlob.type,
    });
    formData.append("audio", audioFile);

    try {
      // 1. Transcribe audio
      const transcribeResponse = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json();
        throw new Error(
          errorData.error ||
            `Transcription failed: ${transcribeResponse.statusText}`
        );
      }
      const { transcript } = await transcribeResponse.json();
      setUserTranscript(transcript);
      setAgentMessage(`Heard: "${transcript}". Understanding...`);
      speak(`I heard you say: ${transcript}. Let me think.`);

      // 2. Interpret transcript
      const currentPageProductId = getCurrentPageProductId();
      const interpretResponse = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: transcript,
          current_product_context_id: currentPageProductId,
          productList: sampleProducts, // Pass product list for context
        }),
      });

      if (!interpretResponse.ok) {
        const errorData = await interpretResponse.json();
        throw new Error(
          errorData.error ||
            `Interpretation failed: ${interpretResponse.statusText}`
        );
      }
      const nluResult: NLUResponse = await interpretResponse.json();
      handleNLUResponse(nluResult);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error in processing pipeline:", error);
      setAgentMessage(`Error: ${error.message}. Please try again.`);
      speak(`Sorry, I ran into an issue: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNLUResponse = (nlu: NLUResponse) => {
    let responseMessage = "Okay.";
    console.log("Handling NLU:", nlu);

    // Prioritize specific product ID from NLU, then context, then product name
    const targetProductId = nlu.entities.product_id;
    const targetProductName = nlu.entities.product_name;

    switch (nlu.intent) {
      case "NAVIGATE_TO_PAGE":
        const page = nlu.entities.target_page
          ?.toLowerCase()
          .replace(/\s+/g, "");
        if (page) {
          let path = "/";
          if (["products", "allproducts", "catalog"].includes(page))
            path = "/products";
          else if (["cart", "shoppingcart", "bag"].includes(page))
            path = "/cart";
          else if (["sale", "deals"].includes(page)) path = "/sale";
          else if (["checkout"].includes(page)) path = "/checkout";
          else if (["home", "homepage"].includes(page)) path = "/";

          responseMessage = `Navigating to ${nlu.entities.target_page}.`;
          router.push(path);
        } else {
          responseMessage = "Where would you like to go?";
        }
        break;

      case "SEARCH_PRODUCTS":
        if (nlu.entities.query) {
          responseMessage = `Searching for: ${nlu.entities.query}.`;
          router.push(
            `/products?search=${encodeURIComponent(nlu.entities.query)}`
          );
        } else {
          responseMessage = "What products are you looking for?";
          router.push("/products"); // Default to all products if no query
        }
        break;

      case "VIEW_PRODUCT_DETAILS":
        let foundProduct: Product | undefined = undefined;
        let productIdentifier = "";

        if (nlu.entities.product_id) {
          foundProduct = getProductById(nlu.entities.product_id);
          productIdentifier = `ID ${nlu.entities.product_id}`;
        } else if (nlu.entities.product_name) {
          productIdentifier = nlu.entities.product_name;
          const searchName = nlu.entities.product_name.toLowerCase();
          // Simple name match for POC, can be more sophisticated
          foundProduct = sampleProducts.find((p) =>
            p.name.toLowerCase().includes(searchName)
          );
        } else if (nlu.entities.product_query) {
          // A more general query that implies a single product
          productIdentifier = nlu.entities.product_query;
          const searchQuery = nlu.entities.product_query.toLowerCase();
          foundProduct = sampleProducts.find(
            (p) =>
              p.name.toLowerCase().includes(searchQuery) ||
              p.category.toLowerCase().includes(searchQuery)
          );
        }

        if (foundProduct) {
          responseMessage = `Showing details for ${foundProduct.name}.`;
          router.push(`/products/${foundProduct.id}`);
        } else if (productIdentifier) {
          responseMessage = `I couldn't find a specific product matching "${productIdentifier}". I'll take you to the search results.`;
          // Fallback to search if specific product not found by name/ID
          router.push(
            `/products?search=${encodeURIComponent(productIdentifier)}`
          );
        } else {
          responseMessage =
            "Which product are you interested in? I can take you to the main products page.";
          router.push("/products");
        }
        break;

      // ADD_TO_CART and GREETING, UNKNOWN intents remain similar to before
      // You'll want to update ADD_TO_CART to use `sampleProducts` from `lib/products.ts`
      // if you remove the DUMMY_PRODUCTS from this component.

      case "ADD_TO_CART":
        const quantityToAdd = nlu.entities.quantity || 1;
        let productToAddMsg = "";

        if (targetProductId) {
          const product = getProductById(targetProductId);
          if (product)
            productToAddMsg = addToCart(targetProductId, quantityToAdd);
          else
            productToAddMsg = `Product with ID ${targetProductId} not found.`;
        } else if (targetProductName) {
          const foundProduct = sampleProducts.find((p) =>
            p.name.toLowerCase().includes(targetProductName!.toLowerCase())
          );
          if (foundProduct)
            productToAddMsg = addToCart(foundProduct.id, quantityToAdd);
          else
            productToAddMsg = `Could not find a product named "${targetProductName}" to add.`;
        } else {
          productToAddMsg =
            "Please specify which product to add or go to a product page and say 'add this'.";
        }
        responseMessage = productToAddMsg;
        break;

      case "REMOVE_FROM_CART":
        let productToRemoveMsg = "";
        if (targetProductId) {
          productToRemoveMsg = removeFromCart(targetProductId);
        } else if (targetProductName) {
          const foundProduct = cart.find((p) =>
            p.name.toLowerCase().includes(targetProductName!.toLowerCase())
          ); // Search in cart
          if (foundProduct)
            productToRemoveMsg = removeFromCart(foundProduct.id);
          else
            productToRemoveMsg = `Could not find "${targetProductName}" in your cart.`;
        } else {
          productToRemoveMsg = "Please specify which product to remove.";
        }
        responseMessage = productToRemoveMsg;
        break;

      case "UPDATE_CART_QUANTITY":
        const newQuantity = nlu.entities.quantity;
        let updateMsg = "";
        if (typeof newQuantity !== "number" || newQuantity < 0) {
          updateMsg = "Please specify a valid new quantity.";
        } else if (targetProductId) {
          updateMsg = updateCartItemQuantity(targetProductId, newQuantity);
        } else if (targetProductName) {
          const foundProduct = cart.find((p) =>
            p.name.toLowerCase().includes(targetProductName!.toLowerCase())
          );
          if (foundProduct)
            updateMsg = updateCartItemQuantity(foundProduct.id, newQuantity);
          else
            updateMsg = `Could not find "${targetProductName}" in your cart to update.`;
        } else {
          updateMsg = "Please specify which product's quantity to update.";
        }
        responseMessage = updateMsg;
        break;

      case "VIEW_CART":
        if (cart.length === 0) {
          responseMessage = "Your cart is empty.";
        } else {
          const itemCount = getItemCount();
          const cartTotal = getCartTotal();
          responseMessage = `You have ${itemCount} item${
            itemCount === 1 ? "" : "s"
          } in your cart, totaling $${cartTotal.toFixed(
            2
          )}. I'm taking you to the cart page.`;
        }
        router.push("/cart");
        break;

      case "CLEAR_CART":
        responseMessage = clearCartContext();
        break;

      case "GREETING":
        responseMessage = "Hello! How can I help you shop today?";
        break;

      case "UNKNOWN":
      default:
        responseMessage = `I'm not sure how to handle: "${
          nlu.raw_text || "that"
        }". Try "show me t-shirts" or "go to cart".`;
        if (nlu.error) responseMessage += ` (Debug: ${nlu.error})`;
        if (
          nlu.groq_response &&
          (nlu.groq_response.includes("rate limit") ||
            nlu.groq_response.includes("quota"))
        ) {
          responseMessage =
            "It seems I've hit my usage limit for now. Please try again later.";
        }
        break;
    }
    setAgentMessage(responseMessage);
    speak(responseMessage);
  };

  // Display cart for POC
  // const displayCart = () => {
  //   if (cart.length === 0)
  //     return <p className="text-xs text-gray-500 mt-1">Cart is empty.</p>;
  //   return (
  //     <div className="text-xs text-gray-500 mt-1">
  //       <strong>Cart:</strong>
  //       {cart.map((item) => (
  //         <div key={item.id}>
  //           {item.quantity}x {item.name} ($
  //           {(item.price * item.quantity).toFixed(2)})
  //         </div>
  //       ))}
  //       Total: $
  //       {cart
  //         .reduce((sum, item) => sum + item.price * item.quantity, 0)
  //         .toFixed(2)}
  //     </div>
  //   );
  // };
  const displayCartSummaryInAgent = () => {
    if (cart.length === 0) return null; // Don't show if empty
    return (
      <div className="text-xs text-gray-500 mt-1 border-t pt-1">
        <strong>Cart Summary:</strong> {getItemCount()} items, Total: $
        {getCartTotal().toFixed(2)}
      </div>
    );
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-xl border border-gray-200 w-96 z-50">
      <div className="mb-2">
        <h3 className="font-semibold text-lg">AI Agent (Advanced)</h3>
        <p className="text-sm text-gray-600 min-h-[40px] break-words">
          {agentMessage}
        </p>
      </div>
      {userTranscript && (
        <p className="text-xs text-gray-500 mb-2 italic">
          You said: {userTranscript}
        </p>
      )}
      {/* {displayCart()} */}
      {displayCartSummaryInAgent()}
      <button
        onClick={toggleListening}
        disabled={isLoading}
        className={`w-full mt-2 py-2 px-4 rounded font-semibold text-white transition-colors
          ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : isListening
              ? "bg-red-500 hover:bg-red-600"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
      >
        {isLoading
          ? "Processing..."
          : isListening
          ? "Stop Listening"
          : "Speak (Click Mic)"}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 inline-block ml-2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
          />
        </svg>
      </button>
    </div>
  );
};

export default AgentChatAdvanced;
