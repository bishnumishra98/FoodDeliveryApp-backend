const express = require("express");
const app = express();   // initialize the Express application
// const Food = require("./models/foodModel");
const connectDB = require("./db");
connectDB();

const cors = require("cors");

app.use(express.json());   // middleware to parse incoming JSON requests

// Configure CORS to allow requests from the React frontend
app.use(
	cors({
		origin: "*",   // allow requests from all clients
		credentials: true,   // if you want to allow cookies or credentials
	})
);

// Import route handlers
const foodsRoute = require("./routes/foodRoute");   // handles routes for food-related endpoints
const userRoute = require("./routes/userRoute");   // handles routes for user-related endpoints
// const ordersRoute = request('./routes/ordersRoute');   // handles routes for order-related endpoints

// Define API routes
app.use("/api/foods/", foodsRoute);   // prefix for all food-related routes
app.use("/api/users/", userRoute);   // prefix for all user-related routes
// app.use("/api/orders/", ordersRoute);   // prefix for all order-related routes

// Root route for basic server response
app.get("/", (req, res) => {
  	res.send("Server working at port: " + port);
});

// Define the port for the server to listen on
const port = process.env.PORT || 8000;   // use environment variable or default to 8000

// Start the server and listen for incoming requests
app.listen(port, () => `Server running`);   // log confirmation when the server starts
