const express = require("express");
const router = express.Router();
const Food = require("../models/foodModel");
const cloudinary = require('cloudinary').v2;
const multer = require("multer");
const fs = require("fs");

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
    const allowedTypes = /jpeg|jpg|png|gif|svg\+xml|webp/;
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

// Function to delete the temporary stored image file from the server
const deleteFileFromServer = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(`Failed to delete file: ${filePath}. Error: ${err.message}`);
        } else {
            console.log(`File deleted: ${filePath}`);
        }
    });
};

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
    // If there is an error during file upload, handle it
    if (req.fileValidationError) {
        return res.status(400).json({ message: req.fileValidationError });
    }

    // If file size exceeds limit, multer will throw an error
    if (req.file && req.file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ message: "File size should not exceed 10MB." });
    }

    try {
        const food = JSON.parse(req.body.food);   // parse the food object
        const imageFile = req.file.path;   // get the uploaded file path
        // console.log(imageFile);

        // Upload image to Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(imageFile);

        // Delete the file from server after successful upload to Cloudinary
        deleteFileFromServer(imageFile);

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
        return res.status(400).json({ message: error });
    }
});

// Route to edit food with image upload
router.put("/editfood", upload.single("image"), async (req, res) => {
	// If there is an error during file upload, handle it
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
            const editedImageFile = req.file.path;   // uploaded file path

            // Upload the new image to Cloudinary
            const uploadResponse = await cloudinary.uploader.upload(editedImageFile);

            // Delete the old image from Cloudinary, if it exists
            if (food.image_public_id) {
                await cloudinary.uploader.destroy(food.image_public_id);
            }

            // Delete the file from server after successful upload to Cloudinary
            deleteFileFromServer(editedImageFile);

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
router.delete("/deletefood", async(req, res) => {
    const foodid = req.body.foodid;
    // console.log(foodid);
    
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
        return res.status(400).json({ message: error });
    }
});


module.exports = router;
