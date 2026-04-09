const { asyncHandler } = require('../utils/asyncHandler');
const {
  getCalendarDates,
  getEntriesForDate,
  getMonthlySummary,
  parseMonthYearQuery,
} = require('../services/dashboardService');

const monthlySummary = asyncHandler(async (req, res) => {
  const { month, year } = parseMonthYearQuery(req.query);
  const data = await getMonthlySummary({ userId: req.userId, month, year });
  res.status(200).json(data);
});

const calendar = asyncHandler(async (req, res) => {
  const { month, year } = parseMonthYearQuery(req.query);
  const data = await getCalendarDates({ userId: req.userId, month, year });
  res.status(200).json({ dates: data });
});

const dateDetails = asyncHandler(async (req, res) => {
  const data = await getEntriesForDate({ userId: req.userId, date: req.params.date });
  res.status(200).json(data);
});

module.exports = {
  calendar,
  dateDetails,
  monthlySummary,
};

