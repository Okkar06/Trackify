const { getSupabaseAdminClient } = require('../config/supabase');
const { HttpError } = require('../utils/httpError');

const DEFAULTS = {
  defaultPayRate: 0,
  defaultWeekendPayRate: 0,
  defaultBreakTime: 1,
  defaultMealAllowance: 0,
};

const toNumber = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
};

const toSettings = (row) => {
  if (!row) return { ...DEFAULTS };
  return {
    defaultPayRate: Number(row.default_pay_rate),
    defaultWeekendPayRate: Number(row.default_weekend_pay_rate),
    defaultBreakTime: Number(row.default_break_time),
    defaultMealAllowance: Number(row.default_meal_allowance),
  };
};

const getWorkSettings = async ({ userId }) => {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('user_work_settings')
    .select('default_pay_rate, default_weekend_pay_rate, default_break_time, default_meal_allowance')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new HttpError(error.message, 400);
  return { workSettings: toSettings(data) };
};

const updateWorkSettings = async ({ userId, input }) => {
  const defaultPayRate = toNumber(input.defaultPayRate, DEFAULTS.defaultPayRate);
  const defaultWeekendPayRate = toNumber(input.defaultWeekendPayRate, DEFAULTS.defaultWeekendPayRate);
  const defaultBreakTime = toNumber(input.defaultBreakTime, DEFAULTS.defaultBreakTime);
  const defaultMealAllowance = toNumber(input.defaultMealAllowance, DEFAULTS.defaultMealAllowance);

  if (!Number.isFinite(defaultPayRate) || defaultPayRate < 0) throw new HttpError('Invalid defaultPayRate', 400);
  if (!Number.isFinite(defaultWeekendPayRate) || defaultWeekendPayRate < 0) {
    throw new HttpError('Invalid defaultWeekendPayRate', 400);
  }
  if (!Number.isFinite(defaultBreakTime) || defaultBreakTime < 0) throw new HttpError('Invalid defaultBreakTime', 400);
  if (!Number.isFinite(defaultMealAllowance) || defaultMealAllowance < 0) {
    throw new HttpError('Invalid defaultMealAllowance', 400);
  }

  const supabase = getSupabaseAdminClient();
  const payload = {
    user_id: userId,
    default_pay_rate: defaultPayRate,
    default_weekend_pay_rate: defaultWeekendPayRate,
    default_break_time: defaultBreakTime,
    default_meal_allowance: defaultMealAllowance,
  };

  const { data, error } = await supabase
    .from('user_work_settings')
    .upsert(payload, { onConflict: 'user_id' })
    .select('default_pay_rate, default_weekend_pay_rate, default_break_time, default_meal_allowance')
    .maybeSingle();

  if (error) throw new HttpError(error.message, 400);
  return { workSettings: toSettings(data) };
};

module.exports = {
  getWorkSettings,
  updateWorkSettings,
};

