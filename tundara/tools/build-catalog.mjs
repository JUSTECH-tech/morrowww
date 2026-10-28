/**
 * Tundara catalog builder (dev utility).
 * Curates source product data into assets/js/catalog.js
 * Run: node tools/build-catalog.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = JSON.parse(await readFile(join(root, "assets/data/source-products.json"), "utf8"));

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */
const categories = [
  {
    slug: "phones", name: "Phones & Tablets", short: "Phones", icon: "phone",
    blurb: "The latest smartphones and tablets from the brands you trust.",
    image: "assets/img/lifestyle/phone.jpg", accent: "#0e7a5f",
    subs: ["Smartphones", "Tablets"],
  },
  {
    slug: "computers", name: "Computers & Laptops", short: "Computers", icon: "laptop",
    blurb: "Powerful laptops and accessories for work, school and play.",
    image: "assets/img/lifestyle/laptop.jpg", accent: "#3956d8",
    subs: ["Laptops", "Chargers & Power", "Cases & Protection"],
  },
  {
    slug: "electronics", name: "Electronics & Audio", short: "Electronics", icon: "headphones",
    blurb: "Audio, smart speakers and gadgets that keep you connected.",
    image: "assets/img/lifestyle/headphones.jpg", accent: "#7c3aed",
    subs: ["Headphones & Audio", "Smart Speakers", "Accessories"],
  },
  {
    slug: "home", name: "Home & Kitchen", short: "Home", icon: "armchair",
    blurb: "Everything for your kitchen, living room and home office.",
    image: "assets/img/lifestyle/kitchen.jpg", accent: "#b45309",
    subs: ["Cookware", "Kitchen Appliances", "Dining & Serveware", "Home Décor", "Furniture"],
  },
  {
    slug: "fashion", name: "Fashion", short: "Fashion", icon: "shirt",
    blurb: "Fresh fits for men and women, from essentials to statement pieces.",
    image: "assets/img/lifestyle/fashion.jpg", accent: "#db2777",
    subs: ["Women's Clothing", "Men's Clothing", "Women's Shoes", "Men's Shoes", "Bags", "Sunglasses"],
  },
  {
    slug: "beauty", name: "Beauty & Fragrance", short: "Beauty", icon: "sparkles",
    blurb: "Makeup, fragrance and skincare from the brands you love.",
    image: "assets/img/lifestyle/beauty.jpg", accent: "#e11d48",
    subs: ["Makeup", "Fragrance", "Skincare"],
  },
  {
    slug: "groceries", name: "Groceries", short: "Groceries", icon: "basket",
    blurb: "Fresh food and household essentials delivered to your door.",
    image: "assets/img/lifestyle/grocery.jpg", accent: "#15803d",
    subs: ["Fresh Produce", "Pantry", "Meat & Fish", "Dairy & Eggs", "Snacks & Drinks", "Pet Care"],
  },
  {
    slug: "sports", name: "Sports & Outdoors", short: "Sports", icon: "dumbbell",
    blurb: "Gear up for match day, the gym and the great outdoors.",
    image: "assets/img/lifestyle/sneaker.jpg", accent: "#ea580c",
    subs: ["Team Sports", "Rackets & Balls", "Cricket", "Golf"],
  },
  {
    slug: "watches", name: "Watches & Jewellery", short: "Watches", icon: "watch",
    blurb: "Timepieces and jewellery for every occasion.",
    image: "assets/img/lifestyle/watch.jpg", accent: "#0f172a",
    subs: ["Men's Watches", "Women's Watches", "Smartwatches", "Jewellery"],
  },
];

/* ------------------------------------------------------------------ */
/* Source category → storefront mapping                                */
/* ------------------------------------------------------------------ */
const map = {
  smartphones: { category: "phones", subcategory: "Smartphones", gender: "Unisex" },
  tablets: { category: "phones", subcategory: "Tablets", gender: "Unisex" },
  laptops: { category: "computers", subcategory: "Laptops", gender: "Unisex" },
  "mobile-accessories": { category: "electronics", subcategory: "Accessories", gender: "Unisex" },
  "kitchen-accessories": { category: "home", subcategory: "Cookware", gender: "Unisex" },
  "home-decoration": { category: "home", subcategory: "Home Décor", gender: "Unisex" },
  furniture: { category: "home", subcategory: "Furniture", gender: "Unisex" },
  "mens-shirts": { category: "fashion", subcategory: "Men's Clothing", gender: "Men" },
  "mens-shoes": { category: "fashion", subcategory: "Men's Shoes", gender: "Men" },
  "womens-dresses": { category: "fashion", subcategory: "Women's Clothing", gender: "Women" },
  tops: { category: "fashion", subcategory: "Women's Clothing", gender: "Women" },
  "womens-shoes": { category: "fashion", subcategory: "Women's Shoes", gender: "Women" },
  "womens-bags": { category: "fashion", subcategory: "Bags", gender: "Women" },
  sunglasses: { category: "fashion", subcategory: "Sunglasses", gender: "Unisex" },
  beauty: { category: "beauty", subcategory: "Makeup", gender: "Unisex" },
  fragrances: { category: "beauty", subcategory: "Fragrance", gender: "Unisex" },
  "skin-care": { category: "beauty", subcategory: "Skincare", gender: "Unisex" },
  groceries: { category: "groceries", subcategory: "Pantry", gender: "Unisex" },
  "sports-accessories": { category: "sports", subcategory: "Team Sports", gender: "Unisex" },
  "mens-watches": { category: "watches", subcategory: "Men's Watches", gender: "Men" },
  "womens-watches": { category: "watches", subcategory: "Women's Watches", gender: "Women" },
  "womens-jewellery": { category: "watches", subcategory: "Jewellery", gender: "Women" },
};

