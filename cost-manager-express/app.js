/**
 * Express server for the Cost Manager API.
 * This server handles routing for user expenses and reports, and connects to MongoDB.
 * 
 * @module app
 */
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const apiRouter = require("./routes/api");

// Load environment variables from .env file
dotenv.config({ path: "./config/.env" });

/**
 * Create an Express application instance.
 * 
 * @const {Express}
 */
const app = express();

// Middleware for parsing JSON bodies
app.use(bodyParser.json());

// Mount API routes under the /api path
app.use("/api", apiRouter);

/**
 * Root endpoint providing a basic HTML interface with available endpoints.
 *
 * @route GET /
 * @returns {HTML} Basic HTML response with route examples
 */
app.get("/", (req, res) => {
  res.send(`
    <h1> cost Manager API</h1>
    <p>Status: <strong>Running</strong></p>
    <p>Available endpoints:</p>
    <ul>
      <li><a href="/api/about">about</a></li>
      <li><a href="/api/users/123123">users/:id</a></li>
      <li><a href="/api/report?id=123123&year=2025&month=5"report</a></li>
    </ul>
  `);
});

/**
 * Connect to MongoDB using the connection string defined in environment variables.
 * Logs a success message if the connection is established, or an error if it fails.
 * 
 * @returns {Promise<void>}
 */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Export the Express application instance
module.exports = app;

