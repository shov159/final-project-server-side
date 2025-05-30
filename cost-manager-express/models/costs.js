/**
 * Mongoose schema for cost entries.
 * This schema defines the structure of expense documents stored in the database.
 * Each entry is linked to a specific user and contains details like description, category, amount, and date.
 * @module models/costs
 */
const mongoose = require("mongoose");
/**
 * Mongoose schema for a single cost entry.
 *
 * @typedef {Object} CostSchema
 * @property {string} userid - ID of the user who logged the expense.
 * @property {string} description - A short description of what the cost was for.
 * @property {string} category - Category of the expense (must be one of: 'food', 'health', 'housing', 'sport', 'education').
 * @property {number} sum - The amount spent (must be a positive number).
 * @property {Date} date - The date the expense occurred (defaults to current date).
 */
const CostSchema = new mongoose.Schema(
  {
    userid: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["food", "health", "housing", "sport", "education"],
      required: true,
    },
    sum: {
      type: Number,
      required: true,
    },
    day: {
      type: Number,
    },
    month: {
      type: Number,
    },
    year: {
      type: Number,
    },
  }
);
/**
 * Mongoose model for storing user cost records.
 *
 * @type {mongoose.Model<CostSchema>}
 */
module.exports = mongoose.model("cost", CostSchema);