const EXCLUDED_IDS = new Set([
  112, // TV studio pedestal
  121, 122, // iPhone 5s / 6 (too old)
  131, // Galaxy S7
  191, // duplicate Rolex Cellini Moonphase
]);

const kitchenSub = new Set([51, 56, 61, 66]);
const grocerySub = {
  "Fresh Produce": [16, 21, 25, 26, 30, 31, 33, 35, 37, 40],
  "Meat & Fish": [17, 19, 24],
  "Dairy & Eggs": [23, 28, 32],
  Pantry: [20, 27, 34, 36, 38, 41],
  "Snacks & Drinks": [29, 39, 42],
  "Pet Care": [18, 22],
};
const sportsSub = {
  Cricket: [142, 143, 144, 145],
  Golf: [148, 149],
  "Rackets & Balls": [146, 150, 151, 152, 153],
  "Team Sports": [137, 138, 139, 140, 141, 147],
};
const accessoryMap = {
  99: "Smart Speakers", 100: "Headphones & Audio", 101: "Headphones & Audio",
  102: "Accessories", 103: "Smart Speakers", 104: "Accessories",
  105: "Accessories", 106: "Smartwatches", 107: "Headphones & Audio",
  108: "Cases & Protection", 109: "Accessories", 110: "Accessories",
  111: "Accessories",
};
const electronicsIds = [99, 100, 101, 102, 103, 104, 105, 107, 109, 110, 111];
const watchIds = [106];

