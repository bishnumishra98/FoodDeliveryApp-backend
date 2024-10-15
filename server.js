const express = require("express");
const Pizza  = require('./models/pizzaModel');
const db = require("./db");
const cors = require('cors');


const app = express();

app.use(express.json());

app.use(cors({
    origin: 'http://localhost:3000',   // allow requests from the React app
    credentials: true   // if you want to allow cookies or credentials
}));

const pizzasRoute = require('./routes/pizzaRoute');
app.use('./api/pizzas/', pizzasRoute);

app.get("/", (req, res) => {
    res.send("Server working at port: " + port);
});

// app.get("/getpizzas", async (req, res) => {
//     try {
//         const pizzas = await Pizza.find({});
//         res.send(pizzas);
//     } catch (err) {
//         console.log(err);
//         res.status(500).send("Error retrieving pizzas");
//     }
// });

const port = process.env.PORT || 8000;

app.listen(port, () => `Server running`);
