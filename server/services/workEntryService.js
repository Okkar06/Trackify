const { getSupabaseAdminClient } = require('../config/supabase');
const { HttpError } = require('../utils/httpError');

const toNumber = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
};

const asString = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

const parseTimeToMinutes = (timeStr) => {
  const value = asString(timeStr);
  if (!value) return NaN;

  const match = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return NaN;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return NaN;
  if (hours < 0 || hours > 23) return NaN;
  if (minutes < 0 || minutes > 59) return NaN;
  return hours * 60 + minutes;
};

const round2 = (num) => Math.round(num * 100) / 100;

const REGULAR_PAY_RATE = 13;
const SPECIAL_PAY_RATE = 15;
const DEFAULT_MEAL_ALLOWANCE = 4.5;

let cachedPublicHolidaySet;
const getPublicHolidaySetFromEnv = () => {
  if (cachedPublicHolidaySet) return cachedPublicHolidaySet;
  const raw = String(process.env.PUBLIC_HOLIDAYS || '').trim();
  const dates = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((d) => d.replaceAll('/', '-'));
  cachedPublicHolidaySet = new Set(dates);
  return cachedPublicHolidaySet;
};

const isWeekend = (dateStr) => {
  const date = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  const day = date.getUTCDay();
  return day === 0 || day === 6;
};

const isPublicHoliday = async ({ supabase, date }) => {
  const envSet = getPublicHolidaySetFromEnv();
  if (envSet.has(date)) return true;

  const { data, error } = await supabase.from('public_holidays').select('date').eq('date', date).maybeSingle();
  if (error) {
    const msg = String(error.message || '');
    if (msg.includes('public_holidays') && msg.includes('does not exist')) return false;
    return false;
  }

  return Boolean(data?.date);
};

const getAppliedRate = async ({ supabase, date }) => {
  const weekend = isWeekend(date);
  if (weekend) return SPECIAL_PAY_RATE;
  const holiday = await isPublicHoliday({ supabase, date });
  if (holiday) return SPECIAL_PAY_RATE;
  return REGULAR_PAY_RATE;
};

const calculateWorkEntry = ({ startTime, endTime, breakTime, payRate, mealAllowance }) => {
  const startMinutes = parseTimeToMinutes(startTime);
  let endMinutes = parseTimeToMinutes(endTime);
  if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) {
    throw new HttpError('Invalid start_time or end_time (expected HH:MM)', 400);
  }

  if (endMinutes === startMinutes) {
    throw new HttpError('End time must be different from start time', 400);
  }

  if (endMinutes < startMinutes) endMinutes += 24 * 60;

  const totalHours = (endMinutes - startMinutes) / 60;
  const breakHours = breakTime;
  const payableHours = totalHours - breakHours;
  if (payableHours < 0) {
    throw new HttpError('Break time cannot exceed total hours', 400);
  }

  const totalPay = payableHours * payRate + mealAllowance;

  return {
    total_hours: round2(totalHours),
    payable_hours: round2(payableHours),
    total_pay: round2(totalPay),
  };
};

const validateWorkEntryInput = (input) => {
  const date = asString(input.date);
  const start_time = asString(input.start_time);
  const end_time = asString(input.end_time);
  const notes = input.notes === undefined ? undefined : asString(input.notes);

  if (!date) throw new HttpError('date is required', 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError('date must be YYYY-MM-DD', 400);
  if (!start_time) throw new HttpError('start_time is required', 400);
  if (!end_time) throw new HttpError('end_time is required', 400);

  const break_time = toNumber(input.break_time, 1);
  const pay_rate = toNumber(input.pay_rate, NaN);
  const weekend_pay_rate = toNumber(input.weekend_pay_rate, 0);
  const meal_allowance = toNumber(input.meal_allowance, NaN);

  if (!Number.isFinite(break_time) || break_time < 0) throw new HttpError('break_time must be a non-negative number', 400);
  if (Number.isFinite(pay_rate) && pay_rate < 0) throw new HttpError('pay_rate must be >= 0', 400);
  if (!Number.isFinite(weekend_pay_rate) || weekend_pay_rate < 0) {
    throw new HttpError('weekend_pay_rate must be >= 0', 400);
  }

  const normalizedMealAllowance = break_time > 0 ? (Number.isFinite(meal_allowance) ? meal_allowance : DEFAULT_MEAL_ALLOWANCE) : 0;
  if (!Number.isFinite(normalizedMealAllowance) || normalizedMealAllowance < 0) {
    throw new HttpError('meal_allowance must be >= 0', 400);
  }

  return {
    date,
    start_time,
    end_time,
    break_time,
    pay_rate: Number.isFinite(pay_rate) ? pay_rate : null,
    weekend_pay_rate,
    meal_allowance: normalizedMealAllowance,
    notes,
  };
};

const createWorkEntry = async ({ userId, input }) => {
  const validated = validateWorkEntryInput(input);
  const supabase = getSupabaseAdminClient();
  const appliedRate = Number.isFinite(validated.pay_rate) ? validated.pay_rate : await getAppliedRate({ supabase, date: validated.date });
  const calc = calculateWorkEntry({
    startTime: validated.start_time,
    endTime: validated.end_time,
    breakTime: validated.break_time,
    payRate: appliedRate,
    mealAllowance: validated.meal_allowance,
  });

  const payload = {
    user_id: userId,
    ...validated,
    pay_rate: appliedRate,
    weekend_pay_rate: SPECIAL_PAY_RATE,
    ...calc,
  };

  const { data, error } = await supabase.from('work_entries').insert(payload).select('*').maybeSingle();
  if (error) throw new HttpError(error.message, 400);
  return { workEntry: data };
};

const listWorkEntries = async ({ userId }) => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('work_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('start_time', { ascending: false });

  if (error) throw new HttpError(error.message, 400);
  return { workEntries: data };
};

const getWorkEntryById = async ({ userId, id }) => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from('work_entries').select('*').eq('id', id).eq('user_id', userId).maybeSingle();
  if (error) throw new HttpError(error.message, 400);
  if (!data) throw new HttpError('Work entry not found', 404);
  return { workEntry: data };
};

const updateWorkEntryById = async ({ userId, id, input }) => {
  const validated = validateWorkEntryInput(input);
  const supabase = getSupabaseAdminClient();
  const appliedRate = Number.isFinite(validated.pay_rate) ? validated.pay_rate : await getAppliedRate({ supabase, date: validated.date });
  const calc = calculateWorkEntry({
    startTime: validated.start_time,
    endTime: validated.end_time,
    breakTime: validated.break_time,
    payRate: appliedRate,
    mealAllowance: validated.meal_allowance,
  });

  const updates = {
    ...validated,
    pay_rate: appliedRate,
    weekend_pay_rate: SPECIAL_PAY_RATE,
    ...calc,
  };

  const { data, error } = await supabase
    .from('work_entries')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .maybeSingle();

  if (error) throw new HttpError(error.message, 400);
  if (!data) throw new HttpError('Work entry not found', 404);
  return { workEntry: data };
};

const deleteWorkEntryById = async ({ userId, id }) => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from('work_entries').delete().eq('id', id).eq('user_id', userId).select('id').maybeSingle();
  if (error) throw new HttpError(error.message, 400);
  if (!data) throw new HttpError('Work entry not found', 404);
  return { ok: true };
};

module.exports = {
  createWorkEntry,
  deleteWorkEntryById,
  getWorkEntryById,
  listWorkEntries,
  updateWorkEntryById,
};