/* ------------------------------------------------------------------ */
/* Titles, brands and copy                                             */
/* ------------------------------------------------------------------ */
const titleOverrides = {
  16: "Fresh Red Apples (1kg)", 17: "Beef Steak (500g)", 18: "Premium Cat Food (1.5kg)",
  19: "Fresh Chicken (1kg)", 20: "Refined Cooking Oil (5L)", 21: "Fresh Cucumber (500g)",
  22: "Premium Dog Food (2kg)", 23: "Farm Fresh Eggs (Crate of 30)", 24: "Fresh Fish Steak (500g)",
  25: "Green Bell Peppers (500g)", 26: "Green Chilli Peppers (250g)", 27: "Pure Natural Honey (500ml)",
  28: "Vanilla Ice Cream (1L)", 29: "Orange Juice (1L)", 30: "Fresh Kiwi (500g)",
  31: "Fresh Lemons (500g)", 32: "Full Cream Milk (1L)", 33: "Fresh Mulberries (250g)",
  34: "Nescafé Classic Coffee (200g)", 35: "Fresh Potatoes (1kg)", 36: "Whey Protein Powder (1kg)",
  37: "Red Onions (1kg)", 38: "Long Grain Rice (5kg)", 39: "Coca-Cola Soft Drinks (Pack of 12)",
  40: "Fresh Strawberries (250g)", 41: "Soft Tissue Paper (Pack of 5)", 42: "Bottled Water (Pack of 12)",
  43: "Rattan Hanging Swing Chair", 44: "Family Tree Photo Frame", 45: "Monstera Showpiece Plant",
  46: "Ceramic Plant Pot", 47: "Warm Glow Table Lamp",
  48: "Bamboo Spatula", 49: "Aluminium Serving Cup", 50: "Balloon Whisk",
  51: "2-in-1 Countertop Blender (1.5L)", 52: "Carbon Steel Wok", 53: "Bamboo Chopping Board",
  54: "Citrus Squeezer", 55: "Stainless Egg Slicer", 56: "Portable Electric Hot Plate",
  57: "Fine Mesh Strainer", 58: "Stainless Steel Forks (Set of 6)", 59: "Tumbler Glasses (Set of 6)",
  60: "Multi-Grip Grater", 61: "500W Hand Blender", 62: "Silicone Ice Cube Tray",
  63: "Kitchen Sieve", 64: "Chef's Knife", 65: "Insulated Lunch Box",
  66: "800W Microwave Oven (23L)", 67: "Mug Tree Stand", 68: "Non-Stick Frying Pan (26cm)",
  69: "Ceramic Dinner Plates (Set of 4)", 70: "Red Serving Tongs", 71: "Cooking Pot with Glass Lid",
  72: "Slotted Turner", 73: "Bamboo Spice Rack", 74: "Stainless Steel Spoons (Set of 6)",
  75: "Serving Tray", 76: "Wooden Rolling Pin", 77: "Yellow Vegetable Peeler",
  78: 'Apple MacBook Pro 14" (M1 Pro, Space Grey)', 79: "Asus Zenbook Pro Duo (Core i9)",
  80: "Huawei MateBook X Pro (Core i7)", 81: "Lenovo Yoga 920 2-in-1",
  82: 'Dell XPS 13 9300 Laptop (13.4", Core i7)',
  83: "Blue & Black Check Shirt", 84: "Aorus Graphic Cotton T-Shirt", 85: "Men's Plaid Shirt",
  86: "Men's Short Sleeve Oxford Shirt", 87: "Men's Check Shirt",
  88: "Nike Air Jordan 1 (Red & Black)", 89: "Nike Baseball Cleats", 90: "Puma Future Rider Trainers",
  91: "Off-White Runner Sneakers (Red)", 92: "Off-White Court Sneakers (Red)",
  93: "Brown Leather Strap Watch", 94: "Longines Master Collection", 95: "Rolex Cellini Date (Black Dial)",
  96: "Rolex Cellini Moonphase", 97: "Rolex Datejust", 98: "Rolex Submariner",
  99: "Amazon Echo Plus (2nd Gen)", 100: "Apple AirPods (2nd Gen)", 101: "Apple AirPods Max (Silver)",
  102: "Apple AirPower Wireless Charger", 103: "Apple HomePod mini (Cosmic Grey)",
  104: "Apple 20W USB-C Power Adapter", 105: "Apple MagSafe Battery Pack",
  106: "Apple Watch Series 4 (44mm, Gold)", 107: "Beats Flex Wireless Earphones",
  108: "iPhone 12 Silicone Case with MagSafe (Plum)", 109: "ProGrip Camera Monopod",
  110: "Ring Light Selfie Lamp", 111: "Bluetooth Selfie Stick",
  123: "Apple iPhone 13 Pro", 124: "Apple iPhone X", 125: "Oppo A57", 126: "Oppo F19 Pro+",
  127: "Oppo K1", 128: "Realme C35", 129: "Realme X", 130: "Realme XT",
  132: "Samsung Galaxy S8", 133: "Samsung Galaxy S10", 134: "Vivo S1", 135: "Vivo V9", 136: "Vivo X21",
  154: "Black Square Sunglasses", 155: "Classic Aviator Sunglasses", 156: "Green & Black Retro Sunglasses",
  157: "Oversized Party Sunglasses", 158: "Unisex Polarized Sunglasses",
  159: "Apple iPad mini 2021 (64GB, Starlight)", 160: "Samsung Galaxy Tab S8+ (128GB, Grey)",
  161: "Samsung Galaxy Tab A8 (32GB, White)",
  162: "Blue Ruffle Frock Dress", 163: "Girls' Summer Sundress", 164: "Grey Wrap Dress",
  165: "Short A-Line Frock", 166: "Tartan Print Mini Dress",
  172: "Blue Top-Handle Handbag", 173: "Heshe Leather Shoulder Bag", 174: "Prada Leather Handbag",
  175: "White Faux Leather Mini Backpack", 176: "Black Structured Handbag",
  177: "Black Evening Gown", 178: "Leather Corset Top & Skirt Set", 179: "Corset & Black Skirt Set",
  180: "Pea Green Midi Dress", 181: "Marni Red & Black Suit",
  182: "Green Crystal Drop Earrings", 183: "Green Oval Earrings", 184: "Tropical Statement Earrings",
  185: "Black & Brown Slide Slippers", 186: "Calvin Klein Block Heel Shoes", 187: "Gold Strappy Heels",
  188: "Pampi Block Heel Sandals", 189: "Red Pointed-Toe Pumps",
  190: "IWC Ingenieur Automatic Steel", 192: "Rolex Datejust (Women's)", 193: "Gold-Tone Bracelet Watch",
  194: "Minimalist Women's Wrist Watch",
  3: "Loose Setting Powder", 4: "Matte Red Lipstick", 5: "Glossy Red Nail Polish",
  137: "American Football (Official Size)", 138: "Baseballs (Pack of 3)", 139: "Leather Baseball Glove",
  140: "Indoor Basketball (Size 7)", 141: "Wall-Mounted Basketball Rim", 142: "Cricket Ball (Pack of 2)",
  143: "English Willow Cricket Bat", 144: "Cricket Helmet", 145: "Cricket Wicket Set",
  146: "Feather Shuttlecocks (Pack of 6)", 147: "Match Football (Size 5)", 148: "Golf Balls (Pack of 3)",
  149: "Golf Iron (7-Iron)", 150: "Metal Baseball Bat", 151: "Tennis Balls (Pack of 3)",
  152: "Tennis Racket", 153: "Volleyball (Size 5)",
};

