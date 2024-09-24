const express = require("express");

const db = require("./db");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server working" + port);
});

const port = process.env.PORT || 8000;

app.listen(port, () => `Server running`);
