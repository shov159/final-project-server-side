const express = require("express");
const router = express.Router();
const Cost = require("../models/costs");
const User = require("../models/users");

// POST /api/add
router.post("/add", async (req, res) => {
  try {
    const { userid, description, category, sum } = req.body;

    if (!userid || !description || !category || !sum) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const now = new Date();
    const newCost = new Cost({
      userid,
      description,
      category,
      sum,
      day: now.getDate(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });

    const saved = await newCost.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/report
router.get("/report", async (req, res) => {
  try {
    const { id, year, month } = req.query;

    if (!id || !year || !month) {
      return res.status(400).json({ error: "Missing id, year or month" });
    }

    const costs = await Cost.find({
      userid: Number(id),
      year: Number(year),
      month: Number(month),
    });

    const categories = ["food", "health", "housing", "sport", "education"];
    const groupedCosts = categories.map((category) => ({
      [category]: costs
        .filter((item) => item.category === category)
        .map((item) => ({
          sum: item.sum,
          description: item.description,
          day: item.day,
        })),
    }));

    res.json({
      userid: Number(id),
      year: Number(year),
      month: Number(month),
      costs: groupedCosts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id
router.get("/users/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const user = await User.findOne({ id: userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const total = await Cost.aggregate([
      { $match: { userid: userId } },
      { $group: { _id: null, total: { $sum: "$sum" } } },
    ]);

    res.json({
      first_name: user.first_name,
      last_name: user.last_name,
      id: user.id,
      total: total[0] ? total[0].total : 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/about
router.get("/about", async (req, res) => {
  try {
    const users = await User.find({}, { _id: 0, first_name: 1, last_name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
