const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    fullname: { type: String, minLength: 3, trim: true },
    email: String,
    password: String,
    cart: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: "product" },
            quantity: { type: Number, default: 1 }
        }
    ],
    orders: [
        {
            orderId: String,
            items: [
                {
                    product: { type: mongoose.Schema.Types.ObjectId, ref: "product" },
                    quantity: Number
                }
            ],
            bill: Number,
            address: String,
            paymentmode: String,
            deliveryDate: String,
            orderedAt: Date
        }
    ],
    contact: Number,
    picture: String
})

module.exports = mongoose.model("user", userSchema)