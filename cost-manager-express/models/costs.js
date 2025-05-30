const mongoose = require("mongoose");

const CostSchema = new mongoose.Schema({
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

CostSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("cost", CostSchema);
