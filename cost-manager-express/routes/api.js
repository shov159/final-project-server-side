/**
 * All the API routes for the project:
 * - Add cost
 * - Monthly report
 * - User details
 * - Development team info
 */
const express = require("express");
const router = express.Router();
const User = require("../models/users");
const Cost = require("../models/costs");
const MonthlyReport = require("../models/monthlyReport");

/**
 * Add a new cost for a user.
 * @route POST /add
 * @body {string} userid - User ID
 * @body {string} description - Cost description
 * @body {string} category - Cost category (food, health, housing, sport, education)
 * @body {number} sum - Cost amount (must be positive)
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
      return res
        .status(400)
        .json({
          error:
            "Missing or invalid parameters. Required: userid, description, category, sum (positive).",
        });
    }

    const validCategories = ["food", "health", "housing", "sport", "education"];
    if (!validCategories.includes(req.body.category)) {
      return res
        .status(400)
        .json({
          error:
            "Invalid category. Allowed: food, health, housing, sport, education.",
        });
    }

    const costDate = req.body.date
      ? new Date(req.body.date + "T00:00:00.000Z")
      : new Date();
    if (isNaN(costDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format." });
    }

    const foundUser = await User.findOne({ id: userId });
    if (!foundUser) {
      return res.status(404).json({ error: "User not found." });
    }

    const newCost = new Cost({
      description: req.body.description,
      category: req.body.category,
      userid: userId,
      sum: req.body.sum,
      date: costDate,
    });

    const savedCost = await newCost.save();

    const year = costDate.getFullYear();
    const month = costDate.getMonth() + 1;

    const existingMonthlyReport = await MonthlyReport.findOne({
      userid: userId,
      year,
      month,
    });
    if (existingMonthlyReport) {
      if (!existingMonthlyReport.costs[req.body.category]) {
        existingMonthlyReport.costs[req.body.category] = [];
      }

      await MonthlyReport.updateOne(
        { userid: userId, year, month },
        {
          $push: {
            [`costs.${req.body.category}`]: {
              sum: savedCost.sum,
              description: savedCost.description,
              day: costDate.getDate(),
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
 * @query {string} id - User ID
 * @query {number} year - Year
 * @query {number} month - Month (1-12)
 */
router.get("/report", async (req, res) => {
  try {
    const { id, year, month } = req.query;

    if (!id || !year || !month) {
      return res.status(400).json({ error: "Missing required parameters." });
    }

    const trimmedId = id.trim();
    const yearNum = Number(year);
    const monthNum = Number(month);

    if (
      !Number.isInteger(yearNum) ||
      !Number.isInteger(monthNum) ||
      monthNum < 1 ||
      monthNum > 12
    ) {
      return res.status(400).json({ error: "Invalid year or month." });
    }

    const foundUser = await User.findOne({ id: trimmedId });
    if (!foundUser) {
      return res.status(404).json({ error: "User not found." });
    }

    const existingReport = await MonthlyReport.findOne({
      userid: trimmedId,
      year: yearNum,
      month: monthNum,
    })
      .select("-_id -__v")
      .lean();

    if (existingReport) {
      return res.json(existingReport);
    }

    const validCategories = ["food", "health", "housing", "sport", "education"];
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0);

    const currentCosts = await Cost.aggregate([
      {
        $match: {
          userid: trimmedId,
          date: { $gte: startDate, $lte: endDate },
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

    const newReport = new MonthlyReport({
      userid: trimmedId,
      year: yearNum,
      month: monthNum,
      costs: formattedCosts,
    });

    await newReport.save();

    const responseObject = newReport.toObject();
    delete responseObject._id;
    delete responseObject.__v;
    res.json(responseObject);
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
      return res.status(400).json({ error: "User ID is required." });
    }

    const foundUser = await User.findOne({ id }, "first_name last_name id");
    if (!foundUser) {
      return res.status(404).json({ error: "User not found." });
    }

    const totalCosts = await Cost.aggregate([
      { $match: { userid: id } },
      { $group: { _id: null, total: { $sum: "$sum" } } },
    ]);

    res.status(200).json({
      id: foundUser.id,
      first_name: foundUser.first_name,
      last_name: foundUser.last_name,
      total:
        Array.isArray(totalCosts) && totalCosts.length > 0
          ? totalCosts[0].total
          : 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get list of developers (team).
 * @route GET /about
 */
router.get("/about", async (req, res) => {
  try {
    const team = [
      { first_name: "Shoval", last_name: "Markowitz" },
      { first_name: "Adi", last_name: "Cheifetz" },
    ];
    res.status(200).json(team);
  } catch (error) {
    res.status(500).json({ error: "Failed to load team data." });
  }
});

module.exports = router;
