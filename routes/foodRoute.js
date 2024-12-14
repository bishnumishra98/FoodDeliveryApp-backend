const express = require("express");
const router = express.Router();
const Food = require("../models/foodModel");
const cloudinary = require('cloudinary').v2;
const multer = require("multer");
const upload = multer({ dest: "uploads/" });   // temporary storage for uploaded files

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUDNAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.get("/getallfoods", async (req, res) => {
    try {
        const foods = await Food.find({});
        res.send(foods);
    } catch (error) {
        return res.status(400).json({ message: error });
    }
});

router.post("/addfood", upload.single("image"), async (req, res) => {
    const food = JSON.parse(req.body.food);   // form data requires parsing
    const imageFile = req.file.path;   // path of the uploaded file
	console.log("imageFile", imageFile);
	

    try {
        // Upload image to Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(imageFile);

        // Create new food item with Cloudinary image URL
        const newfood = new Food({
            name: food.name,
            size: food.size,
            price: food.price,
            category: food.category,
            image: uploadResponse.secure_url,   // save Cloudinary URL
            description: food.description,
        });

        await newfood.save();
        res.send("New food added successfully");
    } catch (error) {
        return res.status(400).json({ message: error });
    }
});

module.exports = router;
