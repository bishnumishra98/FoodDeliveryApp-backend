const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
        name: { type: String, require },
        email: { type: String, require },
        userid: { type: String, require },
        orderItems: [],
        deliveryAddress: { type: Object },
        orderAmount: { type: Number, require },
        deliveryStatus: { type: String, require, default: "orderplaced" },
        transactionId: { type: String, require },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("order", orderSchema);
