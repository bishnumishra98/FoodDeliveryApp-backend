const express = require("express");
const router = express.Router();
const Food = require("../models/foodModel");

router.get("/getallfoods", async (req, res) => {
	try {
		const foods = await Food.find({});
		res.send(foods);
	} catch (error) {
		return res.status(400).json({ message: error });
	}
});

router.post("/addfood", async (req, res) => {
    const food = req.body.food;

	try {
		const newfood = new Food({
			name: food.name,
			size: food.size,
			price: food.price,
			category: food.category,
			image: food.image,
			description: food.description,
		})
		await newfood.save()
		res.send('New food added successfully')
	} catch (error) {
		return res.status(400).json({ message: error });
	}
});

module.exports = router;
