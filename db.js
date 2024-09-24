const mongoose = require("mongoose");

const mongoURL = "mongodb+srv://food-sharing-app:vsL1p4S0ByBW6iVh@cluster0.vtyquxg.mongodb.net/"

mongoose.connect(mongoURL);

const db = mongoose.connection;

db.once("open", () => {
    console.log("Connected to MongoDB");
});

db.on("error", (error) => {
    console.log("Failed to establish connection with MongoDB: ", error);
});

module.exports = mongoose
