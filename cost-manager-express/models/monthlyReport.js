const mongoose = require("mongoose");

const MonthlyReportSchema = new mongoose.Schema(
  {
    userid: {
      type: String,
      required: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
    },
    costs: {
      food: { type: Array, default: [] },
      health: { type: Array, default: [] },
      housing: { type: Array, default: [] },
      sport: { type: Array, default: [] },
      education: { type: Array, default: [] },
    },
  },
  { collection: "monthlyReports", timestamps: true }
);

module.exports = mongoose.model("MonthlyReport", MonthlyReportSchema);
