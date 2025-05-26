/**
 * ------------------------------------------------------------------
 *  Cost-Manager – Main API routes
 * ------------------------------------------------------------------
 *  End-points
 *  ----------
 *  POST  /api/add           – add a single cost item
 *  GET   /api/report        – monthly report grouped by category
 *  GET   /api/users/:id     – user info + running total of all costs
 *  GET   /api/about         – who built this project
 *
 *  Notes
 *  -----
 *  • All IDs are stored *as strings* (they arrive from the client as
 *    strings anyway – we avoid the usual Number precision trap).
 *  • Validation is **strict and early** – nothing hits the DB before
 *    the request is proven well-formed.
 *  • A simple write-through cache (MonthlyReport collection) is used
 *    to avoid re-aggregating a month that was already computed.
 * ------------------------------------------------------------------
 */

const express = require("express");
const router = express.Router();

const User = require("../models/users");
const Cost = require("../models/costs");
const MonthlyReport = require("../models/monthlyReport");

/* ------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------- */
const VALID_CATEGORIES = ["food", "health", "housing", "sport", "education"];

/** Assert a boolean condition or throw a 400. */
function ensure(cond, msg) {
  if (!cond) throw Object.assign(new Error(msg), { code: 400 });
}

/** Parse YYYY-MM-DD (any ISO) into a Date object at midnight UTC. */
function safeIsoDate(str) {
  const d = new Date(`${str}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/* ------------------------------------------------------------------
 * 1)  POST /api/add  – create a cost record
 * ---------------------------------------------------------------- */
router.post("/add", async (req, res) => {
  try {
    const { userid, description, category, sum, date } = req.body;

    /* ---------- basic validation ---------- */
    ensure(userid, "userid is required");
    ensure(description, "description is required");
    ensure(category, "category is required");
    ensure(
      VALID_CATEGORIES.includes(category),
      `category must be one of: ${VALID_CATEGORIES.join(", ")}`
    );
    ensure(typeof sum === "number" && sum > 0, "sum must be a positive number");

    const costDate = date ? safeIsoDate(date) : new Date();
    ensure(costDate, "Invalid date format – use YYYY-MM-DD");

    /* ---------- user must exist ---------- */
    const person = await User.findOne({ id: String(userid).trim() });
    if (!person) return res.status(404).json({ error: "User not found" });

    /* ---------- create & save ---------- */
    const costDoc = await new Cost({
      userid: String(userid).trim(),
      description,
      category,
      sum,
      date: costDate,
    }).save();

    /* ---------- write-through cache update (if report document exists) ---------- */
    const y = costDate.getUTCFullYear();
    const m = costDate.getUTCMonth() + 1; // 1-based

    await MonthlyReport.updateOne(
      { userid: costDoc.userid, year: y, month: m },
      {
        $push: {
          [`costs.${category}`]: {
            sum,
            description,
            day: costDate.getUTCDate(),
          },
        },
      }
    ).catch(() => {}); // if no doc – ignore, we’ll create it on demand

    /* ---------- done ---------- */
    res.status(201).json(costDoc);
  } catch (err) {
    const status = err.code === 400 ? 400 : 500;
    res.status(status).json({ error: err.message || "Server error" });
  }
});

/* ------------------------------------------------------------------
 * 2)  GET /api/report?id=&year=&month=
 * ---------------------------------------------------------------- */
router.get("/report", async (req, res) => {
  try {
    const { id, year, month } = req.query;

    /* ---------- strong input validation ---------- */
    ensure(id, "id is required");
    const yearNum = Number(year);
    const monthNum = Number(month);

    ensure(Number.isInteger(yearNum), "year must be an integer");
    ensure(
      Number.isInteger(monthNum) && monthNum >= 1 && monthNum <= 12,
      "month must be an integer between 1 and 12"
    );

    /* ---------- user exists? ---------- */
    const person = await User.findOne({ id: id.trim() });
    if (!person) return res.status(404).json({ error: "User not found" });

    /* ---------- try cached report ---------- */
    const cached = await MonthlyReport.findOne({
      userid: id.trim(),
      year: yearNum,
      month: monthNum,
    })
      .select("-_id -__v")
      .lean();
    if (cached) return res.json(cached);

    /* ---------- compute fresh report ---------- */
    const firstDay = new Date(Date.UTC(yearNum, monthNum - 1, 1));
    const lastDay = new Date(Date.UTC(yearNum, monthNum, 0, 23, 59, 59));

    const raw = await Cost.aggregate([
      {
        $match: {
          userid: id.trim(),
          category: { $in: VALID_CATEGORIES },
          date: { $gte: firstDay, $lte: lastDay },
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

    /* ---------- normalise to full category list ---------- */
    const costs = Object.fromEntries(VALID_CATEGORIES.map((cat) => [cat, []]));
    raw.forEach((r) => {
      costs[r._id] = r.items;
    });

    /* ---------- store cache & return ---------- */
    const rep = await new MonthlyReport({
      userid: id.trim(),
      year: yearNum,
      month: monthNum,
      costs,
    }).save();

    const out = rep.toObject();
    delete out._id;
    delete out.__v;
    res.json(out);
  } catch (err) {
    const status = err.code === 400 ? 400 : 500;
    res.status(status).json({ error: err.message || "Server error" });
  }
});

/* ------------------------------------------------------------------
 * 3)  GET /api/users/:id  – simple user card + total spent
 * ---------------------------------------------------------------- */
router.get("/users/:id", async (req, res) => {
  try {
    const id = req.params.id?.trim();
    ensure(id, "User ID is required");

    const person = await User.findOne({ id }, "first_name last_name id");
    if (!person) return res.status(404).json({ error: "User not found" });

    const [{ total = 0 } = {}] = await Cost.aggregate([
      { $match: { userid: id } },
      { $group: { _id: null, total: { $sum: "$sum" } } },
    ]);

    res.json({ ...person.toObject(), total });
  } catch (err) {
    const status = err.code === 400 ? 400 : 500;
    res.status(status).json({ error: err.message || "Server error" });
  }
});

/* ------------------------------------------------------------------
 * 4)  GET /api/about  – who we are
 * ---------------------------------------------------------------- */
router.get("/about", (req, res) => {
  res.json([
    { first_name: "Shoval", last_name: "Markowitz" },
    { first_name: "Adi", last_name: "Cheifetz" },
  ]);
});

/* ------------------------------------------------------------------ */
module.exports = router;
