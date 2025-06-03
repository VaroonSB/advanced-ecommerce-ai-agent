export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  imageUrl: string; // Using placeholder images
  colors: string[];
  sizes: string[];
  stock: number;
}

export const sampleProducts: Product[] = [
  {
    id: "1",
    name: "Classic Cotton T-Shirt",
    category: "Tops",
    description: "A timeless classic, this 100% cotton t-shirt offers comfort and style. Perfect for everyday wear.",
    price: 19.99,
    imageUrl: "https://images.pexels.com/photos/1002640/pexels-photo-1002640.jpeg",
    colors: ["White", "Black", "Navy"],
    sizes: ["S", "M", "L", "XL"],
    stock: 150,
  },
  {
    id: "2",
    name: "Slim Fit Denim Jeans",
    category: "Bottoms",
    description: "Modern slim fit jeans crafted from durable denim with a hint of stretch for all-day comfort.",
    price: 49.99,
    imageUrl: "https://images.pexels.com/photos/2983464/pexels-photo-2983464.jpeg",
    colors: ["Blue Wash", "Black", "Gray"],
    sizes: ["28", "30", "32", "34", "36"],
    stock: 80,
  },
  {
    id: "3",
    name: "Lightweight Running Sneakers",
    category: "Shoes",
    description: "Breathable and lightweight sneakers designed for running and workouts. Features a cushioned sole.",
    price: 79.99,
    imageUrl: "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg",
    colors: ["Red/Black", "Blue/White", "All Black"],
    sizes: ["8", "9", "10", "11", "12"],
    stock: 60,
  },
  {
    id: "4",
    name: "Floral Print Summer Dress",
    category: "Dresses",
    description: "A beautiful and breezy summer dress with a vibrant floral print. Ideal for sunny days.",
    price: 39.99,
    imageUrl: "https://images.pexels.com/photos/1542085/pexels-photo-1542085.jpeg",
    colors: ["Pink Floral", "Blue Floral"],
    sizes: ["XS", "S", "M", "L"],
    stock: 45,
  },
  {
    id: "5",
    name: "Cozy Wool Blend Sweater",
    category: "Knitwear",
    description: "Stay warm with this soft wool blend sweater, perfect for chilly evenings.",
    price: 59.99,
    imageUrl: "https://images.pexels.com/photos/3748221/pexels-photo-3748221.jpeg",
    colors: ["Cream", "Charcoal", "Forest Green"],
    sizes: ["S", "M", "L"],
    stock: 70,
  },
  {
    id: "6",
    name: "Water-Resistant Windbreaker Jacket",
    category: "Outerwear",
    description: "A light and packable windbreaker jacket offering protection from wind and light rain.",
    price: 69.99,
    imageUrl: "https://images.pexels.com/photos/6311397/pexels-photo-6311397.jpeg",
    colors: ["Navy", "Olive", "Black"],
    sizes: ["M", "L", "XL"],
    stock: 55,
  },
  {
    id: "7",
    name: "Leather Crossbody Bag",
    category: "Accessories",
    description: "A stylish and practical leather crossbody bag with multiple compartments.",
    price: 89.00,
    imageUrl: "https://images.pexels.com/photos/322207/pexels-photo-322207.jpeg",
    colors: ["Black", "Brown", "Tan"],
    sizes: ["One Size"],
    stock: 30,
  },
  {
    id: "8",
    name: "Silk Scarf with Abstract Print",
    category: "Accessories",
    description: "Luxurious silk scarf featuring a unique abstract print. Adds a touch of elegance to any outfit.",
    price: 34.50,
    imageUrl: "https://images.pexels.com/photos/1030895/pexels-photo-1030895.jpeg",
    colors: ["Multicolor Blue", "Multicolor Red"],
    sizes: ["One Size"],
    stock: 40,
  },
  {
    id: "9",
    name: "Men's Business Casual Shirt",
    category: "Shirts",
    description: "A crisp cotton shirt perfect for business casual settings or smart everyday wear.",
    price: 44.95,
    imageUrl: "https://images.pexels.com/photos/3775535/pexels-photo-3775535.jpeg",
    colors: ["Light Blue", "White", "Patterned"],
    sizes: ["S", "M", "L", "XL"],
    stock: 90,
  },
  {
    id: "10",
    name: "High-Waisted Yoga Pants",
    category: "Activewear",
    description: "Comfortable and supportive high-waisted yoga pants with a four-way stretch fabric.",
    price: 30.00,
    imageUrl: "https://images.pexels.com/photos/3823039/pexels-photo-3823039.jpeg",
    colors: ["Black", "Teal", "Maroon"],
    sizes: ["XS", "S", "M", "L"],
    stock: 110,
  },
];



// Helper function to get all products (can be expanded for filtering/searching)
export const getProducts = (query?: string): Product[] => {
  if (!query) {
    return sampleProducts;
  }
  const lowerQuery = query.toLowerCase();
  return sampleProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(lowerQuery) ||
      product.category.toLowerCase().includes(lowerQuery) ||
      product.description.toLowerCase().includes(lowerQuery)
  );
};

// Helper function to get a single product by ID
export const getProductById = (id: string): Product | undefined => {
  return sampleProducts.find((product) => product.id === id);
};