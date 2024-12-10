const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const axios = require("axios");
const Order = require("../models/orderModel");

// Load environment variables
const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY;
const PHONEPE_TEST_BASE_URL = process.env.PHONEPE_TEST_BASE_URL;
const BACKEND_URL = process.env.BACKEND_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;

// Generate a unique transaction ID
const orderId = `ORD_${Date.now()}`;

// Set default saltIndex in PhonePe, i.e., 1.
const saltIndex = 1;

// Place order and initiate payment
router.post("/placeorder", async (req, res) => {
    const { currentUser, cartItems, subtotal, deliveryAddress } = req.body;
    console.log(currentUser);
    console.log(cartItems);
    console.log(subtotal);
    console.log(deliveryAddress);

    try {
        // Step 1: Prepare payload for PhonePe
        const payload = {
            merchantId: PHONEPE_MERCHANT_ID,
            merchantTransactionId: orderId,
            name: deliveryAddress.name,
            contact: deliveryAddress.contact,
            amount: subtotal * 100,   // convert subtotal to rupee
            redirectUrl: `${BACKEND_URL}/status?id=${orderId}`,
            redirectMode: "POST",
            paymentInstrument: {
                type: "PAY_PAGE"
            }
        };

        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64");
        const string = encodedPayload + "/pg/v1/pay" + PHONEPE_SALT_KEY;
        const sha256 = crypto.createHash("sha256").update(string).digest("hex");
        const checksum = sha256 + "###" + saltIndex;

        // Step 2: Initiate payment request to PhonePe
        const options = {
            method: "POST",
            url: `${PHONEPE_TEST_BASE_URL}/pg/v1/pay`,
            headers: {
                accept: "application/json",
                "Content-Type": "application/json",
                "X-VERIFY": checksum,
            },
            data: {
                request: encodedPayload
            }
        }

        try {
            const response = await axios(options);
            console.log(response.data);
            res.json(response.data);
        } catch (error) {
            console.error(error.message);
            if (!res.headersSent) {   // prevent sending headers twice to avoid error: 429
                res.status(500).json({ error: error.message });
            }
        }
        
        // 3. If initiate payment is successful, then save the order to the database
        if (response.data.success) {
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
            res.send({ paymentUrl: response.data.data.instrumentResponse.redirectInfo.url });   // Return payment URL to frontend
        } else {
            res.status(400).json({ message: "Payment initiation failed" });
        }
    } catch (error) {
        res.status(400).json({ message: `Error: ${error.message}` });
    }
});

// Handle redirect url after payment
router.post("/status", async (req, res) => {
    try {
        const merchantId = PHONEPE_MERCHANT_ID;
        const merchantTransactionId = orderId;
        const string = `pg/v1/status/${merchantId}/${merchantTransactionId}` + PHONEPE_SALT_KEY;
        const sha256 = crypto.createHash("sha256").update(string).digest("hex");
        const checksum = sha256 + "###" + saltIndex;

        const options = {
            method: 'GET',
            url: `${PHONEPE_TEST_BASE_URL}/pg/v1/status/${merchantId}/${merchantTransactionId}`,
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
                'X-MERCHANT-ID': merchantId
            }
        }

        const response = await axios.request(options);

        // If payment was successful, redirect the user to orders page.
        if (response.data.success) {
            const url = `${FRONTEND_URL}/orders`;
            return res.redirect(url);
        } else {
            res.send("Payment failed");
        }
    } catch (error) {
        return res.status(400).json({ message: 'Something went wrong' + error});
    }
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
