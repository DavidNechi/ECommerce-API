const express = require("express");

const app = express();

// Midelware
app.use(express.json());

//Test route
app.get("/", (req, res) => {
    res.json({ message: "API is running" });
});

module.exports = app;