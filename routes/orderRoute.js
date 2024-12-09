const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const axios = require("axios");
const Order = require("../models/orderModel");

// Load environment variables
const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const PHONEPE_SECRET_KEY = process.env.PHONEPE_SECRET_KEY;
const PHONEPE_BASE_URL = process.env.PHONEPE_BASE_URL;

// Place order and initiate payment
router.post("/placeorder", async (req, res) => {
    const { subtotal, currentUser, cartItems, deliveryAddress } = req.body;

    try {
        const orderId = `ORD_${Date.now()}`; // Generate a unique transaction ID
        const callbackUrl = `${req.protocol}://${req.get("host")}/api/orders/phonepe-callback`; // Construct callback URL

        // Prepare payload for PhonePe
        const payload = {
            merchantId: PHONEPE_MERCHANT_ID,
            transactionId: orderId,
            amount: subtotal * 100, // Convert subtotal to paise
            merchantUserId: currentUser._id,
            redirectUrl: callbackUrl,
        };

        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64");
        const checksum = crypto.createHmac("sha256", PHONEPE_SECRET_KEY).update(encodedPayload).digest("base64");

        // Initiate payment request to PhonePe
        const response = await axios.post(`${PHONEPE_BASE_URL}/pg/v1/pay`, encodedPayload, {
            headers: {
                "Content-Type": "application/json",
                "X-VERIFY": checksum,
            },
        });

        if (response.data.success) {
            // Save the order to the database
            const newOrder = new Order({
                name: currentUser.name,
                email: currentUser.email,
                userid: currentUser._id,
                orderItems: cartItems,
                deliveryAddress,
                orderAmount: subtotal,
                transactionId: orderId,
            });

            await newOrder.save();
            res.send({ paymentUrl: response.data.data.paymentUrl }); // Return payment URL to frontend
        } else {
            res.status(400).json({ message: "Payment initiation failed" });
        }
    } catch (error) {
        res.status(400).json({ message: `Error: ${error.message}` });
    }
});

// Handle PhonePe payment callback
router.post("/phonepe-callback", (req, res) => {
    console.log("Payment callback received:", req.body);
    // Ideally, verify the callback's integrity using PhonePe's signature or checksum
    res.sendStatus(200); // Respond with HTTP 200 to acknowledge receipt
});

// Get user orders
router.post("/getuserorders", async (req, res) => {
    const { userid } = req.body;

    try {
        const orders = await Order.find({ userid }).sort({ _id: -1 }); // Fetch and sort by recent
        res.send(orders);
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" });
    }
});

// Get all orders (admin functionality)
router.get("/getallorders", async (req, res) => {
    try {
        const orders = await Order.find({});
        res.send(orders);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Mark order as delivered (admin functionality)
router.post("/deliverorder", async (req, res) => {
    const { orderid } = req.body;

    try {
        const order = await Order.findOne({ _id: orderid });
        if (!order) {
        return res.status(404).json({ message: "Order not found" });
        }
        order.isDelivered = true;
        await order.save();
        res.send("Order Delivered Successfully");
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
