const mongoose = require("mongoose");

const pizzaSchema = new mongoose.Schema({
    name: { type: String, required: true },
    size: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String, required: true },
    description: { type: String, required: true }
}, {
    timestamps: true,  // Adds createdAt and updatedAt fields automatically
});

const pizzaModel = mongoose.model('pizza', pizzaSchema);   // "Pizza" is the collection name

module.exports = pizzaModel;
