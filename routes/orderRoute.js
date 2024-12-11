const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const axios = require("axios");
const { v4: uuidv4 } = require('uuid');
const Order = require("../models/orderModel");
const TempOrder = require("../models/temporderModel");

// Load environment variables
const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY;
const PHONEPE_TEST_BASE_URL = process.env.PHONEPE_TEST_BASE_URL;
const BACKEND_URL = process.env.BACKEND_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;

// Generate a unique transaction ID
const orderId = `ORD_${uuidv4().replace(/-/g, '')}`;   // remove hyphens from uuid, because PhonePe API does not accept special characters (like hyphens)

// Set default saltIndex in PhonePe, i.e., 1
const saltIndex = 1;

// Place order and initiate payment
router.post("/placeorder", async (req, res) => {
    const { currentUser, cartItems, subtotal, deliveryAddress } = req.body;
    // console.log(currentUser);
    // console.log(cartItems);
    // console.log(subtotal);
    // console.log(deliveryAddress);

    try {
        // Step 1: Prepare payload for PhonePe.
        const payload = {
            merchantId: PHONEPE_MERCHANT_ID,   // unique ID of the merchant
            merchantTransactionId: orderId,   // unique transaction ID for this order
            name: deliveryAddress.name,
            contact: deliveryAddress.contact,
            amount: subtotal * 100,   // convert subtotal to rupee
            redirectUrl: `${BACKEND_URL}/api/orders/status?id=${orderId}`,
            redirectMode: "POST",   // HTTP method for redirection
            paymentInstrument: {
                type: "PAY_PAGE"   // payment type; "PAY_PAGE" opens a payment gateway page
            }
        };

        // Encode the payload and generate checksum for request verification
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64");
        const string = encodedPayload + "/pg/v1/pay" + PHONEPE_SALT_KEY;
        const sha256 = crypto.createHash("sha256").update(string).digest("hex");
        const checksum = sha256 + "###" + saltIndex;

        // Step 2: Prepare payment request for PhonePe API.
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

        // Step 3: Send the payment initiation request to PhonePe API with the configured options.
        const response = await axios(options);
        
        // Step 4: If payment initiation is successful, then save the order to the 'temporders' collection in DB and send response to frontend.
        if (response.data.success) {
            const newOrder = new TempOrder({
                name: currentUser.name,
                email: currentUser.email,
                userid: currentUser._id,
                orderItems: cartItems,
                deliveryAddress,
                orderAmount: subtotal,
                transactionId: orderId,
            });
            await newOrder.save();   // save newOrder to the database
            res.json(response.data);   // send payment initiation success response to frontend
        } else {
            res.status(400).json({ message: "Payment initiation failed" });
        }
    } catch (error) {
        if (!res.headersSent) {
            return res.status(500).json({ error: error.message });
        }
    }
});

// Handle redirect url after payment
router.post("/status", async (req, res) => {
    try {
        const merchantId = PHONEPE_MERCHANT_ID;
        const merchantTransactionId = req.query.id;
        const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + PHONEPE_SALT_KEY;
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

        // Make request to PhonePe to check payment status
        const response = await axios.request(options);

        // If payment is successful, save the 'temporders' collection permanently into 'orders' collection, and redirect the user to orders page.
        if (response.data.success) {
            // Retrieve temporary order details
            const temp = await TempOrder.findOne({ transactionId: merchantTransactionId });
            console.log("temp:", temp);
            
            if(!temp) {
                return res.status(404).json({ message: "Temporary order not found" });
            }

            // Save 'temporders' collection permanently into 'orders' collection
            const newOrder = new Order({
                name: temp.name,
                email: temp.email,
                userid: temp.userid,
                orderItems: temp.orderItems,
                deliveryAddress: temp.deliveryAddress,
                orderAmount: temp.orderAmount,
                transactionId: temp.transactionId,
            });
            await newOrder.save();   // save newOrder to the database

            // Remove temporary order
            await TempOrder.deleteOne({ transactionId: merchantTransactionId });

            // Redirect the user to orders page
            const url = `${FRONTEND_URL}/orders`;
            return res.redirect(url);
        } else {
            res.send("Payment failed");
        }
    } catch (error) {
        return res.status(400).json({ message: `Something went wrong: ${error.message}` });
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
