const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
		name: { type: String, required: true },
		size: { type: String, required: true },
		price: { type: Number, required: true },
		category: { type: String, required: true },
		image: { type: String, required: true },
		imageName: { type: String, required: true },
		image_public_id: { type: String, required: true },
		description: { type: String, required: true },
	}, {
		timestamps: true,   // adds createdAt and updatedAt fields automatically
	}
);

const foodModel = mongoose.model("food", foodSchema);   // "food" is the collection name

module.exports = foodModel;