const brandFallback = {
  groceries: ["FarmFresh", "Nestlé", "Golden Penny", "FreshMart", "Dangote"],
  home: ["Philips", "Saachi", "Master Chef", "Home Essentials", "Binatone"],
  fashion: ["Zara", "H&M", "Mango", "Urban Style", "Fashion House"],
  sports: ["Wilson", "Spalding", "Nike", "Adidas", "Yonex"],
  watches: ["Fossil", "Citizen", "Seiko", "Luxe Timepieces"],
  beauty: ["Nivea", "Maybelline", "Olay", "Beauty Bar"],
  electronics: ["JBL", "Sony", "Anker", "Bose"],
  computers: ["HP", "Lenovo", "Asus", "Dell"],
  phones: ["Samsung", "Tecno", "Infinix", "Xiaomi"],
};
const brandOverrides = {
  16: "FarmFresh", 17: "FarmFresh", 18: "Purina", 19: "FarmFresh", 20: "Golden Penny",
  21: "FarmFresh", 22: "Pedigree", 23: "FarmFresh", 24: "FreshMart", 25: "FarmFresh",
  26: "FarmFresh", 27: "Natural Choice", 28: "FanIce", 29: "Chi", 30: "FarmFresh",
  31: "FarmFresh", 32: "Peak", 33: "FarmFresh", 34: "Nescafé", 35: "FarmFresh",
  36: "Optimum Nutrition", 37: "FarmFresh", 38: "Mama Gold", 39: "Coca-Cola",
  40: "FarmFresh", 41: "Softcare", 42: "Eva", 43: "Home Essentials", 44: "Home Essentials",
  45: "Green Living", 46: "Green Living", 47: "Philips", 48: "Master Chef", 49: "Master Chef",
  50: "Master Chef", 51: "Philips", 52: "Master Chef", 53: "Master Chef", 54: "Master Chef",
  55: "Master Chef", 56: "Saachi", 57: "Master Chef", 58: "Master Chef", 59: "Master Chef",
  60: "Master Chef", 61: "Saachi", 62: "Master Chef", 63: "Master Chef", 64: "Master Chef",
  65: "Master Chef", 66: "Saachi", 67: "Home Essentials", 68: "Master Chef", 69: "Master Chef",
  70: "Master Chef", 71: "Master Chef", 72: "Master Chef", 73: "Home Essentials", 74: "Master Chef",
  75: "Home Essentials", 76: "Master Chef", 77: "Master Chef", 83: "Zara", 84: "Gigabyte",
  85: "H&M", 86: "Mango", 87: "Urban Style", 99: "Amazon", 100: "Apple", 101: "Apple",
  102: "Apple", 103: "Apple", 104: "Apple", 105: "Apple", 106: "Apple", 107: "Beats",
  108: "Apple", 109: "TechGear", 110: "GadgetMaster", 111: "SnapTech",
  137: "Wilson", 138: "Wilson", 139: "Wilson", 140: "Spalding", 141: "Spalding",
  142: "Kookaburra", 143: "Kookaburra", 144: "Kookaburra", 145: "Kookaburra",
  146: "Yonex", 147: "Adidas", 148: "Titleist", 149: "Titleist", 150: "Wilson",
  151: "Wilson", 152: "Wilson", 153: "Molten", 159: "Apple", 160: "Samsung", 161: "Samsung",
  162: "Zara", 163: "H&M", 164: "Mango", 165: "Zara", 166: "Urban Style",
  172: "Fashionista", 173: "Heshe", 174: "Prada", 175: "Urban Chic", 176: "Elegance Collection",
  177: "Zara", 178: "Mango", 179: "H&M", 180: "Zara", 181: "Marni",
  182: "Luxe Jewels", 183: "Luxe Jewels", 184: "Luxe Jewels",
  185: "Comfort Trends", 186: "Calvin Klein", 187: "Fashion Diva", 188: "Pampi", 189: "Fashion Express",
  190: "IWC", 192: "Rolex", 193: "Fashion Gold", 194: "Fashion Co.",
  125: "Oppo", 126: "Oppo", 127: "Oppo", 128: "Realme", 129: "Realme", 130: "Realme",
  132: "Samsung", 133: "Samsung", 134: "Vivo", 135: "Vivo", 136: "Vivo",
};

const subcategoryOverrides = {
  51: "Kitchen Appliances", 56: "Kitchen Appliances", 61: "Kitchen Appliances", 66: "Kitchen Appliances",
  58: "Dining & Serveware", 59: "Dining & Serveware", 69: "Dining & Serveware",
  68: "Cookware", 71: "Cookware", 52: "Cookware", 53: "Cookware",
};
for (const [sub, ids] of Object.entries(grocerySub)) ids.forEach((id) => (subcategoryOverrides[id] = sub));
for (const [sub, ids] of Object.entries(sportsSub)) ids.forEach((id) => (subcategoryOverrides[id] = sub));
for (const [id, sub] of Object.entries(accessoryMap)) subcategoryOverrides[id] = sub;

