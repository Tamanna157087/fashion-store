require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./src/app");

const PORT = process.env.PORT || 5000;

// Listen on PORT immediately so Express serves endpoints cleanly
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

const migrateVariants = require("./src/scripts/migrateVariants");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");
    await migrateVariants();
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error.message);
  });
