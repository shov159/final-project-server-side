/**
 * Mongoose schema for tracking monthly cost reports.
 * This schema defines the structure of reports that track categorized expenses for each user, organized by month and year.
 *
 * @module models/monthlyReport
 */
const mongoose = require("mongoose");
/**
 * Mongoose schema for a monthly expense report.
 *
 * @typedef {Object} MonthlyReport
 * @property {string} userid - The ID of the user this report belongs to.
 * @property {number} year - The year of the expense report.
 * @property {number} month - The month of the report (1-12).
 * @property {Object} costs - An object storing categorized expenses for the given month. 
 *                             Each category holds an array of cost entries for that month.
 */
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
/**
 * Mongoose model for storing monthly cost reports.
 * This model tracks user expenses categorized by month and year.
 *
 * @const {mongoose.Model<monthlyReport>}
 */
module.exports = mongoose.model("monthlyReport", MonthlyReportSchema);
