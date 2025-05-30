/**
 * All the API routes for the project:
 * - Add cost
 * - Monthly report
 * - user details
 * - Development team info
 */
const express = require("express");
const router = express.Router();
const user = require("../models/users");
const cost = require("../models/costs");
const monthlyReport = require("../models/monthlyReport");

/**
 * Add a new cost for a user.
 * @route POST /add
 * @body {string} userid - user ID
 * @body {string} description - cost description
 * @body {string} category - cost category (food, health, housing, sport, education)
 * @body {number} sum - cost amount (must be positive)
 * @body {string} [date] - Optional date (defaults to today)
 */
router.post("/add", async (req, res) => {
  try {
    const userId = req.body.userid ? String(req.body.userid) : null;

    if (
      !userId ||
      !req.body.description ||
      !req.body.category ||
      typeof req.body.sum !== "number" ||
      req.body.sum <= 0
    ) {
      return res.status(400).json({
        error:
          "Missing or invalid parameters. Required: userid, description, category, sum (positive).",
      });
    }

    const validCategories = ["food", "health", "housing", "sport", "education"];
    if (!validCategories.includes(req.body.category)) {
      return res.status(400).json({
        error:
          "Invalid category. Allowed: food, health, housing, sport, education.",
      });
    }

    const dateOfCoast = req.body.date
      ? new Date(req.body.date + "T00:00:00.000Z")
      : new Date();
    if (isNaN(dateOfCoast.getTime())) {
      return res.status(400).json({ error: "Invalid date format." });
    }

    const searchUser = await user.findOne({ id: userId });
    if (!searchUser) {
      return res.status(404).json({ error: "user not found." });
    }

    const newCost = new cost({
      description: req.body.description,
      category: req.body.category,
      userid: userId,
      sum: req.body.sum,
      date: dateOfCoast,
    });

    const savedCost = await newCost.save();

    const year = dateOfCoast.getFullYear();
    const month = dateOfCoast.getMonth() + 1;

    const monthlyReportWhenExists = await monthlyReport.findOne({
      userid: userId,
      year: year,
      month: month,
    });
    if (monthlyReportWhenExists) {
      if (!monthlyReportWhenExists.costs[req.body.category]) {
        monthlyReportWhenExists.costs[req.body.category] = [];
      }

      await monthlyReport.updateOne(
        { userid: userId, year, month },
        {
          $push: {
            [`costs.${req.body.category}`]: {
              sum: savedCost.sum,
              description: savedCost.description,
              day: dateOfCoast.getDate(),
            },
          },
        }
      );
    }

    res.status(201).json({
      cost: {
        description: savedCost.description,
        category: savedCost.category,
        userid: savedCost.userid,
        sum: savedCost.sum,
        date: savedCost.date,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get monthly report for a user.
 * @route GET /report
 * @query {string} id - user ID
 * @query {number} year - Year
 * @query {number} month - Month (1-12)
 */
router.get("/report", async (req, res) => {
  try {
    const { id, year, month } = req.query;

    if (!id || !year || !month) {
      return res.status(400).json({ error: "Missing id, year or month" });
    }

    const idTrim = id.trim();
    const yearNum = Number(year);
    const monthNum = Number(month);

    if (
      isNaN(yearNum) ||
      isNaN(monthNum) ||
      !Number.isInteger(yearNum) ||
      !Number.isInteger(monthNum) ||
      monthNum < 1 ||
      monthNum > 12
    ) {
      return res.status(400).json({ error: "Invalid year or month." });
    }

    const searchUser = await user.findOne({ id: idTrim });
    if (!searchUser) {
      return res.status(404).json({ error: 'user not found.' });
    }

    const existingReport = await monthlyReport.findOne({
      userid: idTrim,
      year: yearNum,
      month: monthNum,
    })
    .select("-_id -__v")
    .lean();

    if (existingReport) {
      return res.json(existingReport);
    }

    const validCategories = ["food", "health", "housing", "sport", "education"];
    const dateStart = new Date(yearNum, monthNum - 1, 1);
    const dateEnd = new Date(yearNum, monthNum, 0);

    const currentCosts = await cost.aggregate([
      {
        $match: {
          userid: idTrim,
          date: { $gte: dateStart, $lte: dateEnd },
          category: { $in: validCategories },
        },
      },
      {
        $group: {
          _id: "$category",
          items: {
            $push: {
              sum: "$sum",
              description: "$description",
              day: { $dayOfMonth: "$date" },
            },
          },
        },
      },
    ]);

    const formattedCosts = {};
    validCategories.forEach((cat) => (formattedCosts[cat] = []));
    for (const categoryData of currentCosts || []) {
      formattedCosts[categoryData._id] = categoryData.items;
    }

    const newReport = new monthlyReport({
      userid: idTrim,
      year: yearNum,
      month: monthNum,
      costs: formattedCosts,
    });

    await newReport.save();

    const responseValue = newReport.toObject();
    delete responseValue._id;
    delete responseValue.__v;
    res.json(responseValue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Add a new cost for a user.
 * @route POST /add
 * @body {string} userid - user ID
 * @body {string} description - cost description
 * @body {string} category - cost category (food, health, housing, sport, education)
 * @body {number} sum - cost amount (must be positive)
 * @body {string} [date] - Optional date (defaults to today)
 */
router.post("/add", async (req, res) => {
  try {
    const userId = req.body.userid ? String(req.body.userid) : null;

    if (
      !userId ||
      !req.body.description ||
      !req.body.category ||
      typeof req.body.sum !== "number" ||
      req.body.sum <= 0
    ) {
      return res.status(400).json({
        error:
          "Missing or invalid parameters. Required: userid, description, category, sum (positive).",
      });
    }

    const validCategories = ["food", "health", "housing", "sport", "education"];
    if (!validCategories.includes(req.body.category)) {
      return res.status(400).json({
        error:
          "Invalid category. Allowed: food, health, housing, sport, education.",
      });
    }

    const dateOfCoast = req.body.date
      ? new Date(req.body.date + "T00:00:00.000Z")
      : new Date();
    if (isNaN(dateOfCoast.getTime())) {
      return res.status(400).json({ error: "Invalid date format." });
    }

    const searchUser = await user.findOne({ id: userId });
    if (!searchUser) {
      return res.status(404).json({ error: "user not found." });
    }

    const newCost = new cost({
      description: req.body.description,
      category: req.body.category,
      userid: userId,
      sum: req.body.sum,
      date: dateOfCoast,
    });

    const savedCost = await newCost.save();

    const year = dateOfCoast.getFullYear();
    const month = dateOfCoast.getMonth() + 1;

    const monthlyReportWhenExists = await monthlyReport.findOne({
      userid: userId,
      year: year,
      month: month,
    });
    if (monthlyReportWhenExists) {
      if (!monthlyReportWhenExists.costs[req.body.category]) {
        monthlyReportWhenExists.costs[req.body.category] = [];
      }

      await monthlyReport.updateOne(
        { userid: userId, year, month },
        {
          $push: {
            [`costs.${req.body.category}`]: {
              sum: savedCost.sum,
              description: savedCost.description,
              day: dateOfCoast.getDate(),
            },
          },
        }
      );
    }

    res.status(201).json({
      cost: {
        description: savedCost.description,
        category: savedCost.category,
        userid: savedCost.userid,
        sum: savedCost.sum,
        date: savedCost.date,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get user details and total expenses.
 * @route GET /users/:id
 */
router.get("/users/:id", async (req, res) => {
  try {
    const id = req.params.id?.trim();
    if (!id) {
      return res.status(400).json({ error: "user ID is required." });
    }

    const searchUser = await user.findOne({ id }, "first_name last_name id");
    if (!searchUser) {
      return res.status(404).json({ error: "user not found." });
    }

    const amountCosts = await cost.aggregate([
      { $match: { userid: id } },
      { $group: { _id: null, total: { $sum: "$sum" } } },
    ]);

    res.status(200).json({
      id: searchUser.id,
      first_name: searchUser.first_name,
      last_name: searchUser.last_name,
      total:
        Array.isArray(amountCosts) && amountCosts.length > 0
        ? amountCosts[0].total
        : 0,

    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
