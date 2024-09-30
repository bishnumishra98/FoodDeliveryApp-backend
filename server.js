const express = require("express");
const Pizza  = require('./models/pizzaModel');
const db = require("./db");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server working at port: " + port);
});

app.get("/getpizzas", async (req, res) => {
    try {
        const pizzas = await Pizza.find({});
        res.send(pizzas);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error retrieving pizzas");
    }
});


const port = process.env.PORT || 8000;

app.listen(port, () => `Server running`);
