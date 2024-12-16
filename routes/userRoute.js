const express = require("express");
const router = express.Router();
const User = require("../models/userModel");

router.post("/register", async (req, res) => {
    const {name, email, password} = req.body;

    const newUser = new User({name, email, password});   // create a new User object

    try {
        await newUser.save();   // save the user to the database
        res.send("User registered successfully.");
    } catch(error) {
        return res.status(400).json({ message: error });
    }
});

router.post("/login", async (req, res) => {
    const {email , password} = req.body

    try {
        const user = await User.find({email , password});   // search for user in the database

        if(user.length > 0) {   // check if the user exists
            const currentUser = {
                name : user[0].name , 
                email : user[0].email, 
                isAdmin : user[0].isAdmin, 
                _id : user[0]._id
            }
            res.send(currentUser);   // send user data as response
        } else {
            return res.status(400).json({ message: 'User Login Failed' });
        }

    } catch (error) {
           return res.status(400).json({ message: 'Something went weong' });
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
