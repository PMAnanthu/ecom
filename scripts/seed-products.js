#!/usr/bin/env node
// Seed script: creates 8 categories + 100 products with images via the API
// Run: node scripts/seed-products.js

const API = 'http://localhost:4000/api';
const ADMIN_EMAIL = 'admin@demo.com';
const ADMIN_PASSWORD = 'admin1234';

const CATEGORIES = [
  'Electronics', 'Clothing', 'Home & Kitchen', 'Sports', 'Books', 'Beauty', 'Toys', 'Food'
];

const PRODUCTS = [
  // Electronics (12)
  { name: 'Wireless Noise-Cancelling Headphones', cat: 'Electronics', price: 79.99, stock: 25, tags: ['audio', 'wireless'], desc: 'Premium over-ear headphones with 30hr battery life.' },
  { name: 'Mechanical Gaming Keyboard', cat: 'Electronics', price: 89.99, stock: 18, tags: ['gaming', 'keyboard'], desc: 'TKL layout with blue switches and RGB backlight.' },
  { name: 'USB-C 7-in-1 Hub', cat: 'Electronics', price: 34.99, stock: 40, tags: ['accessories', 'usb'], desc: 'HDMI 4K, USB 3.0, SD card, PD charging.' },
  { name: '27" 4K Monitor', cat: 'Electronics', price: 329.99, stock: 10, tags: ['display', 'productivity'], desc: 'IPS panel, 60Hz, HDR400, USB-C.' },
  { name: 'Portable Bluetooth Speaker', cat: 'Electronics', price: 49.99, stock: 30, tags: ['audio', 'wireless'], desc: 'Waterproof, 12hr battery, 360° sound.' },
  { name: 'Smart Watch Series X', cat: 'Electronics', price: 199.99, stock: 15, tags: ['wearable', 'fitness'], desc: 'Health tracking, GPS, 5-day battery.' },
  { name: 'Wireless Charging Pad', cat: 'Electronics', price: 19.99, stock: 50, tags: ['charging', 'wireless'], desc: '15W fast wireless charging, Qi compatible.' },
  { name: 'Action Camera 4K', cat: 'Electronics', price: 149.99, stock: 12, tags: ['camera', 'adventure'], desc: 'Waterproof, 4K 60fps, image stabilisation.' },
  { name: 'Mini Projector', cat: 'Electronics', price: 119.99, stock: 8, tags: ['display', 'home'], desc: '1080p supported, 100" display, built-in speaker.' },
  { name: 'True Wireless Earbuds', cat: 'Electronics', price: 59.99, stock: 35, tags: ['audio', 'wireless'], desc: 'ANC, 24hr total battery, IPX5 rated.' },
  { name: 'Smart Home Hub', cat: 'Electronics', price: 69.99, stock: 20, tags: ['smart-home', 'wireless'], desc: 'Controls lights, locks, thermostat via app.' },
  { name: 'Laptop Stand Adjustable', cat: 'Electronics', price: 29.99, stock: 45, tags: ['accessories', 'productivity'], desc: 'Aluminium, foldable, fits 10-17" laptops.' },

  // Clothing (15)
  { name: 'Classic White Oxford Shirt', cat: 'Clothing', price: 39.99, stock: 60, tags: ['formal', 'men'], desc: 'Slim fit, 100% cotton, wrinkle-resistant.' },
  { name: 'Slim Fit Chinos', cat: 'Clothing', price: 44.99, stock: 50, tags: ['casual', 'men'], desc: 'Stretch twill fabric, multiple colours.' },
  { name: 'Women\'s Floral Maxi Dress', cat: 'Clothing', price: 54.99, stock: 40, tags: ['women', 'summer'], desc: 'Lightweight chiffon, adjustable straps.' },
  { name: 'Heavyweight Hoodie', cat: 'Clothing', price: 49.99, stock: 55, tags: ['casual', 'unisex'], desc: '400gsm fleece, kangaroo pocket, relaxed fit.' },
  { name: 'Leather Sneakers', cat: 'Clothing', price: 89.99, stock: 30, tags: ['footwear', 'casual'], desc: 'Full-grain leather, cushioned insole.' },
  { name: 'Denim Jacket', cat: 'Clothing', price: 64.99, stock: 35, tags: ['outerwear', 'casual'], desc: 'Classic stonewash, button front, two chest pockets.' },
  { name: 'Running Joggers', cat: 'Clothing', price: 34.99, stock: 48, tags: ['activewear', 'men'], desc: 'Moisture-wicking, tapered fit, zip pockets.' },
  { name: 'Cashmere Blend Sweater', cat: 'Clothing', price: 79.99, stock: 25, tags: ['knitwear', 'winter'], desc: '80% merino wool, crew neck, ribbed cuffs.' },
  { name: 'High-Waist Yoga Pants', cat: 'Clothing', price: 44.99, stock: 42, tags: ['activewear', 'women'], desc: '4-way stretch, squat-proof, hidden pocket.' },
  { name: 'Waterproof Parka', cat: 'Clothing', price: 119.99, stock: 20, tags: ['outerwear', 'winter'], desc: 'Detachable hood, sealed seams, 10K waterproof.' },
  { name: 'Linen Blend Blazer', cat: 'Clothing', price: 89.99, stock: 18, tags: ['formal', 'summer'], desc: 'Unstructured, breathable, two-button.' },
  { name: 'Graphic Tee – Mountains', cat: 'Clothing', price: 24.99, stock: 70, tags: ['casual', 'unisex'], desc: '100% organic cotton, screen-printed design.' },
  { name: 'Chelsea Boots', cat: 'Clothing', price: 99.99, stock: 22, tags: ['footwear', 'formal'], desc: 'Suede upper, elastic gusset, leather sole.' },
  { name: 'Sports Bra – Medium Support', cat: 'Clothing', price: 29.99, stock: 50, tags: ['activewear', 'women'], desc: 'Racerback, moisture-wicking, removable pads.' },
  { name: 'Wool Beanie', cat: 'Clothing', price: 19.99, stock: 80, tags: ['accessories', 'winter'], desc: '100% merino wool, ribbed knit, one size.' },

  // Home & Kitchen (15)
  { name: 'Cast Iron Skillet 10"', cat: 'Home & Kitchen', price: 34.99, stock: 30, tags: ['cookware', 'kitchen'], desc: 'Pre-seasoned, oven-safe to 500°F.' },
  { name: 'Bamboo Cutting Board Set', cat: 'Home & Kitchen', price: 29.99, stock: 45, tags: ['kitchen', 'eco'], desc: 'Set of 3 with juice groove and handle.' },
  { name: 'Electric Kettle 1.7L', cat: 'Home & Kitchen', price: 39.99, stock: 28, tags: ['kitchen', 'appliances'], desc: 'Rapid boil, auto shut-off, keep warm.' },
  { name: 'French Press Coffee Maker', cat: 'Home & Kitchen', price: 24.99, stock: 35, tags: ['coffee', 'kitchen'], desc: '34oz stainless steel plunger, heat-resistant glass.' },
  { name: 'Air Purifier HEPA', cat: 'Home & Kitchen', price: 89.99, stock: 15, tags: ['home', 'health'], desc: 'True HEPA + carbon filter, 360m² coverage.' },
  { name: 'Robot Vacuum Cleaner', cat: 'Home & Kitchen', price: 179.99, stock: 12, tags: ['home', 'smart'], desc: 'Auto-mapping, 2hr runtime, app control.' },
  { name: 'Stainless Steel Water Bottle 1L', cat: 'Home & Kitchen', price: 22.99, stock: 60, tags: ['drinkware', 'eco'], desc: 'Double-wall insulated, 24hr cold / 12hr hot.' },
  { name: 'Wooden Serving Board', cat: 'Home & Kitchen', price: 27.99, stock: 25, tags: ['kitchen', 'entertaining'], desc: 'Acacia wood, handle grip, food safe.' },
  { name: 'Scented Candle Set', cat: 'Home & Kitchen', price: 32.99, stock: 40, tags: ['home', 'relaxation'], desc: 'Set of 4 — vanilla, lavender, cedar, citrus.' },
  { name: 'Blackout Curtains (Pair)', cat: 'Home & Kitchen', price: 44.99, stock: 20, tags: ['home', 'bedroom'], desc: '100% light blocking, thermal insulated.' },
  { name: 'Knife Block Set 7-Piece', cat: 'Home & Kitchen', price: 69.99, stock: 18, tags: ['cookware', 'kitchen'], desc: 'German stainless steel, full tang, hardwood block.' },
  { name: 'Non-Stick Frying Pan', cat: 'Home & Kitchen', price: 29.99, stock: 32, tags: ['cookware', 'kitchen'], desc: 'PFOA-free ceramic coating, induction ready.' },
  { name: 'Himalayan Salt Lamp', cat: 'Home & Kitchen', price: 19.99, stock: 50, tags: ['home', 'ambiance'], desc: 'Hand-carved, dimmer switch, 6-8kg.' },
  { name: 'Memory Foam Pillow', cat: 'Home & Kitchen', price: 34.99, stock: 38, tags: ['bedroom', 'sleep'], desc: 'Contour shape, bamboo cover, CertiPUR certified.' },
  { name: 'Desk Lamp LED Touch', cat: 'Home & Kitchen', price: 27.99, stock: 30, tags: ['home', 'office'], desc: '5 colour temps, 10 brightness levels, USB charging.' },

  // Sports (12)
  { name: 'Yoga Mat Premium 6mm', cat: 'Sports', price: 39.99, stock: 40, tags: ['yoga', 'fitness'], desc: 'Non-slip, extra-long 183cm, carry strap included.' },
  { name: 'Resistance Band Set', cat: 'Sports', price: 19.99, stock: 55, tags: ['fitness', 'home-gym'], desc: '5 resistance levels, natural latex, door anchor.' },
  { name: 'Adjustable Dumbbell 20kg', cat: 'Sports', price: 89.99, stock: 15, tags: ['weights', 'home-gym'], desc: 'Single dumbbell, dial-select 2-20kg, saves space.' },
  { name: 'Jump Rope Speed', cat: 'Sports', price: 14.99, stock: 70, tags: ['cardio', 'fitness'], desc: 'Ball-bearing handles, adjustable cable, counter.' },
  { name: 'Foam Roller 90cm', cat: 'Sports', price: 22.99, stock: 35, tags: ['recovery', 'fitness'], desc: 'High-density EVA, textured surface, grid pattern.' },
  { name: 'Running Belt Waist Pack', cat: 'Sports', price: 17.99, stock: 45, tags: ['running', 'accessories'], desc: 'Water-resistant, fits phones up to 6.7".' },
  { name: 'Pull-Up Bar Doorframe', cat: 'Sports', price: 29.99, stock: 28, tags: ['home-gym', 'strength'], desc: 'No screws, 150kg capacity, multi-grip.' },
  { name: 'Hiking Backpack 40L', cat: 'Sports', price: 74.99, stock: 18, tags: ['hiking', 'outdoor'], desc: 'Rain cover, hydration sleeve, ventilated back.' },
  { name: 'Boxing Gloves 12oz', cat: 'Sports', price: 44.99, stock: 22, tags: ['boxing', 'training'], desc: 'Genuine leather, multi-layer foam, wrist support.' },
  { name: 'Knee Compression Sleeves', cat: 'Sports', price: 19.99, stock: 50, tags: ['recovery', 'running'], desc: 'Pair, anti-slip, graduated compression.' },
  { name: 'Gym Bag 35L', cat: 'Sports', price: 34.99, stock: 30, tags: ['accessories', 'gym'], desc: 'Wet/dry separation, shoe compartment, USB port.' },
  { name: 'Protein Shaker Bottle', cat: 'Sports', price: 12.99, stock: 80, tags: ['nutrition', 'gym'], desc: '700ml, leak-proof flip lid, mixing ball.' },

  // Books (10)
  { name: 'Atomic Habits – James Clear', cat: 'Books', price: 14.99, stock: 50, tags: ['self-help', 'productivity'], desc: 'Tiny changes, remarkable results. #1 bestseller.' },
  { name: 'The Pragmatic Programmer', cat: 'Books', price: 39.99, stock: 30, tags: ['programming', 'tech'], desc: 'Your journey to mastery. 20th anniversary edition.' },
  { name: 'Sapiens – Yuval Noah Harari', cat: 'Books', price: 13.99, stock: 45, tags: ['history', 'non-fiction'], desc: 'A brief history of humankind.' },
  { name: 'Deep Work – Cal Newport', cat: 'Books', price: 13.99, stock: 40, tags: ['self-help', 'productivity'], desc: 'Rules for focused success in a distracted world.' },
  { name: 'Clean Code – Robert Martin', cat: 'Books', price: 34.99, stock: 25, tags: ['programming', 'tech'], desc: 'A handbook of agile software craftsmanship.' },
  { name: 'Thinking, Fast and Slow', cat: 'Books', price: 14.99, stock: 35, tags: ['psychology', 'non-fiction'], desc: 'Daniel Kahneman on decision making and judgement.' },
  { name: 'The Lean Startup', cat: 'Books', price: 14.99, stock: 38, tags: ['business', 'startup'], desc: 'How today\'s entrepreneurs build successful businesses.' },
  { name: 'Designing Data-Intensive Apps', cat: 'Books', price: 49.99, stock: 20, tags: ['programming', 'tech'], desc: 'The big ideas behind reliable, scalable systems.' },
  { name: 'Zero to One – Peter Thiel', cat: 'Books', price: 12.99, stock: 42, tags: ['business', 'startup'], desc: 'Notes on startups, or how to build the future.' },
  { name: 'The Psychology of Money', cat: 'Books', price: 13.99, stock: 48, tags: ['finance', 'self-help'], desc: 'Timeless lessons on wealth, greed, and happiness.' },

  // Beauty (12)
  { name: 'Vitamin C Serum 30ml', cat: 'Beauty', price: 24.99, stock: 45, tags: ['skincare', 'brightening'], desc: '20% ascorbic acid, hyaluronic acid, ferulic acid.' },
  { name: 'Retinol Night Cream', cat: 'Beauty', price: 34.99, stock: 30, tags: ['skincare', 'anti-aging'], desc: '0.3% retinol, peptides, niacinamide.' },
  { name: 'SPF 50 Daily Moisturiser', cat: 'Beauty', price: 22.99, stock: 40, tags: ['skincare', 'sunscreen'], desc: 'Lightweight, non-greasy, mineral UV filters.' },
  { name: 'Hyaluronic Acid Toner', cat: 'Beauty', price: 18.99, stock: 50, tags: ['skincare', 'hydration'], desc: '3 molecular weights, plumps and smooths.' },
  { name: 'Rose Water Face Mist', cat: 'Beauty', price: 14.99, stock: 55, tags: ['skincare', 'refreshing'], desc: '100% pure rosewater, soothing and hydrating.' },
  { name: 'Charcoal Face Mask', cat: 'Beauty', price: 19.99, stock: 38, tags: ['skincare', 'cleansing'], desc: 'Deep pore cleansing, kaolin clay blend.' },
  { name: 'Argan Oil Hair Serum', cat: 'Beauty', price: 21.99, stock: 35, tags: ['haircare', 'frizz'], desc: '100% pure Moroccan argan oil, heat protection.' },
  { name: 'Makeup Brush Set 12pc', cat: 'Beauty', price: 29.99, stock: 28, tags: ['makeup', 'tools'], desc: 'Synthetic bristles, rose gold ferrule, case included.' },
  { name: 'Micellar Cleansing Water', cat: 'Beauty', price: 12.99, stock: 60, tags: ['skincare', 'cleansing'], desc: '400ml, removes makeup without rinsing.' },
  { name: 'Jade Roller & Gua Sha Set', cat: 'Beauty', price: 22.99, stock: 32, tags: ['skincare', 'massage'], desc: 'Natural jade stone, reduces puffiness.' },
  { name: 'Lip Balm SPF 15 Set', cat: 'Beauty', price: 9.99, stock: 90, tags: ['lips', 'spf'], desc: 'Pack of 4 — honey, mint, berry, vanilla.' },
  { name: 'Eye Cream Anti-Puff', cat: 'Beauty', price: 27.99, stock: 25, tags: ['skincare', 'anti-aging'], desc: 'Caffeine + peptides, reduces dark circles.' },

  // Toys (12)
  { name: 'LEGO Architecture Set', cat: 'Toys', price: 49.99, stock: 20, tags: ['lego', 'creative'], desc: '750 pieces, skyline series, ages 12+.' },
  { name: 'Remote Control Car 4WD', cat: 'Toys', price: 39.99, stock: 25, tags: ['rc', 'outdoor'], desc: '1:16 scale, 25km/h, off-road tyres, 30min battery.' },
  { name: 'Wooden Puzzle 1000pc', cat: 'Toys', price: 19.99, stock: 35, tags: ['puzzle', 'family'], desc: 'Landscape series, premium cut, frame included.' },
  { name: 'Science Kit for Kids', cat: 'Toys', price: 34.99, stock: 18, tags: ['educational', 'stem'], desc: '30+ experiments, volcano, crystal growing, slime.' },
  { name: 'Magnetic Drawing Board', cat: 'Toys', price: 17.99, stock: 45, tags: ['educational', 'toddler'], desc: 'No-mess, erase instantly, ages 3+.' },
  { name: 'Drone with Camera', cat: 'Toys', price: 79.99, stock: 15, tags: ['drone', 'tech'], desc: '720p HD, auto-hover, 10min flight time.' },
  { name: 'Board Game – Catan', cat: 'Toys', price: 44.99, stock: 22, tags: ['board-game', 'family'], desc: 'Strategy, trading, building. 3-4 players.' },
  { name: 'Kinetic Sand 2kg', cat: 'Toys', price: 24.99, stock: 30, tags: ['creative', 'sensory'], desc: 'Mold, squish, build. 98% sand, non-toxic.' },
  { name: 'Watercolour Paint Set 48', cat: 'Toys', price: 19.99, stock: 40, tags: ['art', 'creative'], desc: '48 vivid colours, 3 brushes, reusable tin.' },
  { name: 'Mini Basketball Hoop', cat: 'Toys', price: 22.99, stock: 28, tags: ['sports', 'indoor'], desc: 'Over-door mount, foam ball included.' },
  { name: 'Stuffed Animal Elephant', cat: 'Toys', price: 19.99, stock: 50, tags: ['plush', 'toddler'], desc: '40cm, ultra-soft, machine washable.' },
  { name: 'Tabletop Foosball Game', cat: 'Toys', price: 59.99, stock: 12, tags: ['games', 'family'], desc: 'MDF frame, 8 rods, 3 balls included.' },

  // Food (12)
  { name: 'Organic Arabica Coffee 500g', cat: 'Food', price: 16.99, stock: 60, tags: ['coffee', 'organic'], desc: 'Medium roast, single origin Ethiopia, whole bean.' },
  { name: 'Matcha Powder Premium 100g', cat: 'Food', price: 19.99, stock: 45, tags: ['tea', 'organic'], desc: 'Ceremonial grade, stone-ground, Japan.' },
  { name: 'Dark Chocolate 85% Set', cat: 'Food', price: 14.99, stock: 50, tags: ['chocolate', 'snacks'], desc: 'Box of 6 × 90g bars, single origin.' },
  { name: 'Honey Raw Organic 500g', cat: 'Food', price: 13.99, stock: 40, tags: ['organic', 'natural'], desc: 'Unfiltered wildflower honey, glass jar.' },
  { name: 'Mixed Nuts Premium 1kg', cat: 'Food', price: 22.99, stock: 35, tags: ['snacks', 'healthy'], desc: 'Almonds, cashews, walnuts, pecans, no salt.' },
  { name: 'Extra Virgin Olive Oil 750ml', cat: 'Food', price: 17.99, stock: 38, tags: ['cooking', 'organic'], desc: 'Cold-pressed, Sicily DOP, glass bottle.' },
  { name: 'Dried Mango Strips 500g', cat: 'Food', price: 11.99, stock: 55, tags: ['snacks', 'fruit'], desc: 'No added sugar, sulphite-free, soft dried.' },
  { name: 'Himalayan Pink Salt 1kg', cat: 'Food', price: 8.99, stock: 70, tags: ['cooking', 'natural'], desc: 'Fine grain, mineral-rich, unrefined.' },
  { name: 'Green Tea Bags 100pk', cat: 'Food', price: 9.99, stock: 65, tags: ['tea', 'healthy'], desc: 'Sencha blend, individually wrapped, Japan.' },
  { name: 'Granola Crunchy Clusters 500g', cat: 'Food', price: 12.99, stock: 48, tags: ['breakfast', 'healthy'], desc: 'Oats, honey, almond, low sugar.' },
  { name: 'Coconut Oil 500ml', cat: 'Food', price: 11.99, stock: 42, tags: ['cooking', 'organic'], desc: 'Cold-pressed virgin, unrefined, glass jar.' },
  { name: 'Protein Powder Vanilla 1kg', cat: 'Food', price: 34.99, stock: 30, tags: ['nutrition', 'fitness'], desc: 'Whey isolate, 25g protein per serving, low carb.' },
];

