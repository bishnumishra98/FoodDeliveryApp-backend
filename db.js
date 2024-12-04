require("dotenv").config();
const mongoose = require("mongoose");

function connectDB() {
    // connect the application with mongoDB
    mongoose.connect(process.env.MONGO_CONNECTION_URL);

    // start the connection by accessing the connection object (mongoose.connection)
    const connection = mongoose.connection;

    connection.once("open", () => {
        console.log("Connected to MongoDB");
    });

    connection.on("error", (err) => {
        console.log("Failed to establish connection with MongoDB", err);
    });
}

module.exports = connectDB;
