const mongoose = require("mongoose");

const pizzaSchema = new mongoose.Schema({
    name: { type: String, required: true },
    variants: [{ type: String }],
    prices: [],
    category: { type: String, required: true },
    image: { type: String, required: true },
    description: { type: String, required: true }
}, {
    timestamps: true,  // Adds createdAt and updatedAt fields automatically
});

const pizzaModel = mongoose.model('pizza', pizzaSchema);

module.exports = pizzaModel;
