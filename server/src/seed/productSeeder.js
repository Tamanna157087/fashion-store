require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("../models/Product");
const products = require("./products");

// Dedicated subcategory image pools to guarantee NO MIXING of image pools
const STRICT_SUBCATEGORY_POOLS = {
  // Sandals
  "Sandals": [
    "https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=1000&auto=format&fit=crop&q=85"
  ],
  // Heels
  "Heels": [
    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1596568359553-a56de6970068?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=1000&auto=format&fit=crop&q=85"
  ],
  // Sneakers
  "Sneakers": [
    "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=1000&auto=format&fit=crop&q=85"
  ],
  // Formal Shoes
  "Formal Shoes": [
    "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=1000&auto=format&fit=crop&q=85"
  ],
  // Boots
  "Boots": [
    "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=1000&auto=format&fit=crop&q=85"
  ],
  // Bags / Handbags / Clutches
  "Handbags": [
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=1000&auto=format&fit=crop&q=85"
  ],
  "Clutches": [
    "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1000&auto=format&fit=crop&q=85"
  ],
  "Backpacks": [
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1546938576-6e6a64f317cc?w=1000&auto=format&fit=crop&q=85"
  ],
  "Wallets": [
    "https://images.unsplash.com/photo-1627123424574-724758594e93?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1000&auto=format&fit=crop&q=85"
  ],
  "Belts": [
    "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1627123424574-724758594e93?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1000&auto=format&fit=crop&q=85"
  ],
  "Watches": [
    "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=1000&auto=format&fit=crop&q=85"
  ],
  "Sunglasses": [
    "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1577803645773-f96470509666?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=1000&auto=format&fit=crop&q=85"
  ],
  "Perfumes": [
    "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1541643600914-78b084683601?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1000&auto=format&fit=crop&q=85"
  ],
  "Makeup": [
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=1000&auto=format&fit=crop&q=85"
  ],
  "Jewellery": [
    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1000&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1000&auto=format&fit=crop&q=85"
  ]
};

const seedProducts = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/ai-fashion-store";
    await mongoose.connect(mongoUri);

    console.log("MongoDB Connected for Product Seeding...");

    // Check existing products count
    const count = await Product.countDocuments();
    console.log(`Current products in DB: ${count}`);

    // Wipe old products & re-insert fresh realistic catalog
    await Product.deleteMany({});
    console.log("Cleared existing catalog from MongoDB.");

    // Validate image assignment for every product before seeding
    const sanitizedProducts = products.map((prod, pIdx) => {
      const subcat = prod.subcategory;
      const pool = STRICT_SUBCATEGORY_POOLS[subcat];

      let thumbnail = prod.thumbnail;
      let images = (prod.images || []).map(img => typeof img === 'string' ? { url: img } : img);

      // If strict pool exists for this subcategory, ensure thumbnail & gallery match
      if (pool && pool.length > 0) {
        const offset = pIdx % pool.length;
        thumbnail = pool[offset];

        images = [];
        for (let gIdx = 0; gIdx < 4; gIdx++) {
          images.push({
            url: pool[(offset + gIdx) % pool.length],
            public_id: `prod_img_${pIdx}_${gIdx + 1}`
          });
        }
      }

      return {
        ...prod,
        thumbnail,
        images
      };
    });

    const inserted = await Product.insertMany(sanitizedProducts);
    console.log(`Successfully seeded ${inserted.length} high-quality fashion products with 100% strict image-to-product mapping!`);

    process.exit(0);
  } catch (error) {
    console.error("Product Seeding Error:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedProducts();
}

module.exports = seedProducts;
