const mongoose = require("mongoose");

const mongoURL = "mongodb+srv://food-delivery-app:d6LgjPI5453c6a5b@cluster0.vtyquxg.mongodb.net/food-delivery-app"

mongoose.connect(mongoURL);

const db = mongoose.connection;

db.once("open", () => {
    console.log("Connected to MongoDB");
});

db.on("error", (error) => {
    console.log("Failed to establish connection with MongoDB: ", error);
});

module.exports = mongoose
