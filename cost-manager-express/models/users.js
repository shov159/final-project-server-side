/**
 * Mongoose schema for user data.
 * This schema defines the structure of documents representing individual users.
 * Each user has a unique identifier, name details, birthday, and marital status.
 *
 * @module models/users
 */
const mongoose = require("mongoose");
/**
 * Mongoose schema for a user record.
 *
 * @typedef {Object} User
 * @property {string} id - A unique string identifier for the user.
 * @property {string} first_name - User's first name.
 * @property {string} last_name - User's last name.
 * @property {Date} birthday - User's birthdate.
 * @property {string} marital_status - User's marital status. Allowed values: 'single', 'married', 'divorced', 'widowed'.
 */
const UserSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
    },
    birthday: {
      type: Date,
    },
    marital_status: {
      type: String,
    },
  }
);
/**
 * Mongoose model for storing user records.
 * Each record represents a unique user with personal and demographic information.
 *
 * @type {mongoose.Model<user>}
 */
module.exports = mongoose.model("user", UserSchema);
