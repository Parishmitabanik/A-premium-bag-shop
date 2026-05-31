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
 
    if (filter === "discounted") {
        query.discount = { $gt: 0 };
    } else if (filter === "new") {
        let thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query.createdAt = { $gte: thirtyDaysAgo };
    }
 
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
 
// Product Detail Page
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
        let product = cartItem.product;
        let qty = cartItem.quantity;
        let discountedPrice = product.price - (product.discount / 100) * product.price;
        bill += discountedPrice * qty;
    });
    bill += 20;
 
    res.render("cart", { user, bill });
});
 
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
 
router.get("/cart/decrease/:productid", isLoggedIn, async function(req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    let itemIndex = user.cart.findIndex(function(i) {
        return i.product.toString() === req.params.productid;
    });
    if (itemIndex !== -1) {
        if (user.cart[itemIndex].quantity > 1) {
            user.cart[itemIndex].quantity -= 1;
        } else {
            user.cart.splice(itemIndex, 1);
        }
        await user.save();
    }
    res.redirect("/cart");
})
 
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
 
router.get("/account", isLoggedIn, async function(req, res) {
    let user = await userModel.findOne({ email: req.user.email })
        .populate("cart.product")
        .populate("orders.items.product");
    res.render("account", { user });
});
 
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
 
    let orderId = "SCH" + Date.now();
 
    let delivery = new Date();
    delivery.setDate(delivery.getDate() + 5);
    let deliveryDate = delivery.toDateString();
 
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