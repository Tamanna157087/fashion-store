require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function verify() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const total = await Product.countDocuments();
    console.log('Total Products in Database:', total);

    const categories = await Product.distinct('category');
    console.log('Categories Count:', categories.length, '->', categories);

    const subcategories = await Product.distinct('subcategory');
    console.log('Subcategories Count:', subcategories.length);

    const testKeywords = ['shoe', 'bag', 'watch', 'dress', 'hoodie', 'kurti', 'wallet', 'shirt', 'saree', 'perfume', 'boots'];
    for (const kw of testKeywords) {
      const count = await Product.countDocuments({
        $or: [
          { title: { $regex: kw, $options: 'i' } },
          { category: { $regex: kw, $options: 'i' } },
          { subcategory: { $regex: kw, $options: 'i' } },
          { tags: { $regex: kw, $options: 'i' } }
        ]
      });
      console.log(`Keyword "${kw}": ${count} products found`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Verify error:', err);
    process.exit(1);
  }
}

verify();
