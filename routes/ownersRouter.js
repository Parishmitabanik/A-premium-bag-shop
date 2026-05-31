const express = require('express')
const router = express.Router()
const ownerModel = require("../models/owner-model")
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')


const productModel = require("../models/product-model"); // add at top if not there
const upload = require("../config/multer-config"); // add at top if not there

// Show edit form
router.get("/editproduct/:id", isOwnerLoggedIn, async function(req, res) {
    let product = await productModel.findById(req.params.id);
    let success = req.flash("success");
    res.render("editproduct", { product, success, isOwner: true });
});

// Handle update
router.post("/updateproduct/:id", isOwnerLoggedIn, upload.single("image"), async function(req, res) {
    try {
        let { name, price, discount, bgcolor, panelcolor, textcolor } = req.body;

        let updateData = { name, price, discount, bgcolor, panelcolor, textcolor };

        // Only update image if a new one was uploaded
        if (req.file) {
            updateData.image = req.file.buffer;
        }

        await productModel.findByIdAndUpdate(req.params.id, updateData);
        req.flash("success", "Product updated successfully");
        res.redirect("/owners/allproducts");
    } catch (err) {
        res.send(err.message);
    }
});
router.get("/allproducts", isOwnerLoggedIn, async function(req, res) {
    let products = await productModel.find();
    let success = req.flash("success");  // add this line
    res.render("admin", { products, isOwner: true, success });  // add success here
});

router.get("/deleteproduct/:id", isOwnerLoggedIn, async function(req, res) {
    await productModel.findByIdAndDelete(req.params.id);
    req.flash("success", "Product deleted successfully");
    res.redirect("/owners/allproducts");
});

// Seller Register
router.post("/register", async function(req, res) {
    try {
        let { fullname, email, password, gstin } = req.body;

        let existingOwner = await ownerModel.findOne({ email });
        if (existingOwner) {
            req.flash("error", "Seller account already exists. Please login.");
            req.flash("showPanel", "seller");
            return res.redirect("/");
        }

        // Replace the register route's success part:
        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(password, salt, async function(err, hash) {
                if (err) return res.send(err.message);
                await ownerModel.create({ fullname, email, password: hash, gstin });
                req.flash("success", "Seller account created successfully! Please login.");
                req.flash("showPanel", "seller");
                res.redirect("/");
            });
        });
    } catch (err) {
        res.send(err.message);
    }
});

// Seller Login
router.post("/login", async function(req, res) {
    try {
        let { email, password } = req.body;
        let owner = await ownerModel.findOne({ email });

        if (!owner) {
            req.flash("error", "No seller account found with this email.");
            req.flash("showPanel", "seller");
            return res.redirect("/");
        }

        bcrypt.compare(password, owner.password, function(err, result) {
            if (result) {
                let token = jwt.sign({ email: owner.email, id: owner._id }, process.env.JWT_KEY);
                res.cookie("ownertoken", token);
                return res.redirect("/owners/admin");
            } else {
                req.flash("error", "Seller email or password incorrect.");
                req.flash("showPanel", "seller");
                return res.redirect("/");
            }
        });
    } catch (err) {
        res.send(err.message);
    }
});

// Seller Logout
router.get("/logout", function(req, res) {
    res.cookie("ownertoken", "");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.redirect("/");
});

// Admin panel — pass isOwner:true so header shows correct nav
router.get("/admin", isOwnerLoggedIn, function(req, res) {
    let success = req.flash("success");
    res.render("createproducts", { success, isOwner: true });
});

// Middleware to protect owner routes
function isOwnerLoggedIn(req, res, next) {
    if (!req.cookies.ownertoken || req.cookies.ownertoken === "") {
        req.flash("error", "Please login as seller first.");
        req.flash("showPanel", "seller");
        return res.redirect("/");
    }
    try {
        let decoded = jwt.verify(req.cookies.ownertoken, process.env.JWT_KEY);
        req.owner = decoded;
        next();
    } catch (err) {
        req.flash("error", "Session expired. Please login again.");
        req.flash("showPanel", "seller");
        res.redirect("/");
    }
}

module.exports = router;