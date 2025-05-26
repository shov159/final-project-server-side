const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const apiRouter = require("./routes/api");

dotenv.config({ path: "./config/.env" });

const app = express();

app.use(bodyParser.json());
app.use("/api", apiRouter);
app.get("/", (req, res) => {
  res.send(`
    <h1> Cost Manager API</h1>
    <p>Status: <strong>Running</strong></p>
    <p>Available endpoints:</p>
    <ul>
      <li><a href="/api/about">/api/about</a></li>
      <li><a href="/api/users/123123">/api/users/:id</a></li>
      <li><a href="/api/report?id=123123&year=2025&month=5">/api/report</a></li>
    </ul>
  `);
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

module.exports = app;
