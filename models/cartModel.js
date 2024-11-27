const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    items: [
        {
            foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'food', required: true },
            quantity: { type: Number, required: true },
        }
    ]
}, {
    timestamps: true,
});

module.exports = mongoose.model('cart', cartSchema);


// ➥ Explanation:

// ➼ 'mongoose.Schema.Types.ObjectId' indicates that the 'userId' field will store an ObjectId, which is MongoDB's unique
//   identifier for documents.

// ➼ 'ref: 'user'' creates a relationship (or reference) between the 'cart' collection and the 'user' collection.
//   This tells Mongoose that the 'userId' field refers to the '_id' field in the user collection.

// ➼ 'required: true' to ensures that a userId must always be present when creating a cart document.

// ➼ 'items' represents an array of items in the cart. Each item is an object containing the details of a specific food item.
//    ‣ Array Structure: Each item in the array has te following fields:
//      1. 'foodId' represents the ID of the food item in the cart.
//         • 'type: mongoose.Schema.Types.ObjectId' stores the unique identifier of the food item from the 'food' collection.
//         • 'ref: 'food'' links this field to the 'food' collection, enabling you to fetch food details (e.g., name, price)
//           when querying the cart.
//         • 'required: true' ensures that each cart item must have a valid foodId.
//      2. 'quantity' represents the quantity of the food item in the cart.
//         • 'type: Number' specifies that this field must store a number.
//         • 'required: true' ensures that the quantity field is always provided.
