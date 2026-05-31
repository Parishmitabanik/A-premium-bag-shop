
const express = require('express')
const isLoggedIn = require('../middlewares/isLoggedIn')
const router = express.Router()
const productModel = require("../models/product-model");
const userModel = require('../models/user-model');

router.get("/", function(req, res) {
    let error = req.flash("error");
    let success = req.flash("success");
    let showPanel = req.flash("showPanel")[0] || null;
    res.render("index", { error, success, loggedin: false, showPanel });
})

router.get("/shop", isLoggedIn, async function(req, res) {
    let { sortby, filter } = req.query;
    let query = {};
    let sortOption = {};

    // Filter logic
    if (filter === "discounted") {
        query.discount = { $gt: 0 };
    } else if (filter === "new") {
        // Show products created in the last 30 days
        let thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query.createdAt = { $gte: thirtyDaysAgo };
    }

    // Sort logic
    if (sortby === "newest") {
        sortOption = { createdAt: -1 };
    } else if (sortby === "price_asc") {
        sortOption = { price: 1 };
    } else if (sortby === "price_desc") {
        sortOption = { price: -1 };
    }

    let products = await productModel.find(query).sort(sortOption);
    let success = req.flash("success");
    res.render("shop", { products, success, sortby: sortby || "popular", filter: filter || "" });
})

router.get("/cart", isLoggedIn, async function(req, res) {
    let user = await userModel.findOne({ email: req.user.email }).populate("cart.product");

    // Calculate total bill
    let bill = 0;
    user.cart.forEach(function(cartItem) {
        let product = cartItem.product;
        let qty = cartItem.quantity;
        let discountedPrice = product.price - (product.discount / 100) * product.price;
        bill += discountedPrice * qty;
    });
    bill += 20; // platform fee

    res.render("cart", { user, bill });
});

// Add to cart — if already exists, increase quantity
router.get("/addtocart/:productid", isLoggedIn, async function(req, res) {
    let user = await userModel.findOne({ email: req.user.email });

    let existingItem = user.cart.find(function(item) {
        return item.product.toString() === req.params.productid;
    });

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        user.cart.push({ product: req.params.productid, quantity: 1 });
    }

    await user.save();
    req.flash("success", "Product added to cart successfully");
    res.redirect("/shop");
})

// Increase quantity from cart page
router.get("/cart/increase/:productid", isLoggedIn, async function(req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    let item = user.cart.find(function(i) {
        return i.product.toString() === req.params.productid;
    });
    if (item) {
        item.quantity += 1;
        await user.save();
    }
    res.redirect("/cart");
})

// Decrease quantity from cart page — remove if quantity reaches 0
router.get("/cart/decrease/:productid", isLoggedIn, async function(req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    let itemIndex = user.cart.findIndex(function(i) {
        return i.product.toString() === req.params.productid;
    });
    if (itemIndex !== -1) {
        if (user.cart[itemIndex].quantity > 1) {
            user.cart[itemIndex].quantity -= 1;
        } else {
            user.cart.splice(itemIndex, 1); // remove from cart
        }
        await user.save();
    }
    res.redirect("/cart");
})

// Show checkout page
router.get("/checkout", isLoggedIn, async function(req, res) {
    let user = await userModel.findOne({ email: req.user.email }).populate("cart.product");

    if (user.cart.length === 0) return res.redirect("/cart");

    let totalMRP = 0;
    let totalDiscount = 0;
    user.cart.forEach(function(cartItem) {
        totalMRP += cartItem.product.price * cartItem.quantity;
        totalDiscount += (cartItem.product.discount / 100) * cartItem.product.price * cartItem.quantity;
    });
    let bill = totalMRP - totalDiscount + 20;

    res.render("checkout", { user, totalMRP, totalDiscount, bill });
});
// My Account page
router.get("/account", isLoggedIn, async function(req, res) {
    let user = await userModel.findOne({ email: req.user.email })
        .populate("cart.product")
        .populate("orders.items.product");
    res.render("account", { user });
});

// Handle order placement
router.post("/checkout", isLoggedIn, async function(req, res) {
    let { fullname, phone, address, city, state, pincode, paymentmode } = req.body;

    let user = await userModel.findOne({ email: req.user.email }).populate("cart.product");

    if (user.cart.length === 0) return res.redirect("/cart");

    let totalMRP = 0;
    let totalDiscount = 0;
    user.cart.forEach(function(cartItem) {
        totalMRP += cartItem.product.price * cartItem.quantity;
        totalDiscount += (cartItem.product.discount / 100) * cartItem.product.price * cartItem.quantity;
    });
    let bill = totalMRP - totalDiscount + 20;

    // Generate order ID
    let orderId = "SCH" + Date.now();

    // Estimated delivery: 5 days from now
    let delivery = new Date();
    delivery.setDate(delivery.getDate() + 5);
    let deliveryDate = delivery.toDateString();

    // Save order to user
    // Save order to user — replace the user.orders.push block with this:
    user.orders.push({
        orderId,
        items: user.cart.map(function(cartItem) {
            return {
                product: cartItem.product._id,
                quantity: cartItem.quantity
            }
        }),
        bill,
        address: `${address}, ${city}, ${state} - ${pincode}`,
        paymentmode,
        deliveryDate,
        orderedAt: new Date()
    });

    // Clear cart
    user.cart = [];
    await user.save();

    res.render("orderconfirmation", {
        username: fullname,
        orderId,
        paymentmode,
        address,
        city,
        state,
        pincode,
        bill,
        deliveryDate
    });
});

router.get("/logout", isLoggedIn, function(req, res) {
    res.render("shop")
})

module.exports = router;