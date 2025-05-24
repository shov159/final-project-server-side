const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const apiRouter = require("./routes/api");

dotenv.config({ path: "./config/.env" });

const app = express();

app.use(bodyParser.json());
app.use("/api", apiRouter);

mongoose
  .connect(process.env.MONGO_URI)

  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

module.exports = app;
