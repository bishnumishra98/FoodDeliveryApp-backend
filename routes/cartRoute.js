const express = require('express');
const router = express.Router();
const Cart = require('../models/cartModel');   // import the Cart model, which defines the structure of the 'cart' collection in MongoDB

// Route: GET /:userId
// Description: Fetch the cart details for a specific user
router.get('/:userId', async (req, res) => {
    try {
        // Extract the userId from the request parameters
        const userId = req.params.userId;

        // Query the database to find the cart for the given userId
        // The populate() method fetches full details of the foodId from the 'food' collection, providing richer information for the frontend.
        const cart = await Cart.findOne({ userId }).populate('items.foodId');

        // Send the cart as the response; if no cart is found, send an empty cart structure with an `items` array
        res.send(cart || { items: [] });
    } catch (error) {
        // Handle any errors during database query execution. Send a 500 status code (Internal Server Error) along with an error message.
        res.status(500).send({ message: 'Error fetching cart', error });
    }
});

// Route: POST /:userId
// Description: Add or update cart items for a specific user
router.post('/:userId', async (req, res) => {
    // Extract the `items` array from the request body
    // `items` is expected to be an array of objects, each containing `foodId` and `quantity`
    const { items } = req.body;

    try {
        // Extract the userId from the request parameters
        const userId = req.params.userId;

        // Query the database to check if a cart already exists for the given userId
        let cart = await Cart.findOne({ userId });

        // If no cart exists, create a new cart for the user
        if (!cart) {
            cart = new Cart({ userId, items });   // initialize a new cart document with the userId and items
        } else {
            cart.items = items;   // if a cart exists, update its `items` field with the new data
        }

        // Save the cart (whether newly created or updated) to the database
        await cart.save();

        // Send the updated cart back as the response
        res.send(cart);
    } catch (error) {
        // Handle any errors during the database operation. Send a 500 status code (Internal Server Error) along with an error message.
        res.status(500).send({ message: 'Error updating cart', error });
    }
});

// Export the router to make it available for use in the main server file (e.g., `server.js`)
module.exports = router;
