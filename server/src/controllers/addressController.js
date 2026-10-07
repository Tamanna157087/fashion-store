const User = require("../models/User");

// Get Saved Addresses
const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      addresses: user.addresses || [],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add New Address
const addAddress = async (req, res) => {
  try {
    const { name, phone, houseNo, street, landmark, city, state, country, pincode, addressType, isDefault } = req.body;

    if (!name || !phone || !houseNo || !street || !city || !state || !pincode) {
      return res.status(400).json({ success: false, message: "Please fill all required address fields" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const makeDefault = isDefault || user.addresses.length === 0;

    if (makeDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    const newAddress = {
      name,
      phone,
      houseNo,
      street,
      landmark: landmark || "",
      city,
      state,
      country: country || "India",
      pincode,
      addressType: addressType || "Home",
      isDefault: makeDefault,
    };

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      addresses: user.addresses,
      address: user.addresses[user.addresses.length - 1],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Edit Address
const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const addressIndex = user.addresses.findIndex((a) => a._id.toString() === addressId);
    if (addressIndex === -1) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    const addr = user.addresses[addressIndex];
    addr.name = req.body.name || addr.name;
    addr.phone = req.body.phone || addr.phone;
    addr.houseNo = req.body.houseNo || addr.houseNo;
    addr.street = req.body.street || addr.street;
    addr.landmark = req.body.landmark !== undefined ? req.body.landmark : addr.landmark;
    addr.city = req.body.city || addr.city;
    addr.state = req.body.state || addr.state;
    addr.country = req.body.country || addr.country;
    addr.pincode = req.body.pincode || addr.pincode;
    addr.addressType = req.body.addressType || addr.addressType;

    if (req.body.isDefault) {
      user.addresses.forEach((a) => {
        a.isDefault = false;
      });
      addr.isDefault = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Address
const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const wasDefault = user.addresses.find((a) => a._id.toString() === addressId)?.isDefault;

    user.addresses = user.addresses.filter((a) => a._id.toString() !== addressId);

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Set Default Address
const setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.addresses.forEach((a) => {
      a.isDefault = a._id.toString() === addressId;
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: "Default address updated",
      addresses: user.addresses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
