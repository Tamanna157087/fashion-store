const StoreSettings = require("../models/StoreSettings");

const getStoreSettings = async (req, res) => {
  try {
    let settings = await StoreSettings.findOne().lean();
    if (!settings) {
      settings = await StoreSettings.create({
        storeName: "AI Fashion Store",
        gstNumber: "27AAACA1234A1Z5",
        supportEmail: "support@aifashionstore.com",
        supportPhone: "+91 98765 43210",
        shippingCharge: 99,
        freeShippingThreshold: 999,
        platformFee: 10,
        taxPercentage: 18,
      });
    }

    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateStoreSettings = async (req, res) => {
  try {
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = new StoreSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: "Store settings updated successfully",
      settings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStoreSettings,
  updateStoreSettings,
};
