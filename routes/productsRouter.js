const express = require('express')
const router = express.Router()
const upload = require("../config/multer-config")
const productModel = require("../models/product-model")
const jwt = require('jsonwebtoken')

router.post("/create", upload.single("image"), async function(req, res) {
    try {
        let { name, price, discount, bgcolor, panelcolor, textcolor } = req.body
        let decoded = jwt.verify(req.cookies.ownertoken, process.env.JWT_KEY)

        let product = await productModel.create({
            image: req.file.buffer,
            name, price, discount, bgcolor, panelcolor, textcolor,
            owner: decoded.id
        })
        req.flash("success", "Product created successfully")
        res.redirect("/owners/admin")
    } catch (error) {
        res.status(500).send("Error creating product: " + error.message)
    }
})

module.exports = router