/* ------------------------------------------------------------------ */
/* Sellers                                                            */
/* ------------------------------------------------------------------ */
const sellers = {
  official: { name: "Tundara Official", slug: "tundara-official", rating: 4.9, followers: 284000, verified: true, badge: "Official Store" },
  tech: { name: "TechHub Store", slug: "techhub", rating: 4.7, followers: 48200, verified: true, badge: "Top Rated" },
  gadgets: { name: "Gadget Arena", slug: "gadget-arena", rating: 4.6, followers: 19700, verified: true, badge: "Verified" },
  home: { name: "Home Essentials", slug: "home-essentials", rating: 4.7, followers: 31400, verified: true, badge: "Top Rated" },
  kitchen: { name: "Kitchen Pro", slug: "kitchen-pro", rating: 4.6, followers: 12600, verified: true, badge: "Verified" },
  fashion: { name: "Fashion House NG", slug: "fashion-house-ng", rating: 4.5, followers: 87300, verified: true, badge: "Top Rated" },
  style: { name: "Style Republic", slug: "style-republic", rating: 4.6, followers: 22100, verified: true, badge: "Verified" },
  beauty: { name: "Beauty Bar", slug: "beauty-bar", rating: 4.8, followers: 64300, verified: true, badge: "Top Rated" },
  fresh: { name: "Tundara Fresh", slug: "tundara-fresh", rating: 4.8, followers: 112000, verified: true, badge: "Official Store" },
  sports: { name: "Sports Arena", slug: "sports-arena", rating: 4.7, followers: 15600, verified: true, badge: "Verified" },
  luxe: { name: "Luxe Timepieces", slug: "luxe-timepieces", rating: 4.8, followers: 9800, verified: true, badge: "Premium" },
};
const sellerByCategory = {
  phones: [sellers.official, sellers.tech, sellers.gadgets],
  computers: [sellers.tech, sellers.official],
  electronics: [sellers.official, sellers.gadgets, sellers.tech],
  home: [sellers.home, sellers.kitchen, sellers.official],
  fashion: [sellers.fashion, sellers.style, sellers.official],
  beauty: [sellers.beauty, sellers.official],
  groceries: [sellers.fresh, sellers.official],
  sports: [sellers.sports, sellers.official],
  watches: [sellers.luxe, sellers.official],
};

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const hash = (n, salt = 0) => {
  const x = Math.sin(n * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const pick = (arr, n, salt = 0) => arr[Math.floor(hash(n, salt) * arr.length) % arr.length];
const slugify = (s) =>
  s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const colors = {
  phones: ["Graphite", "Silver", "Gold", "Sierra Blue"],
  computers: ["Space Grey", "Silver"],
  electronics: ["White", "Black", "Silver"],
  home: ["White", "Black", "Natural"],
  fashion: ["Black", "White", "Beige", "Navy"],
  beauty: ["Classic", "Rose"],
  watches: ["Silver", "Gold", "Black"],
  sports: ["Black", "White"],
  groceries: [],
};

function buildVariants(p) {
  const price = p.price;
  const storage = [
    { label: "128GB", delta: 0 },
    { label: "256GB", delta: Math.round(price * 0.1 * 100) / 100 },
    { label: "512GB", delta: Math.round(price * 0.24 * 100) / 100 },
  ];
  if (p.category === "smartphones") return [{ name: "Storage", options: storage }];
  if (p.category === "tablets") return [{ name: "Storage", options: [{ label: "64GB", delta: 0 }, { label: "128GB", delta: 49 }, { label: "256GB", delta: 129 }] }];
  if (p.category === "laptops")
    return [{ name: "Configuration", options: [{ label: "16GB / 512GB", delta: 0 }, { label: "32GB / 1TB", delta: Math.round(price * 0.18) }] }];
  if (p.category === "fragrances")
    return [{ name: "Size", options: [{ label: "50ml", delta: 0 }, { label: "100ml", delta: Math.round(price * 0.45) }] }];
  if (p.category === "beauty" || p.category === "skin-care") return [{ name: "Size", options: [{ label: "Standard", delta: 0 }] }];
  if (p.category === "mens-shirts" || p.category === "tops") return [{ name: "Size", options: ["S", "M", "L", "XL", "XXL"].map((label) => ({ label, delta: 0 })) }];
  if (p.category === "womens-dresses") return [{ name: "Size", options: ["XS", "S", "M", "L", "XL"].map((label) => ({ label, delta: 0 })) }];
  if (p.category === "mens-shoes") return [{ name: "Size (EU)", options: ["40", "41", "42", "43", "44", "45"].map((label) => ({ label, delta: 0 })) }];
  if (p.category === "womens-shoes") return [{ name: "Size (EU)", options: ["36", "37", "38", "39", "40", "41"].map((label) => ({ label, delta: 0 })) }];
  if (p.category === "womens-bags" || p.category === "sunglasses" || p.category === "womens-jewellery") {
    return [{ name: "Colour", options: (colors.fashion.slice(0, 3)).map((label) => ({ label, delta: 0 })) }];
  }
  if (p.category === "mens-watches" || p.category === "womens-watches" || p.category === "mobile-accessories") {
    return [{ name: "Colour", options: (colors.watches.slice(0, 2)).map((label) => ({ label, delta: 0 })) }];
  }
  if (["kitchen-accessories", "home-decoration"].includes(p.category)) {
    return [{ name: "Colour", options: ["Classic", "Matte Black"].map((label) => ({ label, delta: 0 })) }];
  }
  return [];
}

function buildSpecs(p, cat) {
  const dims = p.dimensions ? `${p.dimensions.width} × ${p.dimensions.height} × ${p.dimensions.depth} cm` : "Standard";
  const base = [{ label: "SKU", value: p.sku }, { label: "Brand", value: p.brand }];
  const byCat = {
    phones: [
      ["Display", pick(['6.1" Super Retina XDR OLED', '6.5" AMOLED 90Hz', '6.7" Liquid Retina IPS'], p.id)],
      ["Processor", pick(["A15 Bionic", "Snapdragon 8 Gen 1", "MediaTek Helio G96", "Exynos 9820"], p.id)],
      ["Camera", "Triple 12MP rear · 12MP front"],
      ["Battery", pick(["3,200 mAh · 20W fast charge", "4,500 mAh · 33W fast charge", "5,000 mAh · 18W fast charge"], p.id)],
      ["Memory", pick(["6GB RAM", "8GB RAM", "4GB RAM"], p.id)],
      ["Operating system", p.brand === "Apple" ? "iOS" : "Android 12"],
      ["Network", "5G · 4G LTE · Wi-Fi 6"],
      ["SIM", p.brand === "Apple" ? "Nano-SIM + eSIM" : "Dual Nano-SIM"],
    ],
    laptops: [
      ["Processor", pick(["Apple M1 Pro", "Intel Core i7-1165G7", "AMD Ryzen 7 5800U", "Intel Core i5-1135G7"], p.id)],
      ["Memory", "16GB LPDDR4X"],
      ["Storage", "512GB NVMe SSD"],
      ["Display", pick(['14.2" Liquid Retina XDR', '13.4" FHD+ InfinityEdge', '14" 2.8K OLED'], p.id)],
      ["Graphics", pick(["Integrated", "NVIDIA GeForce RTX 3050"], p.id)],
      ["Operating system", p.brand === "Apple" ? "macOS Monterey" : "Windows 11 Home"],
      ["Battery", "Up to 12 hours"],
      ["Weight", `${p.weight ?? 1.4} kg`],
    ],
    electronics: [
      ["Type", pick(["Wireless earbuds", "Over-ear headphones", "Smart speaker", "Smartwatch", "Charging accessory"], p.id)],
      ["Connectivity", "Bluetooth 5.0 · USB-C"],
      ["Battery life", pick(["Up to 20 hours", "Up to 24 hours", "Up to 18 hours", "—"], p.id)],
      ["Noise control", pick(["Active Noise Cancellation", "Passive isolation", "—"], p.id)],
      ["Water resistance", pick(["IPX4", "IPX5", "Not rated"], p.id)],
      ["Compatibility", "iOS · Android · Windows"],
      ["In the box", "Device · charging cable · quick start guide"],
    ],
    home: [
      ["Material", pick(["Bamboo", "Stainless steel", "Aluminium", "Ceramic", "Solid wood"], p.id)],
      ["Capacity", pick(["1.5L", "23L", "26cm", "Standard", "Set of 6"], p.id)],
      ["Power", pick(["800W", "500W", "220–240V", "Not applicable"], p.id)],
      ["Care", "Hand wash recommended"],
      ["Dimensions", dims],
      ["In the box", "1 × " + (titleOverrides[p.id] || p.title)],
    ],
    furniture: [
      ["Material", "Solid wood and premium upholstery"],
      ["Dimensions", dims],
      ["Assembly", "Minimal assembly required"],
      ["Care", "Wipe clean with a soft cloth"],
      ["Warranty", p.warrantyInformation || "1 year manufacturer warranty"],
    ],
    "home-decoration": [
      ["Material", pick(["Ceramic", "Rattan", "Glass", "Wood"], p.id)],
      ["Dimensions", dims],
      ["Style", "Contemporary"],
      ["Care", "Wipe clean with a dry cloth"],
    ],
    fashion: [
      ["Material", pick(["100% cotton", "Cotton blend", "Genuine leather", "Recycled polyester"], p.id)],
      ["Fit", pick(["Regular fit", "Relaxed fit", "Slim fit"], p.id)],
      ["Closure", pick(["Button", "Zip", "Slip-on", "Lace-up"], p.id)],
      ["Care", "Machine wash cold · do not tumble dry"],
      ["Country of origin", "Imported"],
    ],
    beauty: [
      ["Volume", pick(["30ml", "50ml", "100ml", "8.5g"], p.id)],
      ["Skin type", "All skin types"],
      ["Finish", pick(["Matte", "Natural", "Radiant", "—"], p.id)],
      ["Cruelty-free", "Yes"],
      ["Shelf life", "24 months"],
      ["Made in", pick(["France", "USA", "Italy", "UAE"], p.id)],
    ],
    groceries: [
      ["Net content", pick(["500g", "1kg", "5kg", "1L", "Pack"], p.id)],
      ["Packaging", "Sealed pack"],
      ["Storage", "Store in a cool, dry place"],
      ["Shelf life", pick(["7 days", "14 days", "6 months", "12 months"], p.id)],
      ["Country of origin", "Nigeria"],
      ["Allergens", "See packaging for details"],
    ],
    sports: [
      ["Size", pick(["Official size", "Size 5", "Size 7", "One size"], p.id)],
      ["Material", pick(["Synthetic leather", "Composite leather", "Carbon fibre", "Rubber"], p.id)],
      ["Suitable for", pick(["Training and match day", "Indoor & outdoor", "All levels"], p.id)],
      ["Care", "Wipe clean after use"],
    ],
    watches: [
      ["Case size", pick(["40mm", "41mm", "42mm", "44mm"], p.id)],
      ["Movement", pick(["Automatic", "Quartz", "Smartwatch"], p.id)],
      ["Water resistance", pick(["30m", "50m", "100m", "Splash resistant"], p.id)],
      ["Strap", pick(["Leather", "Stainless steel", "Silicone", "Gold-tone metal"], p.id)],
      ["Glass", "Sapphire crystal"],
      ["Warranty", p.warrantyInformation || "2 year international warranty"],
    ],
  };
  const key = p.category === "home-decoration" ? "home-decoration" : p.category === "furniture" ? "furniture" : p.category;
  const rows = byCat[key] || byCat[cat] || [];
  return [...base, ...rows.map(([label, value]) => ({ label, value })), { label: "Weight", value: `${p.weight ?? "—"} kg` }];
}

function buildHighlights(p, specs) {
  const skip = new Set(["SKU", "Brand", "Weight", "In the box", "Care", "Warranty", "Country of origin", "Storage", "Memory"]);
  return specs.filter((s) => !skip.has(s.label)).slice(0, 4).map((s) => `${s.label}: ${s.value}`);
}

function sellerFor(p, cat) {
  const pool = sellerByCategory[cat] || sellerByCategory.phones;
  if ([123, 101, 100, 106, 102, 103, 104, 105, 108, 78, 159].includes(p.id)) return sellers.official;
  if (cat === "groceries") return sellers.fresh;
  return pool[Math.floor(hash(p.id, 9) * pool.length) % pool.length];
}

const flashIds = new Set([123, 101, 88, 174, 8, 66, 12, 78, 140, 34, 6, 186, 45, 161, 51, 99, 28, 152]);
const featuredIds = new Set([123, 101, 88, 174, 78, 12, 8, 98, 66, 140, 51, 160, 159, 34, 45, 186, 6, 100, 103, 82, 186, 179, 90, 4, 119, 20, 38, 147, 145, 94, 193]);
const newIds = new Set([160, 161, 79, 107, 105, 111, 181, 180, 167, 166, 189, 193, 31, 36, 150, 154]);
const bestsellerIds = new Set([123, 88, 100, 66, 34, 38, 140, 174, 51, 8, 6, 133]);

/* ------------------------------------------------------------------ */
/* Build                                                              */
/* ------------------------------------------------------------------ */
const products = [];
for (const p of source.products) {
  if (!map[p.category] || EXCLUDED_IDS.has(p.id)) continue;
  if (p.category === "mobile-accessories" && ![...electronicsIds, ...watchIds, 108].includes(p.id)) continue;

  const catMeta = map[p.category];
  let category = catMeta.category;
  let subcategory = subcategoryOverrides[p.id] || catMeta.subcategory;
  if (watchIds.includes(p.id)) {
    category = "watches";
    subcategory = "Smartwatches";
  }
  if (electronicsIds.includes(p.id)) {
    category = "electronics";
    subcategory = accessoryMap[p.id] || "Accessories";
  }
  if ([102, 104, 105, 108].includes(p.id)) {
    category = "computers";
    subcategory = p.id === 108 ? "Cases & Protection" : "Chargers & Power";
  }
  if (!categories.find((c) => c.slug === category)) continue;

  const title = titleOverrides[p.id] || p.title;
  const brand = brandOverrides[p.id] || p.brand || pick(brandFallback[category] || ["Tundara"], p.id, 3);
  const basePrice = Math.round(p.price * 100) / 100;
  const isFlash = flashIds.has(p.id);
  const discount = isFlash
    ? 28 + Math.floor(hash(p.id, 5) * 18)
    : 6 + Math.floor(hash(p.id, 4) * 30);
  const oldPrice = Math.round((basePrice / (1 - discount / 100)) * 100) / 100;
  const rating = Math.round((3.9 + hash(p.id, 1) * 1.0) * 10) / 10;
  const reviewCount = 18 + Math.floor(hash(p.id, 2) * 3200);
  const sold = 25 + Math.floor(hash(p.id, 3) * 8800);
  const stock = 2 + Math.floor(hash(p.id, 6) * 96);
  const seller = sellerFor(p, category);
  const imageCount = Math.max(1, Math.min(4, p.images?.length || 1));
  const images = Array.from({ length: imageCount }, (_, i) => `assets/img/products/${p.id}-${i + 1}.webp`);
  const tags = [category, subcategory, brand, ...(p.tags || []), "shop"].map((t) => String(t).toLowerCase());
  const variants = buildVariants(p);
  const specs = buildSpecs({ ...p, brand }, category);

  const product = {
    id: p.id,
    title,
    slug: slugify(title),
    brand,
    category,
    subcategory,
    gender: catMeta.gender,
    price: basePrice,
    oldPrice,
    discount,
    currency: "USD",
    rating,
    reviewCount,
    sold,
    stock,
    sku: p.sku,
    image: `assets/img/products/${p.id}-thumb.webp`,
    images,
    description: p.description,
    highlights: buildHighlights(p, specs),
    specs,
    variants,
    tags,
    seller: seller.name,
    sellerSlug: seller.slug,
    sellerRating: seller.rating,
    sellerFollowers: seller.followers,
    verifiedSeller: seller.verified,
    sellerBadge: seller.badge,
    warranty: p.warrantyInformation || "1 year manufacturer warranty",
    shippingInfo: p.shippingInformation || "Ships within 24 hours",
    returnPolicy: p.returnPolicy || "7-day free returns",
    freeShipping: basePrice >= 35 || catMeta.category === "groceries",
    deliveryDays: catMeta.category === "groceries" ? 1 : 2 + Math.floor(hash(p.id, 8) * 3),
    badge: flashIds.has(p.id) ? "Flash Sale" : newIds.has(p.id) ? "New Arrival" : bestsellerIds.has(p.id) ? "Best Seller" : "",
    featured: featuredIds.has(p.id),
    flash: isFlash,
    newArrival: newIds.has(p.id),
    bestseller: bestsellerIds.has(p.id),
    official: seller.slug === "tundara-official",
    createdAt: `2025-${String(1 + Math.floor(hash(p.id, 11) * 12)).padStart(2, "0")}-${String(1 + Math.floor(hash(p.id, 12) * 27)).padStart(2, "0")}`,
  };
  products.push(product);
}

/* Order featured/flash items first for deterministic merchandising */
products.sort((a, b) => a.id - b.id);

const summary = categories.map((c) => `${c.name}: ${products.filter((p) => p.category === c.slug).length}`);
const catalog = {
  meta: {
    brand: "Tundara",
    tagline: "Everything you love. Delivered.",
    productCount: products.length,
    freeShippingThreshold: 35,
    defaultCurrency: "NGN",
    builtAt: new Date().toISOString(),
  },
  categories: categories.map((c) => ({
    ...c,
    count: products.filter((p) => p.category === c.slug).length,
  })),
  products,
  coupons: [
    { code: "TUN10", type: "percent", value: 10, minSpend: 0, label: "10% off your order" },
    { code: "WELCOME15", type: "percent", value: 15, minSpend: 20, label: "15% off your first order" },
    { code: "FREESHIP", type: "shipping", value: 100, minSpend: 15, label: "Free delivery" },
    { code: "FLASH5", type: "fixed", value: 5, minSpend: 10, label: "$5 off flash deals" },
  ],
  currencies: [
    { code: "NGN", symbol: "₦", rate: 1550, locale: "en-NG", decimals: 0, label: "Nigerian Naira" },
    { code: "USD", symbol: "$", rate: 1, locale: "en-US", decimals: 2, label: "US Dollar" },
    { code: "GHS", symbol: "₵", rate: 15.2, locale: "en-GH", decimals: 0, label: "Ghanaian Cedi" },
    { code: "KES", symbol: "KSh", rate: 129, locale: "en-KE", decimals: 0, label: "Kenyan Shilling" },
    { code: "ZAR", symbol: "R", rate: 18.4, locale: "en-ZA", decimals: 0, label: "South African Rand" },
    { code: "GBP", symbol: "£", rate: 0.79, locale: "en-GB", decimals: 2, label: "British Pound" },
    { code: "EUR", symbol: "€", rate: 0.92, locale: "de-DE", decimals: 2, label: "Euro" },
  ],
  regions: [
    { city: "Lagos", state: "Lagos", country: "Nigeria" },
    { city: "Abuja", state: "FCT", country: "Nigeria" },
    { city: "Port Harcourt", state: "Rivers", country: "Nigeria" },
    { city: "Ibadan", state: "Oyo", country: "Nigeria" },
    { city: "Kano", state: "Kano", country: "Nigeria" },
    { city: "Enugu", state: "Enugu", country: "Nigeria" },
    { city: "Accra", state: "Greater Accra", country: "Ghana" },
    { city: "Nairobi", state: "Nairobi", country: "Kenya" },
    { city: "Johannesburg", state: "Gauteng", country: "South Africa" },
  ],
  brands: [...new Set(products.map((p) => p.brand))].sort(),
};

await writeFile(
  join(root, "assets/js/catalog.js"),
  "/* Tundara catalog — generated by tools/build-catalog.mjs. Do not edit by hand. */\n" +
    "window.TUNDARA = " + JSON.stringify(catalog, null, 2) + ";\n",
  "utf8",
);
console.log("Catalog built:", products.length, "products");
console.log(summary.join("\n"));
console.log("Flash:", products.filter((p) => p.flash).length, "| Featured:", products.filter((p) => p.featured).length);
