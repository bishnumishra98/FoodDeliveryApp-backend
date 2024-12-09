const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const axios = require("axios");
const Order = require("../models/orderModel");

// Load environment variables
const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY;
const PHONEPE_TEST_URL = process.env.PHONEPE_TEST_URL;

// Place order and initiate payment
router.post("/placeorder", async (req, res) => {
    const { currentUser, cartItems, subtotal, deliveryAddress } = req.body;
    console.log(currentUser);
    console.log(cartItems);
    console.log(subtotal);
    console.log(deliveryAddress);

    try {
        const orderId = `ORD_${Date.now()}`;   // generate a unique transaction ID

        // Prepare payload for PhonePe
        const payload = {
            merchantId: PHONEPE_MERCHANT_ID,
            merchantTransactionId: orderId,
            name: deliveryAddress.name,
            contact: deliveryAddress.contact,
            amount: subtotal * 100,   // convert subtotal to rupee
            redirectUrl: `${process.env.BACKEND_URL}/status?id=${orderId}`,
            redirectMode: "POST",
            paymentInstrument: {
                type: "PAY_PAGE"
            }
        };

        const keyIndex = 1;   // default keyIndex in PhonePe is 1
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64");
        // const checksum = crypto.createHmac("sha256", PHONEPE_SALT_KEY).update(encodedPayload).digest("base64");
        const sha256 = crypto.createHash("sha256").update(encodedPayload + "/pg/v1/pay" + PHONEPE_SALT_KEY).digest("hex");
        const checksum = sha256 + "###" + keyIndex;

        // Initiate payment request to PhonePe
        const response = await axios.post(`${PHONEPE_TEST_URL}`,encodedPayload, {
            headers: {
                "accept": "application/json",
                "Content-Type": "application/json",
                "X-VERIFY": checksum,
            },
            data: {
                request: encodedPayload
            }
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
            res.send({ paymentUrl: response.data.data.paymentUrl });   // Return payment URL to frontend
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
