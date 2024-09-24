const mongoose = require("mongoose");
var mongoURL = "mongodb+srv://bishnumishra1109:ShreeRam@123@cluster0.vtyquxg.mongodb.net/food-delivery-app";

mongoose.connect(mongoURL, {useUnifiedTopoly: true, useNewUrlParser: true})

var db = mongoose.connection

db.on('connection', () => {
    console.log(`MongoDB connection successfull`);
})

db.on('error', () => {
    console.log(`MongoDB connection failed`);
})

module.exports = mongoose
