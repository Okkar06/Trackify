const { asyncHandler } = require('../utils/asyncHandler');
const { getMonthlyPay, getYearlyPay, parseMonthlyQuery, parseYearlyQuery } = require('../services/payService');

const monthly = asyncHandler(async (req, res) => {
  const { month, year } = parseMonthlyQuery(req.query);
  const data = await getMonthlyPay({ userId: req.userId, month, year });
  res.status(200).json(data);
});

const yearly = asyncHandler(async (req, res) => {
  const { year } = parseYearlyQuery(req.query);
  const data = await getYearlyPay({ userId: req.userId, year });
  res.status(200).json(data);
});

module.exports = {
  monthly,
  yearly,
};

