import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { Product } from "@/lib/products";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Same system prompt as before, adjust if needed for the specific Groq model
const SYSTEM_PROMPT = `
You are an AI assistant for an e-commerce clothing website.
Your goal is to understand user requests and map them to predefined actions and extract relevant entities.
The user's message will be provided, and if they are on a specific product page, that context (product ID) will be included within their message.

Respond ONLY with a JSON object containing "intent" and "entities". Do not add any explanatory text before or after the JSON.

Available intents and their entities:
- ADD_TO_CART: Add item(s) to the shopping cart.
  - entities:
    - product_id: (string) The ID of the product to add. If the user's message includes a context like "Context: The user is currently viewing product with ID 'XYZ'" and their utterance is "add this", use 'XYZ' as the product_id.
    - product_name: (string, optional) The name of the product. Prioritize product_id if available from context or explicit mention.
    - quantity: (number, default 1) Number of items to add.
- NAVIGATE_TO_PAGE: Go to a general page.
  - entities: target_page (string, e.g., "home", "products", "cart")
- VIEW_PRODUCT_DETAILS: Show details for a specific product.
  - entities: product_name (string), product_id (string), product_query (string, if name/id is vague)
- SEARCH_PRODUCTS: Find products based on a general query.
  - entities: query (string)
- REMOVE_FROM_CART: Remove item(s) from the cart.
  - entities: product_id (string), product_name (string, optional), quantity (number, optional, default all)
- UPDATE_CART_QUANTITY: Change the quantity of an item already in the cart.
  - entities: product_id (string), product_name (string, optional), quantity (number, new target quantity)
- VIEW_CART: Show the contents of the shopping cart (navigates to cart page or displays summary).
  - entities: {}
- CLEAR_CART: Empty the shopping cart.
  - entities: {}
- GREETING: Simple greetings.
  - entities: {}
- UNKNOWN: If the request cannot be understood.
  - entities: {}

Examples of how to process the user message which includes their utterance and context: (IDs mentioned in context are examples only. Don't use them literally.)

1. User Message to you: "User's utterance: "Add classic cotton t-shirt to my bag". Context: No specific product page context."
   Your JSON Output: {"intent": "ADD_TO_CART", "entities": {"product_name": "classic cotton t-shirt", "quantity": 1}}

2. User Message to you: "User's utterance: "Add 2 of product ID 3 to cart". Context: No specific product page context."
   Your JSON Output: {"intent": "ADD_TO_CART", "entities": {"product_id": "3", "quantity": 2}}

3. User Message to you: "User's utterance: "Add this to cart". Context: The user is currently viewing product with ID 'XYZ'."
   Your JSON Output: {"intent": "ADD_TO_CART", "entities": {"product_id": "XYZ", "quantity": 1}}

4. User Message to you: "User's utterance: "Add two of these". Context: The user is currently viewing product with ID 'P987'."
   Your JSON Output: {"intent": "ADD_TO_CART", "entities": {"product_id": "P987", "quantity": 2}}

5. User Message to you: "User's utterance: "Add the blue sneakers to my cart". Context: The user is currently viewing product with ID 'XYZ'."
   (User explicitly names a different product, so ignore the context ID 'XYZ' for the product_id entity here)
   Your JSON Output: {"intent": "ADD_TO_CART", "entities": {"product_name": "blue sneakers", "quantity": 1}}

6. User Message to you: "User's utterance: "Remove this from my bag". Context: The user is currently viewing product with ID 'ABC' (on PDP) OR this item 'ABC' is highlighted in the cart."
   Your JSON Output: {"intent": "REMOVE_FROM_CART", "entities": {"product_id": "ABC"}}

7. User Message to you: "User's utterance: "Show my shopping bag". Context: No specific product page context."
   Your JSON Output: {"intent": "VIEW_CART", "entities": {}}
`;

export interface NLUResponse {
  intent: string;
  entities: {
    target_page?: string;
    query?: string;
    product_name?: string;
    product_id?: string; // This should be the primary field for LLM to populate for adds
    quantity?: number;
    // context_product_id?: string; // For actions related to the current page's product
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  raw_text?: string;
  error?: string;
  groq_response?: string;
}

export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "Groq API key not configured." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const userText = body.text;

    const currentProductContextId: string | null =
      body.current_product_context_id || null;

    const productList = body.product_list || [];

    if (!userText) {
      return NextResponse.json(
        { error: "No text provided for interpretation." },
        { status: 400 }
      );
    }

    console.log(
      "Groq NLU received text:",
      userText,
      "Context ID:",
      currentProductContextId
    );

    let llmUserMessage = userText;
    // Construct a user message that explicitly includes the context ID if available
    if (currentProductContextId) {
      llmUserMessage = `User's utterance: "${userText}". Context: The user is currently viewing product with ID '${currentProductContextId}'.`;
    }

    // Using Groq SDK for chat completions
    const completion = await groq.chat.completions.create({
      // Pick a model available on Groq. Llama 3 8B is a good fast choice.
      // Other options: 'mixtral-8x7b-32768', 'gemma-7b-it'
      model: "llama3-8b-8192",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: llmUserMessage },
      ],
      temperature: 0.2, // Low temperature for deterministic NLU
      // Groq (especially with Llama 3) generally supports JSON mode well.
      response_format: { type: "json_object" },
    });

    const result = completion.choices[0]?.message?.content;
    console.log("Groq LLM NLU Raw Response:", result);

    if (!result) {
      throw new Error("No content in Groq LLM response");
    }

    try {
      const parsedResult: NLUResponse = JSON.parse(result);
      if (!parsedResult.entities.product_id) {
        parsedResult.entities.product_id = productList.find(
          (product: Product) =>
            product.name.toLowerCase() ===
            (parsedResult.entities.product_name || "").toLowerCase()
        )?.id;
      }
      parsedResult.raw_text = userText;
      console.log("Groq LLM NLU Parsed:", parsedResult);
      return NextResponse.json(parsedResult);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (jsonError: any) {
      console.error(
        "Error parsing Groq LLM JSON response:",
        jsonError.message,
        "Raw response:",
        result
      );
      return NextResponse.json(
        {
          intent: "UNKNOWN",
          entities: {},
          raw_text: userText,
          error: "Failed to parse NLU response as JSON",
          groq_response: result, // Send back Groq's actual output for debugging
        },
        { status: 200 }
      ); // Still a 200, but with an error flag in the payload
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(
      "Error interpreting text with Groq:",
      error.response?.data || error.message || error
    );
    let errorMessage = "Failed to interpret text with Groq";
    if (error instanceof Groq.APIError) {
      errorMessage = `Groq API Error: ${error.status} ${error.name} ${error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: 500 }
    );
  }
}
