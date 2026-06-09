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
                    quantity: Number,
                    review: {
                        rating: { type: Number, min: 1, max: 5 },
                        comment: String,
                        reviewedAt: Date
                    }
                }
            ],
            bill: Number,
            address: String,
            paymentmode: String,
            deliveryDate: String,
            orderedAt: Date,
            status: {
                type: String,
                enum: ['ordered', 'shipped', 'delivered', 'cancelled', 'returned'],
                default: 'ordered'
            },
            cancelledAt: Date,
            returnReason: String,
            returnedAt: Date,
            pickupDate: Date,    // ← ADD THIS
            refundDate: Date     // ← ADD THIS
        }
    ],
    contact: Number,
    picture: String
})

module.exports = mongoose.model("user", userSchema)