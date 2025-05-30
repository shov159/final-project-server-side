const mongoose = require("mongoose");

const MonthlyReportSchema = new mongoose.Schema(
    {
        userid: {
            type: String,
            required: true,
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
            type: Object,
            required: true
        }

    });

module.exports = mongoose.model("monthlyReport", MonthlyReportSchema);
