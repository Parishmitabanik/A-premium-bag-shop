const mongoose = require('mongoose')

const productSchema = mongoose.Schema({
    image: Buffer,
    name: String,
    price: Number,
    discount: { type: Number, default: 0 },
    bgcolor: String,
    panelcolor: String,
    textcolor: String,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "owner" },
    reviews: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
            username: String,
            rating: { type: Number, min: 1, max: 5 },
            comment: String,
            reviewedAt: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true })

module.exports = mongoose.model("product", productSchema)