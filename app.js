const express = require("express");
const app = express();
const cors = require("cors");

// Middleware
app.use(express.json());
app.use(cors());

// Import routes
const bookRoutes = require("./routes/bookRoutes");

// Use routes (important: "/api/books")
app.use("/api", bookRoutes);

module.exports = app;
