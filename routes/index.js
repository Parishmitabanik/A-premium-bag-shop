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
    let { sortby, filter, search } = req.query;
    let query = {};
    let sortOption = {};
    if (search && search.trim().length > 0) query.name = { $regex: search.trim(), $options: "i" };
    if (filter === "discounted") query.discount = { $gt: 0 };
    else if (filter === "new") {
        let thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query.createdAt = { $gte: thirtyDaysAgo };
    }
    if (sortby === "newest") sortOption = { createdAt: -1 };
    else if (sortby === "price_asc") sortOption = { price: 1 };
    else if (sortby === "price_desc") sortOption = { price: -1 };
    let products = await productModel.find(query).sort(sortOption);
    let success = req.flash("success");
    res.render("shop", { products, success, sortby: sortby || "popular", filter: filter || "", search: search || "" });
})

router.get("/product/:id", isLoggedIn, async function(req, res) {
    try {
        let product = await productModel.findById(req.params.id);
        if (!product) return res.status(404).send("Product not found");
        res.render("productdetail", { product });
    } catch (err) {
        res.status(500).send("Error loading product");
    }
})

router.get("/cart", isLoggedIn, async function(req, res) {
    let user = await userModel.findOne({ email: req.user.email }).populate("cart.product");
    let bill = 0;
    user.cart.forEach(function(cartItem) {
        let discountedPrice = cartItem.product.price - (cartItem.product.discount / 100) * cartItem.product.price;
        bill += discountedPrice * cartItem.quantity;
    });
    bill += 20;
    res.render("cart", { user, bill });
});

router.get("/addtocart/:productid", isLoggedIn, async function(req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    let existingItem = user.cart.find(i => i.product.toString() === req.params.productid);
    if (existingItem) existingItem.quantity += 1;
    else user.cart.push({ product: req.params.productid, quantity: 1 });
    await user.save();
    req.flash("success", "Product added to cart successfully");
    res.redirect("/shop");
})

router.get("/cart/increase/:productid", isLoggedIn, async function(req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    let item = user.cart.find(i => i.product.toString() === req.params.productid);
    if (item) { item.quantity += 1; await user.save(); }
    res.redirect("/cart");
})

router.get("/cart/decrease/:productid", isLoggedIn, async function(req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    let itemIndex = user.cart.findIndex(i => i.product.toString() === req.params.productid);
    if (itemIndex !== -1) {
        if (user.cart[itemIndex].quantity > 1) user.cart[itemIndex].quantity -= 1;
        else user.cart.splice(itemIndex, 1);
        await user.save();
    }
    res.redirect("/cart");
})

router.get("/checkout", isLoggedIn, async function(req, res) {
    let user = await userModel.findOne({ email: req.user.email }).populate("cart.product");
    if (user.cart.length === 0) return res.redirect("/cart");
    let totalMRP = 0, totalDiscount = 0;
    user.cart.forEach(function(cartItem) {
        totalMRP += cartItem.product.price * cartItem.quantity;
        totalDiscount += (cartItem.product.discount / 100) * cartItem.product.price * cartItem.quantity;
    });
    let bill = totalMRP - totalDiscount + 20;
    res.render("checkout", { user, totalMRP, totalDiscount, bill });
});

router.get("/account", isLoggedIn, async function(req, res) {
    let user = await userModel.findOne({ email: req.user.email })
        .populate("cart.product")
        .populate("orders.items.product");
    let success = req.flash("success");
    let error = req.flash("error");
    res.render("account", { user, success, error });
});

router.post("/checkout", isLoggedIn, async function(req, res) {
    let { fullname, phone, address, city, state, pincode, paymentmode } = req.body;
    let user = await userModel.findOne({ email: req.user.email }).populate("cart.product");
    if (user.cart.length === 0) return res.redirect("/cart");
    let totalMRP = 0, totalDiscount = 0;
    user.cart.forEach(function(cartItem) {
        totalMRP += cartItem.product.price * cartItem.quantity;
        totalDiscount += (cartItem.product.discount / 100) * cartItem.product.price * cartItem.quantity;
    });
    let bill = totalMRP - totalDiscount + 20;
    let orderId = "SCH" + Date.now();
    let delivery = new Date();
    delivery.setDate(delivery.getDate() + 5);
    let deliveryDate = delivery.toDateString();
    user.orders.push({
        orderId,
        items: user.cart.map(c => ({ product: c.product._id, quantity: c.quantity })),
        bill,
        address: `${address}, ${city}, ${state} - ${pincode}`,
        paymentmode,
        deliveryDate,
        orderedAt: new Date(),
        status: 'ordered'
    });
    user.cart = [];
    await user.save();
    res.render("orderconfirmation", { username: fullname, orderId, paymentmode, address, city, state, pincode, bill, deliveryDate });
});

// Submit Review
router.post("/review/:orderId/:itemId", isLoggedIn, async function(req, res) {
    try {
        let { rating, comment } = req.body;
        let user = await userModel.findOne({ email: req.user.email });
        let order = user.orders.find(o => o.orderId === req.params.orderId);
        if (!order) { req.flash("error", "Order not found"); return res.redirect("/account"); }
        let deliveryDate = new Date(order.deliveryDate);
        if (new Date() < deliveryDate) { req.flash("error", "You can only review after delivery"); return res.redirect("/account"); }
        let item = order.items.id(req.params.itemId);
        if (!item) { req.flash("error", "Item not found"); return res.redirect("/account"); }
        item.review = { rating: parseInt(rating), comment: comment.trim(), reviewedAt: new Date() };
        await user.save();
        req.flash("success", "Review submitted successfully!");
        res.redirect("/account");
    } catch (err) {
        res.status(500).send("Error submitting review: " + err.message);
    }
});

// Cancel Order — only if status is 'ordered' (not yet shipped)
router.post("/cancel/:orderId", isLoggedIn, async function(req, res) {
    try {
        let user = await userModel.findOne({ email: req.user.email });
        let order = user.orders.find(o => o.orderId === req.params.orderId);
        if (!order) { req.flash("error", "Order not found"); return res.redirect("/account"); }
        if (order.status !== 'ordered') {
            req.flash("error", "Order cannot be cancelled after it has been shipped");
            return res.redirect("/account");
        }
        order.status = 'cancelled';
        order.cancelledAt = new Date();
        await user.save();
        req.flash("success", "Order cancelled successfully");
        res.redirect("/account");
    } catch (err) {
        res.status(500).send("Error cancelling order: " + err.message);
    }
});

// Return Order — only if delivered
router.post("/return/:orderId", isLoggedIn, async function(req, res) {
    try {
        let { returnReason } = req.body;
        let user = await userModel.findOne({ email: req.user.email });
        let order = user.orders.find(o => o.orderId === req.params.orderId);
        if (!order) { req.flash("error", "Order not found"); return res.redirect("/account"); }
        let deliveryDate = new Date(order.deliveryDate);
        if (new Date() < deliveryDate) {
            req.flash("error", "Order not yet delivered");
            return res.redirect("/account");
        }
        if (order.status === 'returned') {
            req.flash("error", "Return already requested");
            return res.redirect("/account");
        }
        order.status = 'returned';
        order.returnReason = returnReason.trim();
        order.returnedAt = new Date();
        await user.save();
        req.flash("success", "Return request submitted successfully");
        res.redirect("/account");
    } catch (err) {
        res.status(500).send("Error processing return: " + err.message);
    }
});

// Auto-update order status based on dates (called on account page load via this route)
router.get("/logout", isLoggedIn, function(req, res) {
    res.render("shop")
})

module.exports = router;