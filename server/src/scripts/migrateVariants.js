require("dotenv").config();
const mongoose = require("mongoose");

const migrateVariants = async () => {
  let isStandalone = false;
  try {
    if (mongoose.connection.readyState !== 1) {
      const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ai_fashion_store";
      await mongoose.connect(mongoUri);
      isStandalone = true;
      console.log("Connected to MongoDB for variant migration...");
    }

    const collection = mongoose.connection.db.collection("products");
    const products = await collection.find({}).toArray();

    let migratedCount = 0;

    for (const p of products) {
      if (!p.variants || !Array.isArray(p.variants) || p.variants.length === 0) {
        const oldStock = typeof p.stock === "number" ? p.stock : 0;
        const rawTitle = p.title || "PROD";
        const prefix = rawTitle.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase() || "PRD";
        const sku = `${prefix}-DEF-${p._id.toString().slice(-4)}`;

        const defaultVariant = {
          color: "Default",
          size: "Default",
          stock: oldStock,
          sku: sku,
        };

        await collection.updateOne(
          { _id: p._id },
          {
            $set: { variants: [defaultVariant] },
            $unset: { stock: "" },
          }
        );

        migratedCount++;
        console.log(`Migrated product "${p.title}" (${p._id}): created default variant with stock ${oldStock} and SKU ${sku}`);
      }
    }

    console.log(`Migration complete. ${migratedCount} product(s) migrated.`);

    if (isStandalone) {
      await mongoose.disconnect();
      process.exit(0);
    }
  } catch (error) {
    console.error("Variant Migration Failed:", error);
    if (isStandalone) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  migrateVariants();
}

module.exports = migrateVariants;
