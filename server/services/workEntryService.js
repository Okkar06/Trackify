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

const isWeekend = (dateStr) => {
  const date = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  const day = date.getUTCDay();
  return day === 0 || day === 6;
};

const calculateWorkEntry = ({ date, startTime, endTime, breakTime, payRate, weekendPayRate, mealAllowance }) => {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) {
    throw new HttpError('Invalid start_time or end_time (expected HH:MM)', 400);
  }

  if (endMinutes <= startMinutes) {
    throw new HttpError('End time must be after start time', 400);
  }

  const totalHours = (endMinutes - startMinutes) / 60;
  const breakHours = breakTime;
  const payableHours = totalHours - breakHours;
  if (payableHours < 0) {
    throw new HttpError('Break time cannot exceed total hours', 400);
  }

  const weekend = isWeekend(date);
  const appliedRate = weekend && weekendPayRate > 0 ? weekendPayRate : payRate;
  const totalPay = payableHours * appliedRate + mealAllowance;

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
  const meal_allowance = toNumber(input.meal_allowance, 0);

  if (!Number.isFinite(break_time) || break_time < 0) throw new HttpError('break_time must be a non-negative number', 400);
  if (!Number.isFinite(pay_rate) || pay_rate < 0) throw new HttpError('pay_rate is required and must be >= 0', 400);
  if (!Number.isFinite(weekend_pay_rate) || weekend_pay_rate < 0) {
    throw new HttpError('weekend_pay_rate must be >= 0', 400);
  }
  if (!Number.isFinite(meal_allowance) || meal_allowance < 0) {
    throw new HttpError('meal_allowance must be >= 0', 400);
  }

  return {
    date,
    start_time,
    end_time,
    break_time,
    pay_rate,
    weekend_pay_rate,
    meal_allowance,
    notes,
  };
};

const createWorkEntry = async ({ userId, input }) => {
  const validated = validateWorkEntryInput(input);
  const calc = calculateWorkEntry({
    date: validated.date,
    startTime: validated.start_time,
    endTime: validated.end_time,
    breakTime: validated.break_time,
    payRate: validated.pay_rate,
    weekendPayRate: validated.weekend_pay_rate,
    mealAllowance: validated.meal_allowance,
  });

  const supabase = getSupabaseAdminClient();
  const payload = {
    user_id: userId,
    ...validated,
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
  const calc = calculateWorkEntry({
    date: validated.date,
    startTime: validated.start_time,
    endTime: validated.end_time,
    breakTime: validated.break_time,
    payRate: validated.pay_rate,
    weekendPayRate: validated.weekend_pay_rate,
    mealAllowance: validated.meal_allowance,
  });

  const supabase = getSupabaseAdminClient();
  const updates = {
    ...validated,
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

