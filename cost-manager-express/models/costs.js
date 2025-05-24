const mongoose = require("mongoose");

const costSchema = new mongoose.Schema({
  userid: { type: Number, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ["food", "health", "housing", "sport", "education"],
    required: true,
  },
  sum: { type: Number, required: true },
  day: Number,
  month: Number,
  year: Number,
});

module.exports = mongoose.model("Cost", costSchema);