async function main() {
  // 1. Login
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const { accessToken, user } = await loginRes.json();
  if (!accessToken) { console.error('Login failed'); process.exit(1); }
  console.log(`✓ Logged in as ${user.email}`);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` };

  // 2. Get store to get storeId
  const storeRes = await fetch(`${API}/store`, { headers });
  const { store } = await storeRes.json();
  if (!store) { console.error('No store found — create a store first'); process.exit(1); }
  console.log(`✓ Store: ${store.name} (${store.id})`);
  headers['x-store-id'] = store.id;

  // 3. Create categories — fetch existing first, create only missing
  console.log('\nCreating categories...');
  const categoryMap = {};

  const listRes = await fetch(`${API}/catalog/categories`, { headers });
  const listData = await listRes.json();
  const existing = listData.categories || [];
  for (const c of existing) { categoryMap[c.name] = c.id; }

  for (const catName of CATEGORIES) {
    if (categoryMap[catName]) {
      console.log(`  → ${catName} (existing)`);
      continue;
    }
    const res = await fetch(`${API}/catalog/categories`, {
      method: 'POST', headers,
      body: JSON.stringify({ name: catName }),
    });
    const data = await res.json();
    if (data.category) {
      categoryMap[catName] = data.category.id;
      console.log(`  ✓ ${catName}`);
    } else {
      console.log(`  ✗ ${catName}:`, JSON.stringify(data));
    }
  }

  // 4. Create products
  console.log(`\nCreating ${PRODUCTS.length} products...`);
  let created = 0;
  for (const p of PRODUCTS) {
    const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(p.name)}/400/400`;
    const res = await fetch(`${API}/catalog/products`, {
      method: 'POST', headers,
      body: JSON.stringify({
        name: p.name,
        description: p.desc,
        price: p.price,
        stock: p.stock,
        tags: p.tags,
        categoryId: categoryMap[p.cat],
        images: [imageUrl],
      }),
    });
    const data = await res.json();
    if (data.product) {
      created++;
      process.stdout.write(`\r  ✓ ${created}/${PRODUCTS.length} products created`);
    } else {
      console.log(`\n  ✗ Failed: ${p.name}`, data.error || data);
    }
  }

  console.log(`\n\n✅ Done! Created ${created} products across ${Object.keys(categoryMap).length} categories.`);
}

main().catch(console.error);
