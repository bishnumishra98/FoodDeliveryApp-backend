const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");

router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if any user exists already with this email or not
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "This email is already registered" });
        }

        // Hash the password before saving to the database
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ name, email, password: hashedPassword });   // save hashed password
        await newUser.save();   // save user to the database

        res.send("User registered successfully.");
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
});

// Rate limiter for login route
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 minutes
    max: 5,   // allow up to 5 login attempts
    message: { 
      status: 429,
      message: "Too many login attempts. Please try again after 15 minutes." 
    }, 
    standardHeaders: true,   // return rate limit info in headers
    legacyHeaders: false,   // disable the `X-RateLimit-*` headers
});

router.post("/login", loginLimiter, async (req, res) => {
    const { email, password } = req.body;

    try {
        // Trim and validate inputs
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }

        // Find user by email
        const user = await User.findOne({ email: email.trim() });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const currentUser = {
                name: user.name,
                email: user.email,
                _id: user._id,
            };
            res.send(currentUser);   // send user data as response
        } else {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

router.get("/getallusers", async(req, res) => {
    try {
        const users = await User.find({});
        res.send(users);
    } catch (error) {
        return res.status(400).json({ message: error });
    }
  
});

router.put("/updatestatus", async (req, res) => {
    const { userId, isAdmin } = req.body;

    try {
        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update the user's admin status
        user.isAdmin = isAdmin;
        await user.save();

        res.status(200).json({ message: "User status updated successfully", user });
    } catch (error) {
        console.error("Error updating user status:", error.message);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

router.post("/deleteuser", async(req, res) => {
    const userid = req.body.userid;

    try {
        await User.findOneAndDelete({_id : userid});
        res.send("User deleted successfully");
    } catch (error) {
        return res.status(400).json({ message: error });
    }
});


module.exports = router;
