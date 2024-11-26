const express = require("express");
const Food = require("./models/foodModel");
const db = require("./db");
const cors = require("cors");

const app = express();

app.use(express.json());

app.use(
	cors({
		origin: "http://localhost:3000", // allow requests from the React app
		credentials: true, // if you want to allow cookies or credentials
	})
);

const foodsRoute = require("./routes/foodRoute");
const userRoute = require("./routes/userRoute");

app.use("/api/foods/", foodsRoute);
app.use("/api/users/", userRoute);

app.get("/", (req, res) => {
  	res.send("Server working at port: " + port);
});

const port = process.env.PORT || 8000;

app.listen(port, () => `Server running`);
