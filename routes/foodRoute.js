const express = require("express");
const router = express.Router();
const Food = require("../models/foodModel");
const cloudinary = require('cloudinary').v2;
const multer = require("multer");

// Set up Multer to restrict file size and types
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');   // set destination folder for temporary uploads
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);   // set unique filename
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg\+xml/;
    const mimeType = allowedTypes.test(file.mimetype);

    if (mimeType) {
        cb(null, true);   // allow file
    } else {
        cb(new Error('Invalid file type! Only images and gifs are allowed.'), false);   // reject file
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },   // set file size limit to 10MB
    fileFilter: fileFilter,   // set file type filter
});

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUDNAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Route to get all food items
router.get("/getallfoods", async (req, res) => {
    try {
        const foods = await Food.find({});
        res.send(foods);
    } catch (error) {
        return res.status(400).json({ message: error });
    }
});

// Route to add food with image upload
router.post("/addfood", upload.single("image"), async (req, res) => {
    // If there is an error during file upload, handle it
    if (req.fileValidationError) {
        return res.status(400).json({ message: req.fileValidationError });
    }

    // If file size exceeds limit, multer will throw an error
    if (req.file && req.file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ message: "File size exceeds 10MB." });
    }

    const food = JSON.parse(req.body.food);   // parse the food object
    const imageFile = req.file.path;   // get the uploaded file path

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
