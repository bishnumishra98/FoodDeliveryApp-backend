const express = require("express");
const router = express.Router();
const Food = require("../models/foodModel");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

// Set up Multer to use memory storage
const storage = multer.memoryStorage();   // Store files in memory(RAM)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg\+xml|webp/;
    const mimeType = allowedTypes.test(file.mimetype);

    if (mimeType) {
        cb(null, true);   // allow file
    } else {
        cb(new Error("Invalid file type! Only images and gifs are allowed."), false);   // reject file
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },   // 10MB limit
    fileFilter: fileFilter,
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

// Route to get food by its id
router.post("/getfoodbyid", async (req, res) => {
    const foodId = req.body.foodId;

    try {
        const food = await Food.findOne({ _id: foodId });
        res.send(food);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
});

// Route to add food with image upload
router.post("/addfood", upload.single("image"), async (req, res) => {
    if (req.fileValidationError) {
        return res.status(400).json({ message: req.fileValidationError });
    }

    try {
        const food = JSON.parse(req.body.food);   // parse the food object

        // Upload image to Cloudinary directly from memory buffer
        const uploadResponse = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { resource_type: "image" },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(req.file.buffer);
        });

        // Create new food item with Cloudinary image URL
        const newfood = new Food({
            name: food.name,
            size: food.size,
            price: food.price,
            category: food.category,
            image: uploadResponse.secure_url,
            imageName: food.imageName,
            image_public_id: uploadResponse.public_id,
            description: food.description,
        });

        await newfood.save();
        res.send("New food added successfully");
    } catch (error) {
        console.error("Error adding food:", error.message);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

// Route to edit food with image upload
router.put("/editfood", upload.single("image"), async (req, res) => {
    if (req.fileValidationError) {
        return res.status(400).json({ message: req.fileValidationError });
    }

    try {
        const editedFood = JSON.parse(req.body.food);

        // Find the existing food item in the database
        const food = await Food.findOne({ _id: editedFood._id });
        if (!food) {
            return res.status(404).json({ message: "Food item not found" });
        }

        // If a new image is uploaded, update image fields
        if (req.file) {
            // Upload the new image to Cloudinary
            const uploadResponse = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { resource_type: "image" },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                ).end(req.file.buffer);
            });

            // Delete the old image from Cloudinary, if it exists
            if (food.image_public_id) {
                await cloudinary.uploader.destroy(food.image_public_id);
            }

            // Update image fields
            food.image = uploadResponse.secure_url;
            food.image_public_id = uploadResponse.public_id;
        }

        // Update other fields
        food.name = editedFood.name;
        food.size = editedFood.size;
        food.price = editedFood.price;
        food.category = editedFood.category;
        food.imageName = editedFood.imageName;
        food.description = editedFood.description;

        // Save updated food details to the database
        await food.save();
        res.send("Food details edited successfully");
    } catch (error) {
        console.error("Error editing food:", error.message);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

// Route to delete food
router.delete("/deletefood", async (req, res) => {
    const foodid = req.body.foodid;

    try {
        // Find the food which needs to be deleted
        const food = await Food.findOne({ _id: foodid });

        // Delete the food image file from Cloudinary
        if (food.image_public_id) {
            await cloudinary.uploader.destroy(food.image_public_id);
        }

        // Delete the whole food from DB
        await Food.findByIdAndDelete(food._id);
        res.send("Food deleted successfully");
    } catch (error) {
        console.error("Error deleting food:", error.message);
        return res.status(400).json({ message: error });
    }
});

module.exports = router;
