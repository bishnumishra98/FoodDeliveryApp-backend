const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./db");
const Order = require("./models/orderModel"); // Assuming you have an Order model

// Initialize the Express application
const app = express();
connectDB(); // connect to the database

// Middleware to parse incoming JSON requests
app.use(express.json());

// Configure CORS to allow requests from the React frontend
app.use(
	cors({
		origin: "*", // allow requests from all origins
		credentials: true, // allow cookies or credentials
	})
);

// Import route handlers
const foodsRoute = require("./routes/foodRoute");
const userRoute = require("./routes/userRoute");
const orderRoute = require("./routes/orderRoute");

// Define API routes
app.use("/api/foods/", foodsRoute);
app.use("/api/users/", userRoute);
app.use("/api/orders/", orderRoute);

// Root route for basic server response
app.get("/", (req, res) => {
  	res.send("Server working at port: " + port);
});

// Create HTTP server and integrate with Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",   // allow frontend requests
		methods: ["GET", "POST"],
	},
});

// WebSocket connection setup
io.on("connection", (socket) => {
	console.log("A client connected");

	// Listen for 'updateOrderStatus' from admin panel
	socket.on("updateOrderStatus", async (data) => {
		console.log("Order status updated:", data);
	
		try {
			// Ensure data contains valid orderId and delivery status
			if (!data.orderId || !data.newStatus) {
				console.error("Invalid data received:", data);
				return;
			}
	
			const orderId = data.orderId;
			const newStatus = data.newStatus;
	
			// Update the order without manually converting ObjectId
			const updatedOrder = await Order.findByIdAndUpdate(
				orderId, // Pass string ID directly
				{ deliveryStatus: newStatus },
				{ new: true }
			);
	
			// Check if the order was updated
			if (!updatedOrder) {
				console.error("Order not found for ID:", orderId);
				return;
			}
	
			// Emit updated order status to all connected clients
			io.emit("orderStatusUpdated", updatedOrder);
			console.log("Order status updated and emitted:", updatedOrder);
		} catch (error) {
			console.error("Error updating order status:", error);
		}
	});	

	// Handle disconnection
	socket.on("disconnect", () => {
		console.log("A client disconnected");
	});
});

// Define the port for the server to listen on
const port = process.env.PORT || 8000;

// Start the server
server.listen(port, () => {
  	console.log(`Server running at http://localhost:${port}`);
});
